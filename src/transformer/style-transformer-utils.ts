/**
 * StyleTransformer 纯字符串转换工具。
 */

/**
 * 转换 CSS 长度单位为小程序 rpx 单位。
 */
export function transformStyleUnits(css: string): string {
  return css
    // px 转 rpx (1px = 2rpx)
    .replace(/(\d+(?:\.\d+)?)px/g, (_match, num) => {
      const value = parseFloat(num)
      return `${value * 2}rpx`
    })
    // em 转 rpx (假设 1em = 16px = 32rpx)
    .replace(/(\d+(?:\.\d+)?)em/g, (_match, num) => {
      const value = parseFloat(num)
      return `${value * 32}rpx`
    })
    // rem 转 rpx (假设 1rem = 16px = 32rpx)
    .replace(/(\d+(?:\.\d+)?)rem/g, (_match, num) => {
      const value = parseFloat(num)
      return `${value * 32}rpx`
    })
    // vh 转 rpx (假设屏幕高度 667px)
    .replace(/(\d+(?:\.\d+)?)vh/g, (_match, num) => {
      const value = parseFloat(num)
      return `${(value * 667 / 100) * 2}rpx`
    })
    // vw 转 rpx (假设屏幕宽度 375px)
    .replace(/(\d+(?:\.\d+)?)vw/g, (_match, num) => {
      const value = parseFloat(num)
      return `${(value * 375 / 100) * 2}rpx`
    })
}

/**
 * 转换 CSS 值表达式。
 */
export function transformStyleValues(css: string): string {
  return css
    // 转换 CSS 变量
    .replace(/var\((--[^),]+)(?:,\s*([^)]+))?\)/g, (_match, _varName, fallback) => {
      // 简单的变量替换，实际项目中需要更复杂的处理
      return fallback || '0'
    })
    // 转换 calc() 函数
    .replace(/calc\(([^)]+)\)/g, (_match, expression) => {
      // 简单的 calc 计算，实际项目中需要更复杂的处理
      return evaluateCalcExpression(expression)
    })
}

/**
 * 为 CSS 选择器添加 scoped 属性。
 */
export function addScopedStyles(css: string, scopeId: string): string {
  return css.replace(/([^{}]+){/g, (match, selector) => {
    const scopedSelector = selector
      .split(',')
      .map((sel: string) => `${sel.trim()}[data-v-${scopeId}]`)
      .join(', ')

    return `${scopedSelector} {`
  })
}

/**
 * 压缩 CSS 字符串。
 */
export function minifyCSS(css: string): string {
  return css
    // 移除注释
    .replace(/\/\*[\s\S]*?\*\//g, '')
    // 移除多余的空白
    .replace(/\s+/g, ' ')
    // 移除分号前的空格
    .replace(/\s*;\s*/g, ';')
    // 移除冒号前后的空格
    .replace(/\s*:\s*/g, ':')
    // 移除大括号前后的空格
    .replace(/\s*{\s*/g, '{')
    .replace(/\s*}\s*/g, '}')
    // 移除逗号后的空格
    .replace(/,\s*/g, ',')
    // 移除行首行尾空格
    .trim()
}

/**
 * 基于文件名生成稳定 scoped 样式 ID。
 */
export function generateStyleScopeId(filename: string): string {
  let hash = 0
  for (let i = 0; i < filename.length; i++) {
    const char = filename.charCodeAt(i)
    hash = ((hash << 5) - hash) + char
    hash = hash & hash
  }
  return Math.abs(hash).toString(36).substring(0, 6)
}

/**
 * 统计 CSS 规则数量。
 */
export function countStyleRules(css: string): number {
  const matches = css.match(/{[^}]*}/g)
  return matches ? matches.length : 0
}

/**
 * 计算简单 calc 表达式。
 */
export function evaluateCalcExpression(expression: string): string {
  try {
    const cleanExpr = expression.replace(/[a-zA-Z%]+/g, '')
    const result = Function(`"use strict"; return (${cleanExpr})`)()

    return `${result}rpx`
  } catch {
    return '0rpx'
  }
}
