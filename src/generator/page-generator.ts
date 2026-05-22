/**
 * 页面代码生成器
 */

import type { TransformContext, GenerateResult, CompilerOptions } from '@/types/index.js'
import type { ScriptTransformResult, TemplateTransformResult, StyleTransformResult } from '@/transformer/index.js'
import { generateDefineExposeDegradeComment, generateDefineOptionsDegradeComment, generateDefineSlotsDegradeComment, generateProvideInjectDegradeComment, generateUseIdNativeComment, generateUseTemplateRefDegradeComment, generateUnsupportedTemplateDegradeComment, generateWatcherDegradeComment, logger } from '@/utils/index.js'
import {
  generatePageComputedMethods,
  generatePageComputedUpdate,
  generatePageLifecycleCode,
  generatePageMethodsCode,
  generatePageReactivitySetup,
  generatePageTemplateEventHandlers,
  generatePageWXSS
} from './page-generator-utils.js'
import { addScopeAttributes, generateScopeId, generateUsingComponents, removeCtxPrefixes } from './shared-generator-utils.js'

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
        js: this.generateJS(scriptResult, templateResult, context),
        json: this.generateJSON(scriptResult, templateResult, context),
        wxml: this.generateWXML(templateResult, context),
        wxss: this.generateWXSS(styleResults)
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
  private generateJS(scriptResult: ScriptTransformResult, templateResult: TemplateTransformResult, context: TransformContext): string {
    const { data, methods, computed, lifecycle, reactiveVariables } = context

    // 生成页面定义的各个部分
    const parts: string[] = []

    // 页面数据
    parts.push(`  // 页面数据
  data: ${JSON.stringify(data, null, 2)}`)

    // 添加响应式变量信息（供运行时使用）
    if (reactiveVariables && reactiveVariables.size > 0) {
      const reactiveVarsArray = Array.from(reactiveVariables.values())
      parts.push(`  // 响应式变量信息
  _reactiveVariables: ${JSON.stringify(reactiveVarsArray, null, 2)}`)
    }

    // 页面生命周期函数
    const lifecycleCode = generatePageLifecycleCode(lifecycle)
    if (lifecycleCode) {
      parts.push(`  // 页面生命周期函数
${lifecycleCode}`)
    }

    // 页面方法
    const methodsCode = generatePageMethodsCode(methods)
    if (methodsCode) {
      parts.push(`  // 页面方法
${methodsCode}`)
    }

    // 模板生成的必要事件处理器
    const templateEventHandlers = generatePageTemplateEventHandlers(templateResult)
    if (templateEventHandlers) {
      parts.push(`  // 模板事件处理器
${templateEventHandlers}`)
    }

    // 计算属性方法
    const computedMethods = generatePageComputedMethods(computed)
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

    const reactivitySetup = generatePageReactivitySetup({
      hasComputed: Object.keys(computed).length > 0,
      includeLoadingState: !this.options.pureMode && this.options.page.loadingState
    })

    // 响应式系统设置（始终生成，支撑程序运行）
    parts.push(`  // 响应式系统设置
  _setupReactivity() {
${reactivitySetup}
  }`)

    // 更新计算属性（始终生成，支撑程序运行）
    parts.push(`  // 更新计算属性
  _updateComputed() {
${generatePageComputedUpdate(computed)}
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
    const pageCode = `${generateDefineExposeDegradeComment(context.expose, '页面')}${generateDefineOptionsDegradeComment(context.defineOptions || {}, '页面')}${generateDefineSlotsDegradeComment(context.defineSlots || {}, '页面')}${generateWatcherDegradeComment(context.watcherEffects || {}, '页面')}${generateUseTemplateRefDegradeComment(context.templateRefs || {}, '页面')}${generateUseIdNativeComment(context.useIds || {}, '页面')}${generateProvideInjectDegradeComment(context.provideInject || {}, '页面')}${generateUnsupportedTemplateDegradeComment(context.templateUnsupported || {}, '页面')}Page({
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
      usingComponents: generateUsingComponents(context.components, {
        debugLabel: '页面组件引用',
        errorLabel: '处理页面组件路径失败'
      }),
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
    wxml = removeCtxPrefixes(wxml)

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
      const scopeId = generateScopeId(context.filename)
      wxml = addScopeAttributes(wxml, scopeId)
    }

    return wxml
  }

  /**
   * 生成 WXSS 样式
   */
  private generateWXSS(styleResults: StyleTransformResult | StyleTransformResult[]): string {
    return generatePageWXSS(styleResults, {
      includeBaseStyles: !this.options.pureMode && this.options.page.baseStyles
    })
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
   * 添加文件头部注释
   */
  private addHeader(code: string, context: TransformContext): string {
    return `// 由 Vue3 微信小程序编译器自动生成
// 源文件: ${context.filename}
// 页面类型: Page
// 生成时间: ${new Date().toISOString()}

${code}`
  }
}
