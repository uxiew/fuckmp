/**
 * 页面代码生成器
 */

import type { TransformContext, GenerateResult, CompilerOptions } from '@/types/index.js'
import type { ScriptTransformResult, TemplateTransformResult, StyleTransformResult } from '@/transformer/index.js'
import { generateDefineExposeDegradeComment, generateDefineOptionsDegradeComment, generateDefineSlotsDegradeComment, generateProvideInjectDegradeComment, generateUseIdNativeComment, generateUseTemplateRefDegradeComment, generateUnsupportedTemplateDegradeComment, generateWatcherDegradeComment, logger } from '@/utils/index.js'
import {
  addPageHeader,
  generatePageEventHandlers,
  generatePageComputedMethods,
  generatePageComputedUpdate,
  generatePageLifecycleCode,
  generatePageMethodsCode,
  getPagePath,
  getPageTitle,
  generatePageReactivitySetup,
  generatePageTemplateEventHandlers,
  generatePageWXSS,
  hasPageLoadingState,
  hasPageRefreshHandler
} from './page-generator-utils.js'
import { addScopeAttributes, generateScopeId, generateUsingComponents, removeCtxPrefixes, needsWxsHelpers, injectWxsHelpersImport } from './shared-generator-utils.js'

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
      const eventHandlers = generatePageEventHandlers(context)
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
      title: '${getPageTitle(context.filename)}',
      path: '${getPagePath(context.filename)}'
    }
  }`)
    }

    // 页面分享到朋友圈（仅在配置启用时生成）
    if (!this.options.pureMode && this.options.page.shareTimeline) {
      parts.push(`  // 页面分享到朋友圈
  onShareTimeline() {
    return {
      title: '${getPageTitle(context.filename)}'
    }
  }`)
    }

    // 生成页面定义
    const pageCode = `${generateDefineExposeDegradeComment(context.expose, '页面')}${generateDefineOptionsDegradeComment(context.defineOptions || {}, '页面')}${generateDefineSlotsDegradeComment(context.defineSlots || {}, '页面')}${generateWatcherDegradeComment(context.watcherEffects || {}, '页面')}${generateUseTemplateRefDegradeComment(context.templateRefs || {}, '页面')}${generateUseIdNativeComment(context.useIds || {}, '页面')}${generateProvideInjectDegradeComment(context.provideInject || {}, '页面')}${generateUnsupportedTemplateDegradeComment(context.templateUnsupported || {}, '页面')}Page({
${parts.join(',\n\n')}
})`

    return addPageHeader(pageCode, context.filename)
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
      navigationBarTitleText: getPageTitle(context.filename),
      enablePullDownRefresh: hasPageRefreshHandler(context),
      onReachBottomDistance: 50
    }

    // 如果有下拉刷新，添加相关配置
    if (hasPageRefreshHandler(context)) {
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
    if (!this.options.pureMode && this.options.page.loadingState && hasPageLoadingState(context)) {
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

    // 如果 WXML 中使用了 WXS 辅助函数，注入引用
    if (needsWxsHelpers(wxml)) {
      // 从 filename 中提取 pages/ 开头的相对路径部分
      // /abs/path/pages/profile.vue → pages/profile → 1 级目录 → ../helpers.wxs
      // /abs/path/pages/index/index.vue → pages/index/index → 2 级目录 → ../../helpers.wxs
      const pagesMatch = context.filename.match(/pages\/.*$/)
      const relativePath = pagesMatch ? pagesMatch[0].replace(/\.vue$/, '') : context.filename
      // depth = 目录层数（路径段数减去文件名自身）
      const depth = relativePath.split('/').length - 1
      const prefix = '../'.repeat(depth)
      wxml = injectWxsHelpersImport(wxml, `${prefix}helpers.wxs`)
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
}
