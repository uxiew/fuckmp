/**
 * 页面代码生成器
 */

import type { TransformContext, GenerateResult } from '@/types/index.js'
import type { ScriptTransformResult, TemplateTransformResult, StyleTransformResult } from '@/transformer/index.js'
import { logger } from '@/utils/index.js'

/**
 * 页面生成器类
 */
export class PageGenerator {
  /**
   * 生成页面代码
   */
  async generatePage(
    scriptResult: ScriptTransformResult,
    templateResult: TemplateTransformResult,
    styleResults: StyleTransformResult | StyleTransformResult[],
    context: TransformContext
  ): Promise<GenerateResult> {
    try {
      logger.debug(`生成页面代码: ${context.filename}`)

      const result: GenerateResult = {
        js: this.generateJS(scriptResult, context),
        json: this.generateJSON(scriptResult, templateResult, context),
        wxml: this.generateWXML(templateResult, context),
        wxss: this.generateWXSS(styleResults, context)
      }

      logger.debug(`页面代码生成完成: ${context.filename}`)
      return result

    } catch (error) {
      logger.error(`页面代码生成失败: ${context.filename}`, error as Error)
      throw error
    }
  }

  /**
   * 生成 JavaScript 代码
   */
  private generateJS(scriptResult: ScriptTransformResult, context: TransformContext): string {
    const { data, methods, computed, lifecycle } = context

    // 生成页面定义的各个部分
    const parts: string[] = []

    // 页面数据
    parts.push(`  // 页面数据
  data: ${JSON.stringify(data, null, 2)}`)

    // 页面生命周期函数
    const lifecycleCode = this.generateLifecycle(lifecycle)
    if (lifecycleCode) {
      parts.push(`  // 页面生命周期函数
${lifecycleCode}`)
    }

    // 页面方法
    const methodsCode = this.generateMethods(methods)
    if (methodsCode) {
      parts.push(`  // 页面方法
${methodsCode}`)
    }

    // 计算属性方法
    const computedMethods = this.generateComputedMethods(computed)
    if (computedMethods) {
      parts.push(`  // 计算属性方法
${computedMethods}`)
    }

    // 事件处理器
    const eventHandlers = this.generateEventHandlers(context)
    if (eventHandlers) {
      parts.push(`  // 事件处理器
${eventHandlers}`)
    }

    // 响应式系统设置
    parts.push(`  // 响应式系统设置
  _setupReactivity() {
${this.generateReactivitySetup(context)}
  }`)

    // 更新计算属性
    parts.push(`  // 更新计算属性
  _updateComputed() {
${this.generateComputedUpdate(computed)}
  }`)

    // 只有在用户定义了分享相关生命周期时才添加
    if (lifecycle.onShareAppMessage) {
      parts.push(`  // 页面分享
  onShareAppMessage() {
    ${lifecycle.onShareAppMessage}
  }`)
    }

    if (lifecycle.onShareTimeline) {
      parts.push(`  // 页面分享到朋友圈
  onShareTimeline() {
    ${lifecycle.onShareTimeline}
  }`)
    }

    // 生成页面定义
    const pageCode = `Page({
${parts.join(',\n\n')}
})`

    return this.addHeader(pageCode, context)
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
      usingComponents: this.generateUsingComponents(context.components),
      navigationBarTitleText: this.getPageTitle(context),
      enablePullDownRefresh: this.hasRefreshHandler(context),
      onReachBottomDistance: 50
    }

    // 如果有下拉刷新，添加相关配置
    if (this.hasRefreshHandler(context)) {
      config.backgroundTextStyle = 'dark'
      config.backgroundColor = '#ffffff'
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
   * 生成生命周期函数
   */
  private generateLifecycle(lifecycle: Record<string, string>): string {
    const pageLifecycles = ['onLoad', 'onShow', 'onReady', 'onHide', 'onUnload', 'onPullDownRefresh', 'onReachBottom']
    const entries: string[] = []

    pageLifecycles.forEach(lifecycleName => {
      const code = lifecycle[lifecycleName]
      if (code && code.trim()) {
        const params = lifecycleName === 'onLoad' ? 'options' : ''
        entries.push(`  ${lifecycleName}(${params}) {
    ${lifecycleName === 'onLoad' ? 'this._setupReactivity()' : ''}
    ${code.trim()}
  }`)
      } else if (lifecycleName === 'onLoad') {
        // 确保 onLoad 存在
        entries.push(`  onLoad(options) {
    this._setupReactivity()
    // 页面加载完成
  }`)
      } else if (lifecycleName === 'onShow') {
        // 确保 onShow 存在
        entries.push(`  onShow() {
    // 页面显示时触发
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
        return `  ${name}${funcStr.substring(funcStr.indexOf('('))}`
      } else {
        return `  ${name}() {
    // 方法实现
  }`
      }
    })

    // 如果没有方法，返回空字符串
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
      return `  _computed_${name}() {
    ${config.getter || 'return null'}
  }`
    })

    // 如果没有计算属性，返回空字符串
    if (entries.length === 0) {
      return ''
    }

    return entries.join(',\n\n')
  }

  /**
   * 生成事件处理器
   */
  private generateEventHandlers(context: TransformContext): string {
    const handlers: string[] = []

    // 通用事件处理器
    handlers.push(`  // 通用点击事件处理
  handleTap(event) {
    const { dataset } = event.currentTarget
    const { action, data } = dataset
    
    if (action && this[action]) {
      this[action](data)
    }
  }`)

    // 输入处理器
    Object.keys(context.data).forEach(key => {
      handlers.push(`  _handleInput_${key.replace(/\./g, '_')}(event) {
    const value = event.detail.value
    this.setData({
      ${key}: value
    })
    this._updateComputed()
  }`)
    })

    // 下拉刷新处理器
    if (this.hasRefreshHandler(context)) {
      handlers.push(`  onPullDownRefresh() {
    // 下拉刷新逻辑
    this.refreshData().then(() => {
      wx.stopPullDownRefresh()
    })
  }`)

      handlers.push(`  refreshData() {
    return new Promise((resolve) => {
      // 刷新数据的具体实现
      setTimeout(resolve, 1000)
    })
  }`)
    }

    // 上拉加载更多处理器
    handlers.push(`  onReachBottom() {
    // 上拉加载更多逻辑
    if (this.data.hasMore && !this.data.loading) {
      this.loadMoreData()
    }
  }`)

    handlers.push(`  loadMoreData() {
    this.setData({ loading: true })
    
    // 加载更多数据的具体实现
    setTimeout(() => {
      this.setData({ 
        loading: false,
        hasMore: false // 根据实际情况设置
      })
    }, 1000)
  }`)

    return handlers.join(',\n\n')
  }

  /**
   * 生成响应式设置
   */
  private generateReactivitySetup(context: TransformContext): string {
    const setup: string[] = []

    // 设置计算属性
    Object.keys(context.computed).forEach(name => {
      setup.push(`    // 设置计算属性: ${name}
    Object.defineProperty(this.data, '${name}', {
      get: () => this._computed_${name}(),
      enumerable: true,
      configurable: true
    })`)
    })

    // 初始化加载状态
    setup.push(`    // 初始化页面状态
    this.setData({
      loading: false,
      hasMore: true
    })`)

    return setup.join('\n')
  }

  /**
   * 生成计算属性更新
   */
  private generateComputedUpdate(computed: Record<string, any>): string {
    const computedKeys = Object.keys(computed)

    if (computedKeys.length === 0) {
      return '    // 没有计算属性需要更新'
    }

    const updates = computedKeys.map(key => `      ${key}: this._computed_${key}()`)

    return `    this.setData({
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
        logger.debug(`页面组件引用: ${name} -> ${componentPath}`)
      } catch (error) {
        logger.error(`处理页面组件路径失败: ${name} -> ${importPath}`, error as Error)
        usingComponents[this.kebabCase(name)] = importPath.replace(/\.vue$/, '')
      }
    })

    return usingComponents
  }

  /**
   * 获取页面标题
   */
  private getPageTitle(context: TransformContext): string {
    // 从文件名推断页面标题
    const filename = context.filename.split('/').pop()?.replace(/\.vue$/, '') || 'Page'
    return filename.charAt(0).toUpperCase() + filename.slice(1)
  }

  /**
   * 获取页面路径
   */
  private getPagePath(context: TransformContext): string {
    return context.filename.replace(/\.vue$/, '').replace(/^src\//, '')
  }

  /**
   * 检查是否有刷新处理器
   */
  private hasRefreshHandler(context: TransformContext): boolean {
    return 'onPullDownRefresh' in context.lifecycle || 'refreshData' in context.methods
  }

  /**
   * 检查是否有加载状态
   */
  private hasLoadingState(context: TransformContext): boolean {
    return 'loading' in context.data
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
   * 添加文件头部注释
   */
  private addHeader(code: string, context: TransformContext): string {
    return `// 由 Vue3 微信小程序编译器自动生成
// 源文件: ${context.filename}
// 页面类型: Page
// 生成时间: ${new Date().toISOString()}

${code}`
  }

  /**
   * 转换为 kebab-case
   */
  private kebabCase(str: string): string {
    return str.replace(/([A-Z])/g, '-$1').toLowerCase().replace(/^-/, '')
  }
}
