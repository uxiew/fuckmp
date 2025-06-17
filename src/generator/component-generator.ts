/**
 * 组件代码生成器
 */

import type { TransformContext, GenerateResult, CompilerOptions } from '@/types/index.js'
import type { ScriptTransformResult, TemplateTransformResult, StyleTransformResult } from '@/transformer/index.js'
import { logger } from '@/utils/index.js'

/**
 * 组件生成器类
 */
export class ComponentGenerator {
  private options: CompilerOptions['injection']

  constructor(options: CompilerOptions['injection']) {
    this.options = options
  }

  /**
   * 生成组件代码
   */
  async generateComponent(
    scriptResult: ScriptTransformResult,
    templateResult: TemplateTransformResult,
    styleResults: StyleTransformResult | StyleTransformResult[],
    context: TransformContext
  ): Promise<GenerateResult> {
    try {
      logger.debug(`生成组件代码: ${context.filename}`)

      const result: GenerateResult = {
        js: this.generateJS(scriptResult, context),
        json: this.generateJSON(scriptResult, templateResult, context),
        wxml: this.generateWXML(templateResult, context),
        wxss: this.generateWXSS(styleResults, context)
      }

      logger.debug(`组件代码生成完成: ${context.filename}`)
      return result

    } catch (error) {
      logger.error(`组件代码生成失败: ${context.filename}`, error as Error)
      throw error
    }
  }

  /**
   * 生成 JavaScript 代码
   */
  private generateJS(scriptResult: ScriptTransformResult, context: TransformContext): string {
    // 使用脚本转换结果中的上下文数据
    const transformContext = scriptResult.context
    const { props, emits, data, methods, computed, lifecycle } = transformContext

    logger.debug(`生成组件 JS，数据统计:`, {
      props: Object.keys(props).length,
      emits: emits.length,
      data: Object.keys(data).length,
      methods: Object.keys(methods).length,
      computed: Object.keys(computed).length,
      lifecycle: Object.keys(lifecycle).length
    })

    // 生成组件定义
    const componentCode = `Component({
  // 组件属性定义
  properties: ${this.generateProperties(props)},

  // 组件数据
  data: ${JSON.stringify(data, null, 2)},

  // 生命周期函数
  lifetimes: {
${this.generateLifetimes(lifecycle)}
  },

  // 页面生命周期函数
  pageLifetimes: {
${this.generatePageLifetimes(lifecycle)}
  },

  // 组件方法
  methods: {
${this.generateAllMethods(methods, computed, emits, transformContext)}
  }
})`

    return this.addHeader(componentCode, context)
  }

  /**
   * 生成 JSON 配置
   */
  private generateJSON(
    scriptResult: ScriptTransformResult,
    templateResult: TemplateTransformResult,
    context: TransformContext
  ): Record<string, any> {
    const config: any = {
      component: true,
      usingComponents: this.generateUsingComponents(context.components),
      styleIsolation: 'isolated'
    }

    // 如果有插槽，启用多插槽支持
    if (this.hasSlots(templateResult)) {
      config.options = {
        multipleSlots: true
      }
    }

    return config
  }

  /**
   * 生成 WXML 模板
   */
  private generateWXML(templateResult: TemplateTransformResult, context: TransformContext): string {
    let wxml = templateResult.wxml

    // 移除所有的 _ctx. 前缀（后处理步骤）
    wxml = this.removeCtxPrefixes(wxml)

    // 只有在使用了 scoped 样式时才添加作用域属性
    if (context.hasScoped && context.filename) {
      const scopeId = this.generateScopeId(context.filename)
      wxml = this.addScopeAttributes(wxml, scopeId)
    }

    return wxml
  }

  /**
   * 生成 WXSS 样式
   */
  private generateWXSS(styleResults: StyleTransformResult | StyleTransformResult[], context: TransformContext): string {
    if (!styleResults) {
      return ''
    }

    // 如果是单个样式结果，直接返回
    if (!Array.isArray(styleResults)) {
      return styleResults.wxss
    }

    // 如果是多个样式结果，合并它们
    const allStyles = styleResults
      .filter(result => result && result.wxss)
      .map(result => result.wxss)
      .join('\n\n')

    return allStyles
  }

  /**
   * 生成属性定义
   */
  private generateProperties(props: Record<string, any>): string {
    if (Object.keys(props).length === 0) {
      return '{}'
    }

    const entries = Object.entries(props).map(([key, prop]) => {
      const type = this.getPropertyType(prop)
      const value = this.getPropertyDefault(prop)

      return `    ${key}: {
      type: ${type},
      value: ${JSON.stringify(value)}
    }`
    })

    return `{
${entries.join(',\n')}
  }`
  }

  /**
   * 生成生命周期函数
   */
  private generateLifetimes(lifecycle: Record<string, string>): string {
    const lifetimes = ['created', 'attached', 'ready', 'moved', 'detached', 'error']
    const entries: string[] = []

    lifetimes.forEach(lifetime => {
      const code = lifecycle[lifetime]
      if (code && code.trim()) {
        entries.push(`    ${lifetime}() {
      this._setupReactivity()
      ${code.trim()}
    }`)
      }
    })

    return entries.join(',\n\n')
  }

  /**
   * 生成页面生命周期函数
   */
  private generatePageLifetimes(lifecycle: Record<string, string>): string {
    const pageLifetimes = ['show', 'hide', 'resize']
    const entries: string[] = []

    pageLifetimes.forEach(lifetime => {
      const code = lifecycle[`pageLifetimes.${lifetime}`]
      if (code && code.trim()) {
        entries.push(`    ${lifetime}() {
      ${code.trim()}
    }`)
      }
    })

    return entries.join(',\n\n')
  }

  /**
   * 生成所有方法（智能组合，过滤空内容）
   */
  private generateAllMethods(
    methods: Record<string, any>,
    computed: Record<string, any>,
    emits: string[],
    context: TransformContext
  ): string {
    const methodParts: string[] = []

    // 用户定义的方法
    const userMethods = this.generateMethods(methods)
    if (userMethods.trim()) {
      methodParts.push(userMethods)
    }

    // 计算属性方法
    const computedMethods = this.generateComputedMethods(computed)
    if (computedMethods.trim()) {
      methodParts.push(computedMethods)
    }

    // 事件发射方法
    const emitMethods = this.generateEmitMethods(emits)
    if (emitMethods.trim()) {
      methodParts.push(emitMethods)
    }

    // 事件处理器（仅在配置启用时生成）
    if (!this.options.pureMode && this.options.component.eventHandlers) {
      const eventHandlers = this.generateEventHandlers(context)
      if (eventHandlers.trim()) {
        methodParts.push(eventHandlers)
      }
    }

    // 响应式系统设置（始终生成，支撑程序运行）
    methodParts.push(`    // 响应式系统设置
    _setupReactivity() {
${this.generateReactivitySetup(context)}
    }`)

    // 更新计算属性（始终生成，支撑程序运行）
    methodParts.push(`    // 更新计算属性
    _updateComputed() {
${this.generateComputedUpdate(computed)}
    }`)

    return methodParts.join(',\n\n')
  }

  /**
   * 生成方法
   */
  private generateMethods(methods: Record<string, any>): string {
    const entries = Object.entries(methods).map(([name, method]) => {
      if (typeof method === 'function') {
        const funcStr = method.toString()
        return `    ${name}${funcStr.substring(funcStr.indexOf('('))}`
      } else if (typeof method === 'object' && method.type === 'function') {
        // 处理从 AST 解析的函数
        return `    ${name}() {
      // ${method.body}
      // TODO: 实现具体逻辑
    }`
      } else {
        return `    ${name}() {
      // 方法实现
    }`
      }
    })

    if (entries.length === 0) {
      return ''
    }

    return entries.join(',\n\n')
  }

  /**
   * 生成计算属性方法
   */
  private generateComputedMethods(computed: Record<string, any>): string {
    const entries = Object.entries(computed).map(([name, config]) => {
      return `    _computed_${name}() {
      ${config.getter || 'return null'}
    }`
    })

    if (entries.length === 0) {
      return ''
    }

    return entries.join(',\n\n')
  }

  /**
   * 生成事件发射方法
   */
  private generateEmitMethods(emits: string[]): string {
    const methods = emits.map(eventName => {
      const methodName = `_emit${this.capitalize(eventName)}`
      return `    ${methodName}(detail) {
      this.triggerEvent('${eventName}', detail)
    }`
    })

    if (methods.length === 0) {
      return ''
    }

    return methods.join(',\n\n')
  }

  /**
   * 生成事件处理器
   */
  private generateEventHandlers(context: TransformContext): string {
    const handlers: string[] = []

    // 只有在配置启用输入处理器时才生成
    if (!this.options.pureMode && this.options.component.inputHandlers) {
      // v-model 输入处理器（仅为实际使用的数据属性生成）
      Object.keys(context.data).forEach(key => {
        const eventName = `update:${key}`
        const methodName = `_emit${this.capitalize(eventName.replace(':', ''))}`

        handlers.push(`    _handleInput_${key.replace(/\./g, '_')}(event) {
        const value = event.detail.value
        this.setData({
          ${key}: value
        })
        this.${methodName}(value)
      }`)

        handlers.push(`    _handleNumberInput_${key.replace(/\./g, '_')}(event) {
        const value = parseFloat(event.detail.value) || 0
        this.setData({
          ${key}: value
        })
        this.${methodName}(value)
      }`)

        handlers.push(`    _handleTrimInput_${key.replace(/\./g, '_')}(event) {
        const value = event.detail.value.trim()
        this.setData({
          ${key}: value
        })
        this.${methodName}(value)
      }`)
      })
    }

    if (handlers.length === 0) {
      return ''
    }

    return handlers.join(',\n\n')
  }

  /**
   * 生成响应式设置
   */
  private generateReactivitySetup(context: TransformContext): string {
    const setup: string[] = []

    // 设置计算属性
    Object.keys(context.computed).forEach(name => {
      setup.push(`      // 设置计算属性: ${name}
      Object.defineProperty(this.data, '${name}', {
        get: () => this._computed_${name}(),
        enumerable: true,
        configurable: true
      })`)
    })

    return setup.join('\n')
  }

  /**
   * 生成计算属性更新
   */
  private generateComputedUpdate(computed: Record<string, any>): string {
    const computedKeys = Object.keys(computed)

    if (computedKeys.length === 0) {
      return '      // 没有计算属性需要更新'
    }

    const updates = computedKeys.map(key => `        ${key}: this._computed_${key}()`)

    return `      this.setData({
${updates.join(',\n')}
      })`
  }

  /**
   * 生成使用的组件配置
   */
  private generateUsingComponents(components: Map<string, string>, fromFile?: string): Record<string, string> {
    const usingComponents: Record<string, string> = {}

    components.forEach((importPath, name) => {
      try {
        // 简单的路径处理，实际的路径解析在编译器层面处理
        const componentPath = importPath.replace(/\.vue$/, '').replace(/^\.\//, '')
        usingComponents[this.kebabCase(name)] = componentPath
        logger.debug(`组件引用: ${name} -> ${componentPath}`)
      } catch (error) {
        logger.error(`处理组件路径失败: ${name} -> ${importPath}`, error as Error)
        usingComponents[this.kebabCase(name)] = importPath.replace(/\.vue$/, '')
      }
    })

    return usingComponents
  }

  /**
   * 检查是否有插槽
   */
  private hasSlots(templateResult: TemplateTransformResult): boolean {
    return templateResult.wxml.includes('<slot')
  }

  /**
   * 移除所有的 _ctx. 前缀
   */
  private removeCtxPrefixes(wxml: string): string {
    // 移除事件绑定中的 _ctx. 前缀
    wxml = wxml.replace(/bind:(\w+)="_ctx\.([^"]+)"/g, 'bind:$1="$2"')

    // 移除条件渲染中的 _ctx. 前缀
    wxml = wxml.replace(/wx:(if|elif)="{{_ctx\.([^}]+)}}"/g, 'wx:$1="{{$2}}"')

    // 移除属性绑定中的 _ctx. 前缀
    wxml = wxml.replace(/(\w+)="{{_ctx\.([^}]+)}}"/g, '$1="{{$2}}"')

    // 移除其他可能的 _ctx. 前缀
    wxml = wxml.replace(/_ctx\./g, '')

    return wxml
  }

  /**
   * 添加作用域属性
   */
  private addScopeAttributes(wxml: string, scopeId: string): string {
    return wxml.replace(/<(\w+)([^>]*?)(\s*\/?)>/g, (match, tag, attrs, selfClosing) => {
      if (attrs.includes('data-v-')) {
        return match
      }

      // 修复：只有当 selfClosing 包含 '/' 时才是真正的自闭合标签
      const isSelfClosing = selfClosing.includes('/')

      if (isSelfClosing) {
        return `<${tag}${attrs} data-v-${scopeId} />`
      } else {
        return `<${tag}${attrs} data-v-${scopeId}>`
      }
    })
  }

  /**
   * 生成作用域 ID
   */
  private generateScopeId(filename: string): string {
    let hash = 0
    for (let i = 0; i < filename.length; i++) {
      const char = filename.charCodeAt(i)
      hash = ((hash << 5) - hash) + char
      hash = hash & hash
    }
    return Math.abs(hash).toString(36).substring(0, 8)
  }

  /**
   * 获取属性类型
   */
  private getPropertyType(prop: any): string {
    if (typeof prop === 'function') {
      if (prop === String) return 'String'
      if (prop === Number) return 'Number'
      if (prop === Boolean) return 'Boolean'
      if (prop === Array) return 'Array'
      if (prop === Object) return 'Object'
    }
    return 'String'
  }

  /**
   * 获取属性默认值
   */
  private getPropertyDefault(prop: any): any {
    if (typeof prop === 'function') {
      if (prop === String) return ''
      if (prop === Number) return 0
      if (prop === Boolean) return false
      if (prop === Array) return []
      if (prop === Object) return {}
    }
    return null
  }

  /**
   * 添加文件头部注释
   */
  private addHeader(code: string, context: TransformContext): string {
    return `// 由 Vue3 微信小程序编译器自动生成
// 源文件: ${context.filename}
// 生成时间: ${new Date().toISOString()}

${code}`
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
