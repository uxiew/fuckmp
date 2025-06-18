/**
 * Script 转换器
 */

import { traverseAST, generateCode, isCallExpression, isIdentifier, isVariableDeclaration, PathResolver, createPathResolver } from '@/utils/index.js'
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
      const context: TransformContext = {
        filename,
        isPage,
        hasScoped: false, // 默认为 false，稍后会根据样式信息更新
        props: {},
        emits: [],
        expose: {},
        data: {},
        methods: {},
        computed: {},
        watch: {},
        lifecycle: {},
        imports: new Set(),
        components: new Map(),
        reactiveVariables: new Map()
      }

      // 处理导入
      this.processImports(parseResult, context)

      // 处理宏调用
      this.processMacros(parseResult, context)

      // 处理变量声明
      this.processVariables(parseResult, context)

      // 处理函数声明
      this.processFunctions(parseResult, context)

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
      const handler = this.macroHandlers.get(macroName)
      if (handler) {
        macroCalls.forEach(macroCall => {
          try {
            // 构造一个简单的 CallExpression 节点，包含 TypeScript 泛型
            const node = {
              type: 'CallExpression',
              callee: { type: 'Identifier', name: macroName },
              arguments: macroCall.arguments.map(arg => this.createLiteralNode(arg)),
              typeParameters: macroCall.typeParameters // 传递 TypeScript 泛型参数
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
      if (variable.isReactive) {
        // 响应式变量
        if (variable.macroType === 'computed') {
          // 计算属性
          context.computed[name] = {
            getter: variable.init || 'return null'
          }
          // 保存响应式变量信息
          context.reactiveVariables!.set(name, {
            name,
            type: 'computed',
            initialValue: variable.init
          })
        } else {
          // ref/reactive 变量 - 确保保持原始数据类型
          const initialValue = this.parseInitValue(variable.init)
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
          context.data[name] = this.parseInitValue(initValue)
        }
      }
    })
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
   * 生成页面代码
   */
  private generatePageCode(context: TransformContext): ScriptTransformResult {
    const js = `Page({
  data: ${JSON.stringify(context.data, null, 2)},

  ${this.generateLifecycleCode(context.lifecycle, true)},

  ${this.generateMethodsCode(context.methods)},

  ${this.generateComputedMethodsCode(context.computed)},

  ${this.generateWatchMethodsCode(context.watch)}
})`

    const json = {
      usingComponents: this.generateUsingComponents(context.components)
    }

    return {
      js,
      json,
      context
    }
  }

  /**
   * 生成组件代码
   */
  private generateComponentCode(context: TransformContext): ScriptTransformResult {
    const js = `Component({
  properties: ${this.generatePropertiesCode(context.props)},

  data: ${JSON.stringify(context.data, null, 2)},

  ${this.generateLifecycleCode(context.lifecycle, false)},

  methods: {
    ${this.generateMethodsCode(context.methods)},

    ${this.generateComputedMethodsCode(context.computed)},

    ${this.generateWatchMethodsCode(context.watch)},

    ${this.generateEmitMethodsCode(context.emits)}
  }
})`

    const json = {
      component: true,
      usingComponents: this.generateUsingComponents(context.components)
    }

    return {
      js,
      json,
      context
    }
  }

  /**
   * 生成属性代码
   */
  private generatePropertiesCode(props: Record<string, any>): string {
    if (Object.keys(props).length === 0) {
      return '{}'
    }

    const entries = Object.entries(props).map(([key, value]) => {
      return `    ${key}: {
      type: ${this.getTypeString(value)},
      value: ${JSON.stringify(this.getDefaultValue(value))}
    }`
    })

    return `{
${entries.join(',\n')}
  }`
  }

  /**
   * 生成生命周期代码
   */
  private generateLifecycleCode(lifecycle: Record<string, string>, isPage: boolean): string {
    const hooks: string[] = []

    Object.entries(lifecycle).forEach(([hookName, code]) => {
      if (code.trim()) {
        hooks.push(`  ${hookName}(${isPage ? 'options' : ''}) {
    ${code.trim()}
  }`)
      }
    })

    return hooks.join(',\n\n')
  }

  /**
   * 生成方法代码
   */
  private generateMethodsCode(methods: Record<string, any>): string {
    const methodEntries = Object.entries(methods).map(([name, func]) => {
      if (typeof func === 'function') {
        return `    ${name}${func.toString().substring(8)}`
      } else {
        return `    ${name}() {
      // 方法实现
    }`
      }
    })

    return methodEntries.join(',\n\n')
  }

  /**
   * 生成计算属性方法代码
   */
  private generateComputedMethodsCode(computed: Record<string, any>): string {
    const computedEntries = Object.entries(computed).map(([name, config]) => {
      return `    _computed_${name}() {
      ${config.getter || 'return null'}
    }`
    })

    return computedEntries.join(',\n\n')
  }

  /**
   * 生成监听器方法代码
   */
  private generateWatchMethodsCode(watch: Record<string, any>): string {
    const watchEntries = Object.entries(watch).map(([name, config]) => {
      return `    _watch_${name}(newVal, oldVal) {
      ${config.callback || '// 监听器回调'}
    }`
    })

    return watchEntries.join(',\n\n')
  }

  /**
   * 生成事件发射方法代码
   */
  private generateEmitMethodsCode(emits: string[]): string {
    const emitMethods = emits.map(eventName => {
      const methodName = `_emit${this.capitalize(eventName)}`
      return `    ${methodName}(payload) {
      this.triggerEvent('${eventName}', payload)
    }`
    })

    return emitMethods.join(',\n\n')
  }

  /**
   * 生成使用的组件配置
   */
  private generateUsingComponents(components: Map<string, string>, fromFile?: string): Record<string, string> {
    const usingComponents: Record<string, string> = {}

    components.forEach((importPath, name) => {
      try {
        let componentPath: string

        if (this.pathResolver && fromFile) {
          // 使用路径解析器计算正确的相对路径
          componentPath = this.pathResolver.resolveComponentPath(fromFile, importPath)
        } else {
          // 后备方案：简单的路径处理
          componentPath = importPath.replace(/\.vue$/, '').replace(/^\.\//, '')
        }

        usingComponents[this.kebabCase(name)] = componentPath
        logger.debug(`组件引用: ${name} -> ${componentPath}`)
      } catch (error) {
        logger.error(`解析组件路径失败: ${name} -> ${importPath}`, error as Error)
        // 使用原始路径作为后备
        usingComponents[this.kebabCase(name)] = importPath.replace(/\.vue$/, '')
      }
    })

    return usingComponents
  }

  /**
   * 解析初始值，确保保持正确的数据类型
   */
  private parseInitValue(value: any): any {
    // 如果已经是非字符串类型，直接返回
    if (typeof value !== 'string') {
      return value
    }

    const trimmedValue = value.trim()

    // 检查是否为带引号的字符串
    if ((trimmedValue.startsWith('"') && trimmedValue.endsWith('"')) ||
      (trimmedValue.startsWith("'") && trimmedValue.endsWith("'"))) {
      // 移除引号并返回字符串内容
      return trimmedValue.slice(1, -1)
    }

    // 检查是否为数字字符串
    if (/^-?\d+(\.\d+)?$/.test(trimmedValue)) {
      return parseFloat(trimmedValue)
    }

    // 检查是否为布尔值字符串
    if (trimmedValue === 'true') return true
    if (trimmedValue === 'false') return false

    // 检查是否为 null
    if (trimmedValue === 'null') return null

    // 检查是否为 undefined
    if (trimmedValue === 'undefined') return undefined

    // 检查是否为对象字符串（以 { 开头）
    if (trimmedValue.startsWith('{') && trimmedValue.endsWith('}')) {
      try {
        // 尝试解析为对象
        return JSON.parse(trimmedValue)
      } catch {
        // 如果 JSON.parse 失败，尝试使用 eval 解析（更宽松的语法）
        try {
          // 使用 Function 构造函数安全地解析对象字面量
          return new Function('return ' + trimmedValue)()
        } catch {
          // 如果都失败，返回原字符串
          return trimmedValue
        }
      }
    }

    // 检查是否为数组字符串（以 [ 开头）
    if (trimmedValue.startsWith('[') && trimmedValue.endsWith(']')) {
      try {
        // 尝试解析为数组
        return JSON.parse(trimmedValue)
      } catch {
        // 如果 JSON.parse 失败，尝试使用 eval 解析
        try {
          return new Function('return ' + trimmedValue)()
        } catch {
          // 如果都失败，返回原字符串
          return trimmedValue
        }
      }
    }

    // 其他情况返回原字符串
    return trimmedValue
  }

  /**
   * 创建字面量节点
   */
  private createLiteralNode(value: any): any {
    if (typeof value === 'string') {
      return { type: 'StringLiteral', value }
    } else if (typeof value === 'number') {
      return { type: 'NumericLiteral', value }
    } else if (typeof value === 'boolean') {
      return { type: 'BooleanLiteral', value }
    } else if (value === null) {
      return { type: 'NullLiteral' }
    } else if (Array.isArray(value)) {
      return {
        type: 'ArrayExpression',
        elements: value.map(item => this.createLiteralNode(item))
      }
    } else if (typeof value === 'object') {
      return {
        type: 'ObjectExpression',
        properties: Object.entries(value).map(([key, val]) => ({
          type: 'ObjectProperty',
          key: { type: 'Identifier', name: key },
          value: this.createLiteralNode(val)
        }))
      }
    }

    return { type: 'Identifier', name: 'undefined' }
  }

  /**
   * 获取类型字符串
   */
  private getTypeString(value: any): string {
    if (typeof value === 'string') return 'String'
    if (typeof value === 'number') return 'Number'
    if (typeof value === 'boolean') return 'Boolean'
    if (Array.isArray(value)) return 'Array'
    if (typeof value === 'object') return 'Object'
    return 'String'
  }

  /**
   * 获取默认值
   */
  private getDefaultValue(value: any): any {
    if (typeof value === 'string') return ''
    if (typeof value === 'number') return 0
    if (typeof value === 'boolean') return false
    if (Array.isArray(value)) return []
    if (typeof value === 'object') return {}
    return null
  }

  /**
   * 首字母大写
   */
  private capitalize(str: string): string {
    return str.charAt(0).toUpperCase() + str.slice(1)
  }

  /**
   * 转换为 kebab-case
   */
  private kebabCase(str: string): string {
    return str.replace(/([A-Z])/g, '-$1').toLowerCase().replace(/^-/, '')
  }
}
