/**
 * 页面生成器轻量样式工具。
 */
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
