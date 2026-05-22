/**
 * Script 转换器
 */

import { traverseAST, generateCode, isCallExpression, isIdentifier, isVariableDeclaration, PathResolver, createPathResolver, createDefineExposeDegradeRecord, createDefineOptionsDegradeRecord, createDefineSlotsDegradeRecord, createProvideInjectDegradeRecord, createUseIdNativeRecord, createUseTemplateRefDegradeRecord, createWatcherDegradeRecord, generateUseIdComponentInitCode, getUseIdEntries, mergeUseTemplateRefDegradeRecord } from '@/utils/index.js'
import { VUE3_MACROS } from '@/types/index.js'
import type { TransformContext, MacroHandler } from '@/types/index.js'
import type { ScriptParseResult } from '@/parser/index.js'
import {
  definePropsHandler,
  defineEmitsHandler,
  refHandler,
  reactiveHandler,
  computedHandler,
  createLifecycleHandler
} from './macro-handlers/index.js'
import { applyPropAccessMappingsToScript, hasPropAccessMappings, registerPropNamespace } from './prop-access-mapping.js'
import { normalizeComputedGetter } from './computed-getter-utils.js'
import { resolveTypeReferenceParameters } from './type-reference-resolver.js'
import { createLiteralNodeFromValue, parseScriptInitValue } from './script-value-utils.js'
import {
  appendLifecycleCode,
  createScriptTransformContext,
  getConstructorFromTypeName,
  mergePropDefaults
} from './script-transformer-utils.js'
import { logger } from '@/utils/index.js'

/**
 * Script 转换结果
 */
export interface ScriptTransformResult {
  /** 生成的 JavaScript 代码 */
  js: string
  /** 组件配置 JSON */
  json: Record<string, any>
  /** 转换上下文 */
  context: TransformContext
}

/**
 * Script 转换器类
 */
export class ScriptTransformer {
  private macroHandlers: Map<string, MacroHandler>
  private pathResolver: PathResolver | null = null

  constructor() {
    this.macroHandlers = new Map()
    this.initMacroHandlers()
  }

  /**
   * 设置路径解析器
   */
  setPathResolver(projectRoot: string): void {
    this.pathResolver = createPathResolver(projectRoot)
  }

  /**
   * 初始化宏处理器
   */
  private initMacroHandlers(): void {
    // defineProps 和 defineEmits
    this.macroHandlers.set('defineProps', definePropsHandler)
    this.macroHandlers.set('defineEmits', defineEmitsHandler)

    // 响应式 API
    this.macroHandlers.set('ref', refHandler)
    this.macroHandlers.set('reactive', reactiveHandler)
    this.macroHandlers.set('computed', computedHandler)

    // 生命周期钩子
    const lifecycleHooks = [
      'onBeforeMount', 'onMounted', 'onBeforeUpdate', 'onUpdated',
      'onBeforeUnmount', 'onUnmounted', 'onActivated', 'onDeactivated',
      'onLoad', 'onShow', 'onReady', 'onHide', 'onUnload'
    ]

    lifecycleHooks.forEach(hook => {
      this.macroHandlers.set(hook, createLifecycleHandler(hook))
    })
  }

  /**
   * 转换脚本
   */
  async transformScript(
    parseResult: ScriptParseResult,
    filename: string,
    isPage: boolean = false
  ): Promise<ScriptTransformResult> {
    try {
      logger.debug(`转换脚本: ${filename}`)

      // 初始化转换上下文
      const context = createScriptTransformContext(filename, isPage)

      // 处理导入
      this.processImports(parseResult, context)

      // 处理宏调用
      this.processMacros(parseResult, context)

      // 处理变量声明
      this.processVariables(parseResult, context)
      this.processLifecyclePropAliases(context)

      // 处理函数声明
      this.processFunctions(parseResult, context)
      this.processMethodPropAliases(context)

      // 生成代码
      const result = this.generateCode(context)

      logger.debug(`脚本转换完成: ${filename}`)
      return result

    } catch (error) {
      logger.error(`脚本转换失败: ${filename}`, error as Error)
      throw error
    }
  }

  /**
   * 处理导入
   */
  private processImports(parseResult: ScriptParseResult, context: TransformContext): void {
    if (!parseResult.imports) {
      return
    }

    parseResult.imports.forEach((importInfo, source) => {
      if (importInfo.isVue) {
        // Vue 导入
        importInfo.specifiers.forEach(spec => {
          context.imports.add(spec.local)
        })
      } else if (importInfo.isComponent) {
        // 组件导入
        importInfo.specifiers.forEach(spec => {
          if (spec.type === 'default') {
            context.components.set(spec.local, source)
          }
        })
      } else if (importInfo.isStyle) {
        // 样式导入 - 记录到上下文中，稍后在编译器中处理
        if (!context.styleImports) {
          context.styleImports = []
        }
        context.styleImports.push(source)
        logger.debug(`发现样式导入: ${source}`)
      }
    })
  }

  /**
   * 处理宏调用
   */
  private processMacros(parseResult: ScriptParseResult, context: TransformContext): void {
    if (!parseResult.macros) {
      return
    }

    parseResult.macros.forEach((macroCalls, macroName) => {
      if (macroName === 'defineExpose') {
        macroCalls.forEach(macroCall => this.processDefineExposeMacro(macroCall, context))
        return
      }
      if (macroName === 'defineOptions') {
        macroCalls.forEach(macroCall => this.processDefineOptionsMacro(macroCall, context))
        return
      }
      if (['watch', 'watchEffect', 'onWatcherCleanup'].includes(macroName)) {
        macroCalls.forEach(macroCall => this.processWatcherMacro(macroCall, context))
        return
      }
      if (['provide', 'inject'].includes(macroName)) {
        macroCalls.forEach(macroCall => this.processProvideInjectMacro(macroCall, context))
        return
      }

      const handler = this.macroHandlers.get(macroName)
      if (handler) {
        macroCalls.forEach(macroCall => {
          try {
            // 构造一个简单的 CallExpression 节点，包含 TypeScript 泛型
            const node = {
              type: 'CallExpression',
              callee: { type: 'Identifier', name: macroName },
              arguments: macroCall.arguments.map(arg => createLiteralNodeFromValue(arg)),
              typeParameters: ['defineProps', 'defineEmits'].includes(macroName)
                ? resolveTypeReferenceParameters(macroCall.typeParameters, parseResult, context.filename)
                : macroCall.typeParameters // 传递 TypeScript 泛型参数
            } as any

            handler(node, context)
          } catch (error) {
            logger.error(`宏处理失败: ${macroName}`, error as Error)
          }
        })
      }
    })
  }

  /**
   * defineExpose 依赖 Vue public instance/template ref，原生小程序目标无法可靠等价映射。
   */
  private processDefineExposeMacro(macroCall: any, context: TransformContext): void {
    const previousKeys = Array.isArray(context.expose?.keys) ? context.expose.keys : []
    context.expose = createDefineExposeDegradeRecord(macroCall.arguments?.[0], previousKeys)

    logger.warn(`defineExpose 已在原生小程序目标下降级: ${context.filename}`)
  }

  /**
   * defineOptions 依赖 Vue component options 合并语义，原生目标暂不伪造等价支持。
   */
  private processDefineOptionsMacro(macroCall: any, context: TransformContext): void {
    const previousKeys = Array.isArray(context.defineOptions?.keys) ? context.defineOptions.keys : []
    context.defineOptions = createDefineOptionsDegradeRecord(macroCall.arguments?.[0], previousKeys)

    logger.warn(`defineOptions 已在原生小程序目标下降级: ${context.filename}`)
  }

  /**
   * watch/watchEffect/onWatcherCleanup 依赖 Vue watcher 调度与 cleanup 语义，原生目标暂不伪造等价支持。
   */
  private processWatcherMacro(macroCall: any, context: TransformContext): void {
    const previousApis = Array.isArray(context.watcherEffects?.apis) ? context.watcherEffects.apis : []
    context.watcherEffects = createWatcherDegradeRecord(macroCall.name, previousApis)

    logger.warn(`${macroCall.name} 已在原生小程序目标下降级: ${context.filename}`)
  }

  /**
   * provide/inject 依赖 Vue 实例树注入上下文，原生目标暂不伪造等价支持。
   */
  private processProvideInjectMacro(macroCall: any, context: TransformContext): void {
    context.provideInject = createProvideInjectDegradeRecord(
      macroCall.name,
      String(macroCall.arguments?.[0] || ''),
      '',
      context.provideInject || {}
    )

    logger.warn(`${macroCall.name} 已在原生小程序目标下降级: ${context.filename}`)
  }

  /**
   * 处理变量声明
   */
  private processVariables(parseResult: ScriptParseResult, context: TransformContext): void {
    if (!parseResult.variables) {
      return
    }

    parseResult.variables.forEach((variable, name) => {
      if (variable.macroType === 'defineModel') {
        this.processDefineModelVariable(variable, context)
      } else if (variable.macroType === 'defineProps') {
        registerPropNamespace(context, variable.init?.variable || variable.name)
      } else if (variable.macroType === 'defineEmits') {
        // defineEmits 已在宏处理阶段写入 context.emits；这里仅擦除 setup 变量。
      } else if (variable.macroType === 'withDefaults') {
        this.processWithDefaultsVariable(variable, context)
      } else if (variable.macroType === 'definePropsDestructure') {
        this.processDefinePropsDestructureVariable(variable, context)
      } else if (variable.macroType === 'defineSlots') {
        this.processDefineSlotsVariable(variable, context)
      } else if (variable.macroType === 'useTemplateRef') {
        this.processUseTemplateRefVariable(variable, context)
      } else if (variable.macroType === 'useId') {
        this.processUseIdVariable(variable, context)
      } else if (variable.macroType === 'inject') {
        this.processInjectVariable(variable, context)
      } else if (variable.isReactive) {
        // 响应式变量
        if (variable.macroType === 'computed') {
          // 计算属性 - 转换 getter 中的响应式变量访问
          const getter = this.transformComputedGetter(variable.init || 'return null', parseResult, context)
          context.computed[name] = {
            getter
          }
          // 保存响应式变量信息
          context.reactiveVariables!.set(name, {
            name,
            type: 'computed',
            initialValue: variable.init
          })
        } else {
          // ref/reactive 变量 - 确保保持原始数据类型
          const initialValue = parseScriptInitValue(variable.init)
          context.data[name] = initialValue
          // 保存响应式变量信息
          context.reactiveVariables!.set(name, {
            name,
            type: variable.macroType as 'ref' | 'reactive',
            initialValue
          })
        }
      } else {
        // 普通变量
        const initValue = variable.init

        // 检查是否为函数（包括箭头函数）
        if (typeof initValue === 'string' &&
          (initValue.includes('=>') ||
            initValue.includes('function') ||
            initValue.startsWith('(') && initValue.includes(') =>'))) {
          // 函数类型，直接使用原始字符串，运行时库会处理响应式变量
          context.methods[name] = {
            name,
            params: [],
            isAsync: false,
            isArrow: initValue.includes('=>'),
            body: initValue
          }
        } else {
          // 普通数据 - 确保保持原始数据类型
          context.data[name] = parseScriptInitValue(initValue)
        }
      }
    })
  }

  /**
   * 将 withDefaults 的默认值合并到 defineProps 生成的 properties。
   */
  private processWithDefaultsVariable(variable: any, context: TransformContext): void {
    const defaults = variable.init?.defaults || {}

    mergePropDefaults(defaults, context)
  }

  /**
   * 将响应式 props 解构的默认值与局部别名合并进上下文。
   */
  private processDefinePropsDestructureVariable(variable: any, context: TransformContext): void {
    const defaults = variable.init?.defaults || {}
    const aliases = variable.init?.aliases || {}

    mergePropDefaults(defaults, context)

    if (!context.propAliases) {
      context.propAliases = new Map()
    }
    Object.entries(aliases).forEach(([localName, propName]) => {
      context.propAliases!.set(localName, String(propName))
    })
  }

  /**
   * 将 defineModel 编译为原生小程序 property 与 update 事件。
   */
  private processDefineModelVariable(variable: any, context: TransformContext): void {
    const modelInfo = variable.init || {}
    const propName = modelInfo.property || 'modelValue'
    const propType = getConstructorFromTypeName(modelInfo.type)

    context.props[propName] = {
      type: propType,
      default: modelInfo.default,
      required: Boolean(modelInfo.required)
    }

    const updateEvent = `update:${propName}`
    if (!context.emits.includes(updateEvent)) {
      context.emits.push(updateEvent)
    }
  }

  /**
   * useTemplateRef 依赖 Vue template ref / DOM 或组件实例，原生小程序目标无法可靠等价映射。
   */
  private processUseTemplateRefVariable(variable: any, context: TransformContext): void {
    const refInfo = variable.init || {}
    const previousRefs = Array.isArray(context.templateRefs?.refs) ? context.templateRefs!.refs : []
    const record = createUseTemplateRefDegradeRecord(refInfo.ref, refInfo.variable || variable.name, previousRefs)
    context.templateRefs = mergeUseTemplateRefDegradeRecord(context.templateRefs, record)

    logger.warn(`useTemplateRef 已在原生小程序目标下降级: ${context.filename}`)
  }

  /**
   * 将 useId 编译为原生 data 中的稳定 id。
   */
  private processUseIdVariable(variable: any, context: TransformContext): void {
    const variableName = variable.init?.variable || variable.name
    const previousIds = getUseIdEntries(context.useIds || {})
    context.useIds = createUseIdNativeRecord(context.filename, variableName, previousIds)

    const entry = getUseIdEntries(context.useIds)
      .find(item => item.variable === variableName)
    if (!entry) {
      return
    }

    context.data[variableName] = entry.baseId

    if (!context.isPage) {
      appendLifecycleCode(context, 'attached', generateUseIdComponentInitCode(entry))
    }

    logger.info(`useId 已编译为原生小程序稳定 id: ${context.filename}`)
  }

  /**
   * inject 变量在原生目标下擦除，不落入 data。
   */
  private processInjectVariable(variable: any, context: TransformContext): void {
    context.provideInject = createProvideInjectDegradeRecord(
      'inject',
      String(variable.init?.key || ''),
      variable.init?.variable || variable.name,
      context.provideInject || {}
    )

    logger.warn(`inject 已在原生小程序目标下降级: ${context.filename}`)
  }

  /**
   * defineSlots 当前仅作为类型宏擦除，不生成 Vue slots 对象桥接。
   */
  private processDefineSlotsVariable(variable: any, context: TransformContext): void {
    context.defineSlots = createDefineSlotsDegradeRecord(variable.init?.variable || variable.name)
    logger.warn(`defineSlots 已在原生小程序目标下降级: ${context.filename}`)
  }

  /**
   * 处理函数声明
   */
  private processFunctions(parseResult: ScriptParseResult, context: TransformContext): void {
    if (!parseResult.functions) {
      return
    }

    parseResult.functions.forEach((func, name) => {
      context.methods[name] = func
    })
  }

  /**
   * 将生命周期回调中的 Vue 3.5 props 解构局部访问映射回原生 property 访问。
   */
  private processLifecyclePropAliases(context: TransformContext): void {
    if (!hasPropAccessMappings(context)) {
      return
    }

    Object.entries(context.lifecycle).forEach(([name, code]) => {
      context.lifecycle[name] = applyPropAccessMappingsToScript(code, context)
    })
  }

  /**
   * 将 setup 方法中的 Vue 3.5 props 解构局部访问映射回原生 property 访问。
   */
  private processMethodPropAliases(context: TransformContext): void {
    if (!hasPropAccessMappings(context)) {
      return
    }

    Object.values(context.methods).forEach(method => {
      if (method && typeof method === 'object' && typeof method.body === 'string') {
        method.body = applyPropAccessMappingsToScript(method.body, context)
      }
    })
  }

  /**
   * 生成代码
   */
  private generateCode(context: TransformContext): ScriptTransformResult {
    // 不在这里生成具体的 JS 代码，而是返回转换后的上下文
    // 具体的代码生成由 generator 模块负责
    return {
      js: '', // 由 generator 生成
      json: {}, // 由 generator 生成
      context
    }
  }

  /**
   * 转换 computed 属性的 getter 函数
   */
  private transformComputedGetter(getter: string, parseResult: ScriptParseResult, context: TransformContext): string {
    if (!getter || typeof getter !== 'string') {
      return 'return null'
    }

    // 转换 computed(() => expr) 这类源码片段为可直接放入方法体的 return 语句。
    let transformedGetter = normalizeComputedGetter(getter)

    // 获取所有响应式变量
    const reactiveVars = new Set<string>()
    parseResult.variables.forEach((variable, name) => {
      if (variable.isReactive && variable.macroType !== 'computed') {
        reactiveVars.add(name)
      }
    })

    // 转换每个响应式变量的访问
    reactiveVars.forEach(varName => {
      // 转换 varName.value 为 this.data.varName
      const thisAccessRegex = new RegExp(`\\bthis\\.${varName}\\.value\\b`, 'g')
      transformedGetter = transformedGetter.replace(thisAccessRegex, `this.data.${varName}`)

      const bareAccessRegex = new RegExp(`(?<![\\w$.])${varName}\\.value\\b`, 'g')
      transformedGetter = transformedGetter.replace(bareAccessRegex, `this.data.${varName}`)
    })

    return applyPropAccessMappingsToScript(transformedGetter, context)
  }

}
