/**
 * Script 转换器
 */

import {
  createPathResolver,
  logger
} from '@/utils/index.js'
import type { PathResolver } from '@/utils/index.js'
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
import { resolveTypeReferenceParameters } from './type-reference-resolver.js'
import { createLiteralNodeFromValue, parseScriptInitValue } from './script-value-utils.js'
import {
  applyDefineExposeMacro,
  applyDefineOptionsMacro,
  applyDefineSlotsVariable,
  applyInjectVariable,
  applyProvideInjectMacro,
  applyUseIdVariable,
  applyUseTemplateRefVariable,
  applyWatcherMacro
} from './script-native-boundary-utils.js'
import {
  applyDefineModelVariable,
  applyDefinePropsDestructureVariable,
  createMethodFromFunctionInitializer,
  createScriptTransformContext,
  isFunctionInitializer,
  mergePropDefaults,
  recordScriptImports,
  transformComputedGetter
} from './script-transformer-utils.js'

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
    recordScriptImports(parseResult.imports, context)
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
        macroCalls.forEach(macroCall => applyDefineExposeMacro(macroCall, context))
        return
      }
      if (macroName === 'defineOptions') {
        macroCalls.forEach(macroCall => applyDefineOptionsMacro(macroCall, context))
        return
      }
      if (['watch', 'watchEffect', 'onWatcherCleanup'].includes(macroName)) {
        macroCalls.forEach(macroCall => applyWatcherMacro(macroCall, context))
        return
      }
      if (['provide', 'inject'].includes(macroName)) {
        macroCalls.forEach(macroCall => applyProvideInjectMacro(macroCall, context))
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
   * 处理变量声明
   */
  private processVariables(parseResult: ScriptParseResult, context: TransformContext): void {
    if (!parseResult.variables) {
      return
    }

    parseResult.variables.forEach((variable, name) => {
      if (variable.macroType === 'defineModel') {
        applyDefineModelVariable(variable, context)
      } else if (variable.macroType === 'defineProps') {
        registerPropNamespace(context, variable.init?.variable || variable.name)
      } else if (variable.macroType === 'defineEmits') {
        // defineEmits 已在宏处理阶段写入 context.emits；这里仅擦除 setup 变量。
      } else if (variable.macroType === 'withDefaults') {
        this.processWithDefaultsVariable(variable, context)
      } else if (variable.macroType === 'definePropsDestructure') {
        applyDefinePropsDestructureVariable(variable, context)
      } else if (variable.macroType === 'defineSlots') {
        applyDefineSlotsVariable(variable, context)
      } else if (variable.macroType === 'useTemplateRef') {
        applyUseTemplateRefVariable(variable, context)
      } else if (variable.macroType === 'useId') {
        applyUseIdVariable(variable, context)
      } else if (variable.macroType === 'inject') {
        applyInjectVariable(variable, context)
      } else if (variable.isReactive) {
        // 响应式变量
        if (variable.macroType === 'computed') {
          // 计算属性 - 转换 getter 中的响应式变量访问
          const getter = transformComputedGetter(variable.init || 'return null', parseResult, context)
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
        if (isFunctionInitializer(initValue)) {
          // 函数类型，直接使用原始字符串，运行时库会处理响应式变量
          context.methods[name] = createMethodFromFunctionInitializer(name, initValue)
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

}
