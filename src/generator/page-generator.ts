/**
 * 页面代码生成器
 */

import type { TransformContext, GenerateResult, CompilerOptions } from '@/types/index.js'
import type { ScriptTransformResult, TemplateTransformResult, StyleTransformResult } from '@/transformer/index.js'
import { logger } from '@/utils/index.js'

/**
 * 页面生成器类
 */
export class PageGenerator {
  private options: CompilerOptions['injection']

  constructor(options: CompilerOptions['injection']) {
    this.options = options
  }

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

    // 事件处理器（仅在配置启用时生成）
    if (!this.options.pureMode && this.options.page.eventHandlers) {
      const eventHandlers = this.generateEventHandlers(context)
      if (eventHandlers) {
        parts.push(`  // 事件处理器
${eventHandlers}`)
      }
    }

    // 响应式系统设置（始终生成，支撑程序运行）
    parts.push(`  // 响应式系统设置
  _setupReactivity() {
${this.generateReactivitySetup(context)}
  }`)

    // 更新计算属性（始终生成，支撑程序运行）
    parts.push(`  // 更新计算属性
  _updateComputed() {
${this.generateComputedUpdate(computed)}
  }`)

    // 页面分享（仅在配置启用时生成）
    if (!this.options.pureMode && this.options.page.shareAppMessage) {
      parts.push(`  // 页面分享
  onShareAppMessage() {
    return {
      title: '${this.getPageTitle(context)}',
      path: '${this.getPagePath(context)}'
    }
  }`)
    }

    // 页面分享到朋友圈（仅在配置启用时生成）
    if (!this.options.pureMode && this.options.page.shareTimeline) {
      parts.push(`  // 页面分享到朋友圈
  onShareTimeline() {
    return {
      title: '${this.getPageTitle(context)}'
    }
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

    // 添加页面容器（仅在配置启用时）
    if (!this.options.pureMode && this.options.page.baseStyles) {
      wxml = `<view class="page-container">
  ${wxml}
</view>`
    }

    // 添加加载状态（仅在配置启用且用户定义了loading状态时）
    if (!this.options.pureMode && this.options.page.loadingState && this.hasLoadingState(context)) {
      wxml = `<view wx:if="{{loading}}" class="loading-container">
  <view class="loading-spinner"></view>
  <text class="loading-text">加载中...</text>
</view>
<view wx:else>
  ${wxml}
</view>`
    }

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
    let finalStyles = ''

    // 添加页面基础样式（仅在配置启用时）
    if (!this.options.pureMode && this.options.page.baseStyles) {
      const baseStyles = `/* 页面基础样式 */
.page-container {
  min-height: 100vh;
  background-color: #f5f5f5;
}

/* 加载状态样式 */
.loading-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 100vh;
}

.loading-spinner {
  width: 60rpx;
  height: 60rpx;
  border: 4rpx solid #e0e0e0;
  border-top: 4rpx solid #1976d2;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

.loading-text {
  margin-top: 20rpx;
  color: #666;
  font-size: 28rpx;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

/* 用户自定义样式 */`
      finalStyles = baseStyles
    }

    if (!styleResults) {
      return finalStyles
    }

    // 如果是单个样式结果，直接返回
    if (!Array.isArray(styleResults)) {
      return finalStyles ? finalStyles + '\n' + styleResults.wxss : styleResults.wxss
    }

    // 如果是多个样式结果，合并它们
    const allStyles = styleResults
      .filter(result => result && result.wxss)
      .map(result => result.wxss)
      .join('\n\n')

    return finalStyles ? finalStyles + '\n' + allStyles : allStyles
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
        const setupCall = lifecycleName === 'onLoad' ? 'this._setupReactivity()' : ''
        entries.push(`  ${lifecycleName}(${params}) {
    ${setupCall}
    ${code.trim()}
  }`)
      } else if (lifecycleName === 'onLoad') {
        // 确保 onLoad 存在，响应式设置是必需的
        entries.push(`  onLoad(options) {
    this._setupReactivity()
    // 页面加载完成
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
      } else if (method && typeof method === 'object' && method.body) {
        // 如果是包含函数体的对象
        const body = method.body.trim()

        // 处理箭头函数
        if (body.includes('=>')) {
          // 匹配箭头函数的参数和函数体
          const arrowMatch = body.match(/^\((.*?)\)\s*=>\s*(.*)$/s)
          if (arrowMatch) {
            const params = arrowMatch[1]
            let functionBody = arrowMatch[2].trim()

            if (functionBody.startsWith('{') && functionBody.endsWith('}')) {
              // 块语句，移除外层大括号
              functionBody = functionBody.slice(1, -1).trim()
              return `  ${name}(${params}) {
    ${functionBody}
  }`
            } else {
              // 表达式，添加return
              return `  ${name}(${params}) {
    return ${functionBody}
  }`
            }
          }
        }

        // 处理普通函数
        if (body.includes('function')) {
          const funcMatch = body.match(/function\s*\((.*?)\)\s*(.+)/)
          if (funcMatch) {
            const params = funcMatch[1]
            const functionBody = funcMatch[2]
            return `  ${name}(${params}) ${functionBody}`
          }
        }

        // 如果解析失败，使用原始body
        return `  ${name}() {
    ${body}
  }`
      } else if (typeof method === 'string') {
        // 如果method直接是字符串（函数体）
        const body = method.trim()

        if (body.includes('=>')) {
          // 处理字符串形式的箭头函数
          const arrowMatch = body.match(/^\((.*?)\)\s*=>\s*(.*)$/s)
          if (arrowMatch) {
            const params = arrowMatch[1]
            let functionBody = arrowMatch[2]?.trim() || ''

            if (functionBody.startsWith('{') && functionBody.endsWith('}')) {
              functionBody = functionBody.slice(1, -1).trim()
              return `  ${name}(${params}) {
    ${functionBody}
  }`
            } else {
              return `  ${name}(${params}) {
    return ${functionBody}
  }`
            }
          }
        }

        return `  ${name}() {
    ${body}
  }`
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

    // 初始化加载状态（仅在配置启用时）
    if (!this.options.pureMode && this.options.page.loadingState) {
      setup.push(`    // 初始化页面状态
    this.setData({
      loading: false,
      hasMore: true
    })`)
    }

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
