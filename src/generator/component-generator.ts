/**
 * 组件代码生成器
 */

import type { TransformContext, GenerateResult, CompilerOptions } from '@/types/index.js'
import type { ScriptTransformResult, TemplateTransformResult, StyleTransformResult } from '@/transformer/index.js'
import { generateDefineExposeDegradeComment, generateUseTemplateRefDegradeComment, logger } from '@/utils/index.js'
import { addScopeAttributes, generateScopeId, generateUsingComponents, removeCtxPrefixes } from './shared-generator-utils.js'

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
        js: this.generateJS(scriptResult, templateResult, context),
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
  private generateJS(scriptResult: ScriptTransformResult, templateResult: TemplateTransformResult, context: TransformContext): string {
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
    const componentCode = `${generateDefineExposeDegradeComment(transformContext.expose, '组件')}${generateUseTemplateRefDegradeComment(transformContext.templateRefs || {}, '组件')}Component({
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
${this.generateAllMethods(methods, computed, emits, transformContext, templateResult)}
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
      usingComponents: generateUsingComponents(context.components, {
        debugLabel: '组件引用',
        errorLabel: '处理组件路径失败'
      }),
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
    wxml = removeCtxPrefixes(wxml)

    // 只有在使用了 scoped 样式时才添加作用域属性
    if (context.hasScoped && context.filename) {
      const scopeId = generateScopeId(context.filename)
      wxml = addScopeAttributes(wxml, scopeId)
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
    context: TransformContext,
    templateResult: TemplateTransformResult
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

    // 事件处理器（从模板转换结果生成）
    const templateEventHandlers = this.generateTemplateEventHandlers(templateResult, emits)
    if (templateEventHandlers.trim()) {
      methodParts.push(templateEventHandlers)
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
      const methodName = `_emit${this.toSafeMethodSuffix(eventName)}`
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
   * 生成模板事件处理器
   */
  private generateTemplateEventHandlers(templateResult: TemplateTransformResult, emits: string[]): string {
    const handlers: string[] = []

    // 从模板转换结果中生成事件处理器
    templateResult.eventHandlers.forEach((handlerCode, handlerName) => {
      // 根据处理器名称生成不同类型的处理器
      if (handlerName.startsWith('_handleInput_')) {
        const fieldName = handlerName.replace('_handleInput_', '')
        handlers.push(`    ${handlerName}(event) {
      const value = event.detail.value
      this.setData({
        ${fieldName}: value
      })${this.generateModelTrigger(fieldName, emits)}
    }`)
      } else if (handlerName.startsWith('_handleNumberInput_')) {
        const fieldName = handlerName.replace('_handleNumberInput_', '')
        handlers.push(`    ${handlerName}(event) {
      const value = parseFloat(event.detail.value) || 0
      this.setData({
        ${fieldName}: value
      })${this.generateModelTrigger(fieldName, emits)}
    }`)
      } else if (handlerName.startsWith('_handleTrimInput_')) {
        const fieldName = handlerName.replace('_handleTrimInput_', '')
        handlers.push(`    ${handlerName}(event) {
      const value = event.detail.value.trim()
      this.setData({
        ${fieldName}: value
      })${this.generateModelTrigger(fieldName, emits)}
    }`)
      } else if (handlerName.startsWith('_handleRadio_')) {
        const fieldName = handlerName.replace('_handleRadio_', '')
        handlers.push(`    ${handlerName}(event) {
      const value = event.detail.value
      this.setData({
        ${fieldName}: value
      })${this.generateModelTrigger(fieldName, emits)}
    }`)
      } else if (handlerName.startsWith('_handleCheckbox_')) {
        const fieldName = handlerName.replace('_handleCheckbox_', '')
        handlers.push(`    ${handlerName}(event) {
      const value = event.detail.value
      this.setData({
        ${fieldName}: value
      })${this.generateModelTrigger(fieldName, emits)}
    }`)
      } else if (handlerName.startsWith('_handlePicker_')) {
        const fieldName = handlerName.replace('_handlePicker_', '')
        handlers.push(`    ${handlerName}(event) {
      const value = event.detail.value
      this.setData({
        ${fieldName}: value
      })${this.generateModelTrigger(fieldName, emits)}
    }`)
      } else if (handlerName.startsWith('_handleUpdate_')) {
        const fieldName = handlerName.replace('_handleUpdate_', '')
        handlers.push(`    ${handlerName}(event) {
      this.setData({
        ${fieldName}: event.detail
      })
    }`)
      } else {
        // 通用事件处理器
        handlers.push(`    ${handlerName}(event) {
      ${handlerCode}
    }`)
      }
    })

    return handlers.join(',\n\n')
  }

  /**
   * 为 defineModel 对应的输入处理器补充 update:* 事件。
   */
  private generateModelTrigger(fieldName: string, emits: string[]): string {
    const eventName = `update:${fieldName}`
    if (!emits.includes(eventName)) {
      return ''
    }
    return `\n      this.triggerEvent('${eventName}', value)`
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
   * 检查是否有插槽
   */
  private hasSlots(templateResult: TemplateTransformResult): boolean {
    return templateResult.wxml.includes('<slot')
  }

  /**
   * 获取属性类型
   */
  private getPropertyType(prop: any): string {
    const propType = prop && typeof prop === 'object' && 'type' in prop ? prop.type : prop
    if (typeof propType === 'function') {
      if (propType === String) return 'String'
      if (propType === Number) return 'Number'
      if (propType === Boolean) return 'Boolean'
      if (propType === Array) return 'Array'
      if (propType === Object) return 'Object'
    }
    return 'String'
  }

  /**
   * 获取属性默认值
   */
  private getPropertyDefault(prop: any): any {
    if (prop && typeof prop === 'object' && 'default' in prop && prop.default !== undefined) {
      return prop.default
    }

    const propType = prop && typeof prop === 'object' && 'type' in prop ? prop.type : prop
    if (typeof propType === 'function') {
      if (propType === String) return ''
      if (propType === Number) return 0
      if (propType === Boolean) return false
      if (propType === Array) return []
      if (propType === Object) return {}
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
   * 将事件名转换为安全的方法名后缀。
   */
  private toSafeMethodSuffix(eventName: string): string {
    return eventName
      .split(/[^a-zA-Z0-9]+/)
      .filter(Boolean)
      .map(part => this.capitalize(part))
      .join('')
  }

  /**
   * 首字母大写
   */
  private capitalize(str: string): string {
    return str.charAt(0).toUpperCase() + str.slice(1)
  }
}
