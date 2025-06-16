/**
 * 组件代码生成器
 */

import type { TransformContext, GenerateResult } from '@/types/index.js'
import type { ScriptTransformResult, TemplateTransformResult, StyleTransformResult } from '@/transformer/index.js'
import { logger } from '@/utils/index.js'

/**
 * 组件生成器类
 */
export class ComponentGenerator {
  /**
   * 生成组件代码
   */
  async generateComponent(
    scriptResult: ScriptTransformResult,
    templateResult: TemplateTransformResult,
    styleResult: StyleTransformResult,
    context: TransformContext
  ): Promise<GenerateResult> {
    try {
      logger.debug(`生成组件代码: ${context.filename}`)

      const result: GenerateResult = {
        js: this.generateJS(scriptResult, context),
        json: this.generateJSON(scriptResult, templateResult, context),
        wxml: this.generateWXML(templateResult, context),
        wxss: this.generateWXSS(styleResult, context)
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
${this.generateMethods(methods)},

${this.generateComputedMethods(computed)},

${this.generateEmitMethods(emits)},

${this.generateEventHandlers(transformContext)},

    // 响应式系统设置
    _setupReactivity() {
${this.generateReactivitySetup(transformContext)}
    },

    // 更新计算属性
    _updateComputed() {
${this.generateComputedUpdate(computed)}
    }
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

    // 添加作用域属性
    if (context.filename) {
      const scopeId = this.generateScopeId(context.filename)
      wxml = this.addScopeAttributes(wxml, scopeId)
    }

    return wxml
  }

  /**
   * 生成 WXSS 样式
   */
  private generateWXSS(styleResult: StyleTransformResult, context: TransformContext): string {
    return styleResult.wxss
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

    return methods.join(',\n\n')
  }

  /**
   * 生成事件处理器
   */
  private generateEventHandlers(context: TransformContext): string {
    const handlers: string[] = []

    // v-model 输入处理器
    Object.keys(context.data).forEach(key => {
      handlers.push(`    _handleInput_${key.replace(/\./g, '_')}(event) {
      const value = event.detail.value
      this.setData({
        ${key}: value
      })
      this._emit${this.capitalize(`update:${key}`)}(value)
    }`)

      handlers.push(`    _handleNumberInput_${key.replace(/\./g, '_')}(event) {
      const value = parseFloat(event.detail.value) || 0
      this.setData({
        ${key}: value
      })
      this._emit${this.capitalize(`update:${key}`)}(value)
    }`)

      handlers.push(`    _handleTrimInput_${key.replace(/\./g, '_')}(event) {
      const value = event.detail.value.trim()
      this.setData({
        ${key}: value
      })
      this._emit${this.capitalize(`update:${key}`)}(value)
    }`)
    })

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
