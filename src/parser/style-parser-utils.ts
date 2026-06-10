/**
 * Style parser PostCSS plugin helpers.
 */

import postcss, { type Declaration, type Plugin, type Rule } from 'postcss'

/**
 * CSS feature metadata collected from style analysis.
 */
export interface StyleFeatureInfo {
  name: string
  type: 'property' | 'value' | 'selector' | 'at-rule'
  supported: boolean
  fallback?: string
}

/**
 * CSS analysis result used by style parsing.
 */
export interface StyleAnalysisResult {
  features: StyleFeatureInfo[]
  variables: Map<string, string>
  selectors: string[]
  mediaQueries: string[]
  keyframes: string[]
}

/**
 * Parsed style result shape returned by the parser.
 */
export interface ParsedStyleResult extends StyleAnalysisResult {
  css: string
  map?: string
  errors: string[]
  warnings: string[]
}

const UNSUPPORTED_MINIPROGRAM_STYLE_PROPS = [
  'box-shadow',
  'text-shadow',
  'filter',
  'backdrop-filter',
  'clip-path'
] as const

/**
 * 创建小程序样式兼容转换插件。
 */
export function createMiniprogramStylePlugin(): Plugin {
  return {
    postcssPlugin: 'miniprogram-transformer',
    Rule(rule: Rule) {
      // 移除不支持的伪类
      rule.selector = rule.selector
        .replace(/:hover/g, '')
        .replace(/:focus/g, '')
        .replace(/:active/g, '')
        .replace(/::before/g, '::before')
        .replace(/::after/g, '::after')

      // 处理深度选择器
      rule.selector = rule.selector
        .replace(/::v-deep\s+/g, ' ')
        .replace(/:deep\(([^()]*)\)/g, '$1')
    },
    Declaration(decl: Declaration) {
      if (UNSUPPORTED_MINIPROGRAM_STYLE_PROPS.includes(
        decl.prop as (typeof UNSUPPORTED_MINIPROGRAM_STYLE_PROPS)[number]
      )) {
        decl.remove()
      }

      // 处理 position: sticky
      if (decl.prop === 'position' && decl.value === 'sticky') {
        decl.value = 'relative'
      }
    }
  }
}

/**
 * 创建样式单位转换插件。
 */
export function createStyleUnitPlugin(): Plugin {
  return {
    postcssPlugin: 'unit-transformer',
    Declaration(decl: Declaration) {
      // px 转 rpx (1px = 2rpx)
      decl.value = decl.value.replace(/(\d+(?:\.\d+)?)px/g, (_: string, num: string) => {
        const value = parseFloat(num)
        return `${value * 2}rpx`
      })

      // vh/vw 转换 (假设设计稿为 375*667)
      decl.value = decl.value.replace(/(\d+(?:\.\d+)?)vh/g, (_: string, num: string) => {
        const value = parseFloat(num)
        return `${(value * 667 / 100) * 2}rpx`
      })

      decl.value = decl.value.replace(/(\d+(?:\.\d+)?)vw/g, (_: string, num: string) => {
        const value = parseFloat(num)
        return `${(value * 375 / 100) * 2}rpx`
      })
    }
  }
}

/**
 * 创建 CSS 变量转换插件。
 */
export function createStyleVariablePlugin(): Plugin {
  const variables = new Map<string, string>()

  return {
    postcssPlugin: 'variable-transformer',
    Rule(rule: Rule) {
      // 收集 CSS 变量
      rule.walkDecls((decl: Declaration) => {
        if (decl.prop.startsWith('--')) {
          variables.set(decl.prop, decl.value)
          decl.remove()
        }
      })

      // 替换 var() 函数
      rule.walkDecls((decl: Declaration) => {
        decl.value = decl.value.replace(
          /var\((--[^),]+)(?:,\s*([^)]+))?\)/g,
          (match: string, varName: string, fallback: string) => {
            return variables.get(varName) || fallback || match
          }
        )
      })
    }
  }
}

/**
 * 判断样式语言是否需要走 Sass 预处理编译。
 */
export function shouldCompileStylePreprocessor(lang: string): boolean {
  return lang === 'scss' || lang === 'sass'
}

/**
 * 分析 CSS，提取选择器、变量、媒体查询与 keyframes。
 */
export function analyzeStyleCss(css: string): StyleAnalysisResult {
  const features: StyleFeatureInfo[] = []
  const variables = new Map<string, string>()
  const selectors: string[] = []
  const mediaQueries: string[] = []
  const keyframes: string[] = []

  const root = postcss.parse(css)

  root.walkRules(rule => {
    selectors.push(rule.selector)
  })

  root.walkAtRules(atRule => {
    if (atRule.name === 'media') {
      mediaQueries.push(atRule.params)
    } else if (atRule.name === 'keyframes') {
      keyframes.push(atRule.params)
    }
  })

  root.walkDecls(decl => {
    if (decl.prop.startsWith('--')) {
      variables.set(decl.prop, decl.value)
    }
  })

  return {
    features,
    variables,
    selectors,
    mediaQueries,
    keyframes
  }
}

/**
 * 构造样式解析结果，保持旧 map 写入规则。
 */
export function createStyleParseResult(
  css: string,
  map: string | undefined,
  analysisResult: StyleAnalysisResult
): ParsedStyleResult {
  return {
    css,
    ...(map && { map }),
    features: analysisResult.features,
    variables: analysisResult.variables,
    selectors: analysisResult.selectors,
    mediaQueries: analysisResult.mediaQueries,
    keyframes: analysisResult.keyframes,
    errors: [],
    warnings: []
  }
}

/**
 * 按旧权重计算样式复杂度评分。
 */
export function getStyleComplexityScore(result: {
  selectors: { length: number }
  mediaQueries: { length: number }
  keyframes: { length: number }
  variables: { size: number }
}): number {
  let score = 0

  score += result.selectors.length
  score += result.mediaQueries.length * 2
  score += result.keyframes.length * 3
  score += result.variables.size

  return score
}
