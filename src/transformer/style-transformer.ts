/**
 * Style 转换器
 */

import type { StyleParseResult } from '@/parser/index.js'
import type { TransformContext } from '@/types/index.js'
import { logger } from '@/utils/index.js'

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
      const originalRules = this.countRules(wxss)
      let removedRules = 0

      // 小程序样式转换
      wxss = this.transformMiniprogramStyles(wxss)

      // 作用域样式处理
      if (options.scoped) {
        scopeId = this.generateScopeId(context.filename)
        wxss = this.addScopedStyles(wxss, scopeId)
      }

      // 移除不支持的样式
      const { css: cleanedCss, removedCount } = this.removeUnsupportedStyles(wxss)
      wxss = cleanedCss
      removedRules = removedCount

      // 代码压缩
      if (options.minify) {
        wxss = this.minifyCSS(wxss)
      }

      const transformedRules = this.countRules(wxss)

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
    transformedCSS = this.transformUnits(transformedCSS)

    // 选择器转换
    transformedCSS = this.transformSelectors(transformedCSS)

    // 属性转换
    transformedCSS = this.transformProperties(transformedCSS)

    // 值转换
    transformedCSS = this.transformValues(transformedCSS)

    return transformedCSS
  }

  /**
   * 单位转换
   */
  private transformUnits(css: string): string {
    return css
      // px 转 rpx (1px = 2rpx)
      .replace(/(\d+(?:\.\d+)?)px/g, (match, num) => {
        const value = parseFloat(num)
        return `${value * 2}rpx`
      })
      // em 转 rpx (假设 1em = 16px = 32rpx)
      .replace(/(\d+(?:\.\d+)?)em/g, (match, num) => {
        const value = parseFloat(num)
        return `${value * 32}rpx`
      })
      // rem 转 rpx (假设 1rem = 16px = 32rpx)
      .replace(/(\d+(?:\.\d+)?)rem/g, (match, num) => {
        const value = parseFloat(num)
        return `${value * 32}rpx`
      })
      // vh 转 rpx (假设屏幕高度 667px)
      .replace(/(\d+(?:\.\d+)?)vh/g, (match, num) => {
        const value = parseFloat(num)
        return `${(value * 667 / 100) * 2}rpx`
      })
      // vw 转 rpx (假设屏幕宽度 375px)
      .replace(/(\d+(?:\.\d+)?)vw/g, (match, num) => {
        const value = parseFloat(num)
        return `${(value * 375 / 100) * 2}rpx`
      })
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
   * 值转换
   */
  private transformValues(css: string): string {
    return css
      // 转换 CSS 变量
      .replace(/var\((--[^),]+)(?:,\s*([^)]+))?\)/g, (match, varName, fallback) => {
        // 简单的变量替换，实际项目中需要更复杂的处理
        return fallback || '0'
      })
      // 转换 calc() 函数
      .replace(/calc\(([^)]+)\)/g, (match, expression) => {
        // 简单的 calc 计算，实际项目中需要更复杂的处理
        try {
          const result = this.evaluateCalcExpression(expression)
          return result
        } catch {
          return '0rpx'
        }
      })
  }

  /**
   * 添加作用域样式
   */
  private addScopedStyles(css: string, scopeId: string): string {
    return css.replace(/([^{}]+){/g, (match, selector) => {
      // 为每个选择器添加作用域属性
      const scopedSelector = selector
        .split(',')
        .map((sel: string) => `${sel.trim()}[data-v-${scopeId}]`)
        .join(', ')

      return `${scopedSelector} {`
    })
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
   * CSS 代码压缩
   */
  private minifyCSS(css: string): string {
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
   * 生成作用域 ID
   */
  private generateScopeId(filename: string): string {
    // 简单的哈希算法
    let hash = 0
    for (let i = 0; i < filename.length; i++) {
      const char = filename.charCodeAt(i)
      hash = ((hash << 5) - hash) + char
      hash = hash & hash // 转换为 32 位整数
    }
    return Math.abs(hash).toString(36).substring(0, 6)
  }

  /**
   * 计算规则数量
   */
  private countRules(css: string): number {
    const matches = css.match(/{[^}]*}/g)
    return matches ? matches.length : 0
  }

  /**
   * 计算 calc 表达式
   */
  private evaluateCalcExpression(expression: string): string {
    // 简单的 calc 计算实现
    // 实际项目中需要更完善的表达式解析器
    try {
      // 移除单位，只保留数字和运算符
      const cleanExpr = expression.replace(/[a-zA-Z%]+/g, '')

      // 简单的数学计算
      const result = Function(`"use strict"; return (${cleanExpr})`)()

      return `${result}rpx`
    } catch {
      return '0rpx'
    }
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
