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

function joinStyles(baseStyles: string, styles: string): string {
  if (!baseStyles) return styles
  if (!styles) return baseStyles
  return `${baseStyles}\n${styles}`
}
