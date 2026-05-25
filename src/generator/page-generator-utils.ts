/**
 * 页面生成器轻量样式工具。
 */
import type { TransformContext } from '@/types/index.js'
import type { StyleTransformResult } from '@/transformer/index.js'

/**
 * 页面 WXSS 生成选项。
 */
export interface PageWxssOptions {
  /** 是否附加默认页面基础样式。 */
  includeBaseStyles: boolean
}

const PAGE_BASE_STYLES = `/* 页面基础样式 */
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

/**
 * 合并页面基础样式和转换后的 WXSS 内容。
 */
export function generatePageWXSS(
  styleResults: StyleTransformResult | StyleTransformResult[] | undefined,
  options: PageWxssOptions
): string {
  const baseStyles = options.includeBaseStyles ? PAGE_BASE_STYLES : ''

  if (!styleResults) {
    return baseStyles
  }

  if (!Array.isArray(styleResults)) {
    return joinStyles(baseStyles, styleResults.wxss)
  }

  const allStyles = styleResults
    .filter(result => result && result.wxss)
    .map(result => result.wxss)
    .join('\n\n')

  return joinStyles(baseStyles, allStyles)
}

/**
 * 生成页面生命周期函数字符串，并保证 onLoad 中初始化响应式系统。
 */
export function generatePageLifecycleCode(lifecycle: Record<string, string>): string {
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
      entries.push(`  onLoad(options) {
    this._setupReactivity()
    // 页面加载完成
  }`)
    }
  })

  return entries.join(',\n\n')
}

/**
 * 生成页面 methods 代码片段。
 */
export function generatePageMethodsCode(methods: Record<string, any>): string {
  const entries = Object.entries(methods).map(([name, method]) => {
    if (typeof method === 'function') {
      const funcStr = method.toString()
      return `  ${name}${funcStr.substring(funcStr.indexOf('('))}`
    } else if (method && typeof method === 'object' && method.body) {
      return generateObjectMethodCode(name, method.body.trim())
    } else if (typeof method === 'string') {
      return generateStringMethodCode(name, method.trim())
    }

    return `  ${name}() {
    // 方法实现
  }`
  })

  if (entries.length === 0) {
    return ''
  }

  return entries.join(',\n\n')
}

/**
 * 生成页面计算属性方法。
 */
export function generatePageComputedMethods(computed: Record<string, any>): string {
  const entries = Object.entries(computed).map(([name, config]) => {
    return `  _computed_${name}() {
    ${config.getter || 'return null'}
  }`
  })

  if (entries.length === 0) {
    return ''
  }

  return entries.join(',\n\n')
}

/**
 * 生成模板必须的事件处理器。
 */
export function generatePageTemplateEventHandlers(templateResult: { eventHandlers: Map<string, string> }): string {
  const handlers: string[] = []

  templateResult.eventHandlers.forEach((_handlerCode, handlerName) => {
    if (handlerName.startsWith('_handleUpdate_')) {
      const fieldName = handlerName.replace('_handleUpdate_', '')
      handlers.push(`  ${handlerName}(event) {
    this.setData({
      ${fieldName}: event.detail
    })
    this._updateComputed()
  }`)
    }
  })

  return handlers.join(',\n\n')
}

/**
 * 生成页面响应式初始化代码。
 */
export function generatePageReactivitySetup(options: {
  hasComputed: boolean
  includeLoadingState: boolean
}): string {
  const setup: string[] = []

  if (options.hasComputed) {
    setup.push('    this._updateComputed()')
  }

  if (options.includeLoadingState) {
    setup.push(`    // 初始化页面状态
    this.setData({
      loading: false,
      hasMore: true
    })`)
  }

  return setup.join('\n')
}

/**
 * 生成页面计算属性更新代码。
 */
export function generatePageComputedUpdate(computed: Record<string, any>): string {
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
 * 生成页面内置事件处理器。
 */
export function generatePageEventHandlers(
  context: Pick<TransformContext, 'data' | 'lifecycle' | 'methods'>
): string {
  const handlers: string[] = []

  handlers.push(`  // 通用点击事件处理
  handleTap(event) {
    const { dataset } = event.currentTarget
    const { action, data } = dataset

    if (action && this[action]) {
      this[action](data)
    }
  }`)

  Object.keys(context.data).forEach(key => {
    handlers.push(`  _handleInput_${key.replace(/\./g, '_')}(event) {
    const value = event.detail.value
    this.setData({
      ${key}: value
    })
    this._updateComputed()
  }`)
  })

  if (hasPageRefreshHandler(context)) {
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
 * 从页面源文件路径推断页面标题。
 */
export function getPageTitle(filename: string): string {
  const pageName = filename.split('/').pop()?.replace(/\.vue$/, '') || 'Page'
  return pageName.charAt(0).toUpperCase() + pageName.slice(1)
}

/**
 * 从页面源文件路径推断小程序页面路径。
 */
export function getPagePath(filename: string): string {
  return filename.replace(/\.vue$/, '').replace(/^src\//, '')
}

/**
 * 判断页面是否需要下拉刷新配置和内置刷新处理器。
 */
export function hasPageRefreshHandler(
  context: Pick<TransformContext, 'lifecycle' | 'methods'>
): boolean {
  return 'onPullDownRefresh' in context.lifecycle || 'refreshData' in context.methods
}

/**
 * 判断页面数据中是否存在内置 loading 状态。
 */
export function hasPageLoadingState(context: Pick<TransformContext, 'data'>): boolean {
  return 'loading' in context.data
}

/**
 * 为页面 JS 追加稳定文件头。
 */
export function addPageHeader(code: string, filename: string): string {
  return `// 由 Vue3 微信小程序编译器自动生成
// 源文件: ${filename}
// 页面类型: Page
// 生成时间: ${new Date().toISOString()}

${code}`
}

function joinStyles(baseStyles: string, styles: string): string {
  if (!baseStyles) return styles
  if (!styles) return baseStyles
  return `${baseStyles}\n${styles}`
}

function generateObjectMethodCode(name: string, body: string): string {
  if (body.includes('=>')) {
    const arrowMatch = body.match(/^\((.*?)\)\s*=>\s*(.*)$/s)
    if (arrowMatch) {
      const params = arrowMatch[1] ?? ''
      let functionBody = arrowMatch[2]?.trim() ?? ''

      if (functionBody.startsWith('{') && functionBody.endsWith('}')) {
        functionBody = functionBody.slice(1, -1).trim()
        return `  ${name}(${params}) {
    ${functionBody}
  }`
      }

      return `  ${name}(${params}) {
    return ${functionBody}
  }`
    }
  }

  if (body.includes('function')) {
    const funcMatch = body.match(/function\s*\((.*?)\)\s*(.+)/)
    if (funcMatch) {
      const params = funcMatch[1] ?? ''
      const functionBody = funcMatch[2] ?? ''
      return `  ${name}(${params}) ${functionBody}`
    }
  }

  return `  ${name}() {
    ${body}
  }`
}

function generateStringMethodCode(name: string, body: string): string {
  if (body.includes('=>')) {
    const arrowMatch = body.match(/^\((.*?)\)\s*=>\s*(.*)$/s)
    if (arrowMatch) {
      const params = arrowMatch[1] ?? ''
      let functionBody = arrowMatch[2]?.trim() || ''

      if (functionBody.startsWith('{') && functionBody.endsWith('}')) {
        functionBody = functionBody.slice(1, -1).trim()
        return `  ${name}(${params}) {
    ${functionBody}
  }`
      }

      return `  ${name}(${params}) {
    return ${functionBody}
  }`
    }
  }

  return `  ${name}() {
    ${body}
  }`
}
