/**
 * Style 转换器
 */

import type { StyleParseResult } from '@/parser/index.js'
import type { TransformContext } from '@/types/index.js'
import { logger } from '@/utils/index.js'
import {
  addScopedStyles,
  countStyleRules,
  generateStyleScopeId,
  minifyCSS,
  transformStyleUnits,
  transformStyleValues
} from './style-transformer-utils.js'

/**
 * 样式转换结果
 */
export interface StyleTransformResult {
  /** 生成的 WXSS 代码 */
  wxss: string
  /** 作用域 ID */
  scopeId?: string
  /** 转换统计 */
  stats: {
    /** 原始规则数 */
    originalRules: number
    /** 转换后规则数 */
    transformedRules: number
    /** 移除的规则数 */
    removedRules: number
  }
}

/**
 * Style 转换器类
 */
export class StyleTransformer {
  /**
   * 转换样式
   */
  async transformStyle(
    parseResult: StyleParseResult,
    context: TransformContext,
    options: {
      scoped?: boolean
      minify?: boolean
    } = {}
  ): Promise<StyleTransformResult> {
    try {
      logger.debug(`转换样式: ${context.filename}`)

      let wxss = parseResult.css
      let scopeId: string | undefined

      // 统计信息
      const originalRules = countStyleRules(wxss)
      let removedRules = 0

      // 小程序样式转换
      wxss = this.transformMiniprogramStyles(wxss)

      // 作用域样式处理
      if (options.scoped) {
        scopeId = generateStyleScopeId(context.filename)
        wxss = addScopedStyles(wxss, scopeId)
      }

      // 移除不支持的样式
      const { css: cleanedCss, removedCount } = this.removeUnsupportedStyles(wxss)
      wxss = cleanedCss
      removedRules = removedCount

      // 代码压缩
      if (options.minify) {
        wxss = minifyCSS(wxss)
      }

      const transformedRules = countStyleRules(wxss)

      const result: StyleTransformResult = {
        wxss,
        ...(scopeId && { scopeId }),
        stats: {
          originalRules,
          transformedRules,
          removedRules
        }
      }

      logger.debug(`样式转换完成: ${context.filename}`)
      return result

    } catch (error) {
      logger.error(`样式转换失败: ${context.filename}`, error as Error)
      throw error
    }
  }

  /**
   * 转换小程序样式
   */
  private transformMiniprogramStyles(css: string): string {
    let transformedCSS = css

    // 单位转换
    transformedCSS = transformStyleUnits(transformedCSS)

    // 选择器转换
    transformedCSS = this.transformSelectors(transformedCSS)

    // 属性转换
    transformedCSS = this.transformProperties(transformedCSS)

    // 值转换
    transformedCSS = transformStyleValues(transformedCSS)

    return transformedCSS
  }

  /**
   * 选择器转换
   */
  private transformSelectors(css: string): string {
    let transformedCSS = css

    // 移除深度选择器
    transformedCSS = transformedCSS
      .replace(/::v-deep\s+/g, ' ')
      .replace(/:deep\(/g, ' ')
      .replace(/\)\s*{/g, ' {')

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
   * 属性转换
   */
  private transformProperties(css: string): string {
    return css
      // 移除不支持的属性
      .replace(/\s*box-shadow\s*:[^;]+;?/g, '')
      .replace(/\s*text-shadow\s*:[^;]+;?/g, '')
      .replace(/\s*filter\s*:[^;]+;?/g, '')
      .replace(/\s*backdrop-filter\s*:[^;]+;?/g, '')
      .replace(/\s*clip-path\s*:[^;]+;?/g, '')
      .replace(/\s*mask\s*:[^;]+;?/g, '')
      .replace(/\s*outline\s*:[^;]+;?/g, '')
      // 转换 position: sticky
      .replace(/position\s*:\s*sticky/g, 'position: relative')
      // 转换 cursor
      .replace(/cursor\s*:[^;]+;?/g, '')
  }

  /**
   * 移除不支持的样式
   */
  private removeUnsupportedStyles(css: string): { css: string; removedCount: number } {
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

    // 移除不支持的属性
    unsupportedProperties.forEach(prop => {
      const regex = new RegExp(`\\s*${prop}\\s*:[^;]+;?`, 'g')
      const matches = cleanedCSS.match(regex)
      if (matches) {
        removedCount += matches.length
        cleanedCSS = cleanedCSS.replace(regex, '')
        // 编译时警告：移除不支持的样式属性
        logger.warn(`移除不支持的样式属性: ${prop} (${matches.length} 处)`)
        matches.forEach(match => {
          logger.warn(`  - ${match.trim()}`)
        })
      }
    })

    // 移除 @media 查询（小程序不支持）
    const mediaRegex = /@media[^{]*\{[^{}]*(?:\{[^{}]*\}[^{}]*)*\}/g
    const mediaMatches = cleanedCSS.match(mediaRegex)
    if (mediaMatches) {
      removedCount += mediaMatches.length
      cleanedCSS = cleanedCSS.replace(mediaRegex, '')
      // 编译时警告：移除不支持的 @media 查询
      logger.warn(`移除不支持的 @media 查询 (${mediaMatches.length} 处)`)
      mediaMatches.forEach(match => {
        const mediaQuery = match.split('{')[0] + '{ ... }'
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
        const atRule = match.split('{')[0] + '{ ... }'
        logger.warn(`  - ${atRule}`)
      })
    }

    // 移除空的规则
    cleanedCSS = cleanedCSS.replace(/[^{}]+{\s*}/g, '')

    return { css: cleanedCSS, removedCount }
  }


  /**
   * 验证样式转换结果
   */
  validateTransformResult(result: StyleTransformResult): { valid: boolean; errors: string[] } {
    const errors: string[] = []

    // 检查 WXSS 语法
    if (!result.wxss.trim()) {
      errors.push('生成的 WXSS 为空')
    }

    // 检查大括号匹配
    const openBraces = (result.wxss.match(/{/g) || []).length
    const closeBraces = (result.wxss.match(/}/g) || []).length

    if (openBraces !== closeBraces) {
      errors.push('WXSS 大括号不匹配')
    }

    // 检查是否包含不支持的属性
    const unsupportedProps = ['box-shadow', 'text-shadow', 'filter']
    unsupportedProps.forEach(prop => {
      if (result.wxss.includes(prop)) {
        errors.push(`包含不支持的属性: ${prop}`)
      }
    })

    return {
      valid: errors.length === 0,
      errors
    }
  }

  /**
   * 生成样式统计报告
   */
  generateStatsReport(result: StyleTransformResult): string {
    const { stats } = result

    return `样式转换统计:
- 原始规则数: ${stats.originalRules}
- 转换后规则数: ${stats.transformedRules}
- 移除规则数: ${stats.removedRules}
- 转换率: ${((stats.transformedRules / stats.originalRules) * 100).toFixed(1)}%`
  }

  /**
   * 获取样式复杂度评分
   */
  getComplexityScore(result: StyleTransformResult): number {
    let score = 0

    // 基于规则数量
    score += result.stats.transformedRules * 1

    // 基于移除的规则数量（复杂度惩罚）
    score += result.stats.removedRules * 2

    // 基于作用域样式
    if (result.scopeId) {
      score += 5
    }

    return score
  }
}
