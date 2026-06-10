/**
 * StyleTransformer 选择器与不支持样式清理工具。
 */

import { logger } from '@/utils/index.js'

/**
 * 转换小程序兼容的 CSS 选择器。
 */
export function transformStyleSelectors(css: string): string {
  let transformedCSS = css

  // 移除深度选择器
  transformedCSS = transformedCSS
    .replace(/::v-deep\s+/g, ' ')
    .replace(/:deep\(([^()]*)\)/g, '$1')

  // 移除不支持的伪类并记录警告
  const unsupportedPseudoClasses = [':hover', ':focus', ':active', ':visited', ':link']
  unsupportedPseudoClasses.forEach(pseudo => {
    const regex = new RegExp(pseudo.replace(':', '\\:'), 'g')
    const matches = transformedCSS.match(regex)
    if (matches) {
      transformedCSS = transformedCSS.replace(regex, '')
      logger.warn(`移除不支持的伪类选择器: ${pseudo} (${matches.length} 处)`)
    }
  })

  // 转换伪元素
  transformedCSS = transformedCSS
    .replace(/::before/g, '::before')
    .replace(/::after/g, '::after')

  // 移除其他不支持的伪元素并记录警告
  const webkitMatches = transformedCSS.match(/::-webkit-[^{]+/g)
  if (webkitMatches) {
    transformedCSS = transformedCSS.replace(/::-webkit-[^{]+/g, '')
    logger.warn(`移除不支持的 webkit 伪元素 (${webkitMatches.length} 处)`)
    webkitMatches.forEach(match => {
      logger.warn(`  - ${match}`)
    })
  }

  const mozMatches = transformedCSS.match(/::-moz-[^{]+/g)
  if (mozMatches) {
    transformedCSS = transformedCSS.replace(/::-moz-[^{]+/g, '')
    logger.warn(`移除不支持的 moz 伪元素 (${mozMatches.length} 处)`)
    mozMatches.forEach(match => {
      logger.warn(`  - ${match}`)
    })
  }

  return transformedCSS
}

/**
 * 转换或移除小程序不支持的 CSS 属性。
 */
export function transformStyleProperties(css: string): string {
  return removeUnsupportedDeclarations(css, [
    'box-shadow',
    'text-shadow',
    'filter',
    'backdrop-filter',
    'clip-path',
    'mask',
    'outline'
  ]).css
    // 转换 position: sticky
    .replace(/position\s*:\s*sticky/g, 'position: relative')
    // 转换 cursor
    .replace(/([;{])\s*cursor\s*:[^;{}]+;?/g, '$1')
}

/**
 * 移除小程序不支持的样式属性与 at-rule。
 */
export function removeUnsupportedStyleRules(css: string): { css: string; removedCount: number } {
  let removedCount = 0

  // 不支持的属性列表
  const unsupportedProperties = [
    'box-shadow',
    'text-shadow',
    'filter',
    'backdrop-filter',
    'clip-path',
    'mask',
    'outline',
    'resize',
    'user-select',
    'pointer-events',
    'cursor'
  ]

  let cleanedCSS = css

  const unsupportedDeclarationResult = removeUnsupportedDeclarations(cleanedCSS, unsupportedProperties, (prop, matches) => {
    logger.warn(`移除不支持的样式属性: ${prop} (${matches.length} 处)`)
    matches.forEach(match => {
      logger.warn(`  - ${match.trim()}`)
    })
  })
  cleanedCSS = unsupportedDeclarationResult.css
  removedCount += unsupportedDeclarationResult.removedCount

  // 移除 @media 查询（小程序不支持）
  const mediaRegex = /@media[^{]*\{[^{}]*(?:\{[^{}]*\}[^{}]*)*\}/g
  const mediaMatches = cleanedCSS.match(mediaRegex)
  if (mediaMatches) {
    removedCount += mediaMatches.length
    cleanedCSS = cleanedCSS.replace(mediaRegex, '')
    // 编译时警告：移除不支持的 @media 查询
    logger.warn(`移除不支持的 @media 查询 (${mediaMatches.length} 处)`)
    mediaMatches.forEach(match => {
      const mediaQuery = `${match.split('{')[0]}{ ... }`
      logger.warn(`  - ${mediaQuery}`)
    })
  }

  // 移除其他 @规则（除了 @import）
  const atRuleRegex = /@(?!import)[^{]*\{[^{}]*(?:\{[^{}]*\}[^{}]*)*\}/g
  const atRuleMatches = cleanedCSS.match(atRuleRegex)
  if (atRuleMatches) {
    removedCount += atRuleMatches.length
    cleanedCSS = cleanedCSS.replace(atRuleRegex, '')
    // 编译时警告：移除不支持的 @规则
    logger.warn(`移除不支持的 @规则 (${atRuleMatches.length} 处)`)
    atRuleMatches.forEach(match => {
      const atRule = `${match.split('{')[0]}{ ... }`
      logger.warn(`  - ${atRule}`)
    })
  }

  // 移除空的规则
  cleanedCSS = cleanedCSS.replace(/[^{}]+{\s*}/g, '')

  return { css: cleanedCSS, removedCount }
}

interface RemoveUnsupportedDeclarationsResult {
  css: string
  removedCount: number
}

/**
 * 只移除 CSS 声明块内的不支持属性，避免误删 `.ui-mask:empty` 等选择器片段。
 */
function removeUnsupportedDeclarations(
  css: string,
  properties: readonly string[],
  onRemove?: (property: string, matches: string[]) => void
): RemoveUnsupportedDeclarationsResult {
  let cleanedCSS = css
  let removedCount = 0

  for (const property of properties) {
    const regex = new RegExp(`([;{])\\s*${escapeRegExp(property)}\\s*:[^;{}]+;?`, 'g')
    const matches: string[] = []

    cleanedCSS = cleanedCSS.replace(regex, (match, boundary: string) => {
      matches.push(match.slice(boundary.length).trim())
      return boundary
    })

    if (matches.length > 0) {
      removedCount += matches.length
      onRemove?.(property, matches)
    }
  }

  return { css: cleanedCSS, removedCount }
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}
