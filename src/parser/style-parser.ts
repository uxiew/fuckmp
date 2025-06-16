/**
 * Style 解析器
 */

import sass from 'sass'
import postcss from 'postcss'
import autoprefixer from 'autoprefixer'
import type { ParseResult } from '@/types/index.js'
import { logger } from '@/utils/index.js'

/**
 * 样式解析结果
 */
export interface StyleParseResult {
  /** 编译后的 CSS */
  css: string
  /** Source Map */
  map?: string
  /** 使用的 CSS 特性 */
  features: CSSFeature[]
  /** CSS 变量 */
  variables: Map<string, string>
  /** 选择器列表 */
  selectors: string[]
  /** 媒体查询 */
  mediaQueries: string[]
  /** 关键帧动画 */
  keyframes: string[]
  /** 错误信息 */
  errors: string[]
  /** 警告信息 */
  warnings: string[]
}

/**
 * CSS 特性
 */
export interface CSSFeature {
  name: string
  type: 'property' | 'value' | 'selector' | 'at-rule'
  supported: boolean
  fallback?: string
}

/**
 * Style 解析器类
 */
export class StyleParser {
  /**
   * 解析样式内容
   */
  async parseStyle(
    content: string,
    lang: string = 'css',
    filename: string,
    options: {
      scoped?: boolean
      sourcemap?: boolean
    } = {}
  ): Promise<StyleParseResult> {
    try {
      logger.debug(`解析样式: ${filename} (${lang})`)

      let css = content
      let map: string | undefined

      // 预处理器编译
      if (lang === 'scss' || lang === 'sass') {
        const result = await this.compileSCSS(content, filename, options.sourcemap)
        css = result.css
        map = result.map
      }

      // PostCSS 处理
      const postcssResult = await this.processPostCSS(css, filename, options.sourcemap)
      css = postcssResult.css
      if (postcssResult.map) {
        map = postcssResult.map
      }

      // 分析 CSS
      const analysisResult = await this.analyzeCSS(css)

      const result: StyleParseResult = {
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

      // 作用域处理
      if (options.scoped) {
        result.css = this.addScopedStyles(result.css, filename)
      }

      logger.debug(`样式解析完成: ${filename}`)
      return result

    } catch (error) {
      logger.error(`样式解析失败: ${filename}`, error as Error)
      throw error
    }
  }

  /**
   * 编译 SCSS
   */
  private async compileSCSS(
    content: string,
    filename: string,
    sourcemap: boolean = false
  ): Promise<{ css: string; map?: string }> {
    try {
      const result = sass.compileString(content, {
        style: 'expanded',
        sourceMap: sourcemap,
        sourceMapIncludeSources: sourcemap
      })

      const returnValue: { css: string; map?: string } = {
        css: result.css
      }

      if (result.sourceMap) {
        returnValue.map = JSON.stringify(result.sourceMap)
      }

      return returnValue
    } catch (error) {
      logger.error(`SCSS 编译失败: ${filename}`, error as Error)
      throw error
    }
  }

  /**
   * PostCSS 处理
   */
  private async processPostCSS(
    css: string,
    filename: string,
    sourcemap: boolean = false
  ): Promise<{ css: string; map?: string }> {
    try {
      const plugins = [
        autoprefixer(),
        this.createMiniprogramTransformer(),
        this.createUnitTransformer(),
        this.createVariableTransformer()
      ]

      const result = await postcss(plugins).process(css, {
        from: filename,
        map: sourcemap ? { inline: false } : false
      })

      return {
        css: result.css,
        map: result.map?.toString()
      }
    } catch (error) {
      logger.error(`PostCSS 处理失败: ${filename}`, error as Error)
      throw error
    }
  }

  /**
   * 创建小程序转换器
   */
  private createMiniprogramTransformer() {
    return {
      postcssPlugin: 'miniprogram-transformer',
      Rule(rule: any) {
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
          .replace(/:deep\(/g, ' ')
          .replace(/\)/g, '')
      },
      Declaration(decl: any) {
        // 移除不支持的属性
        const unsupportedProps = [
          'box-shadow',
          'text-shadow',
          'filter',
          'backdrop-filter',
          'clip-path'
        ]

        if (unsupportedProps.includes(decl.prop)) {
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
   * 创建单位转换器
   */
  private createUnitTransformer() {
    return {
      postcssPlugin: 'unit-transformer',
      Declaration(decl: any) {
        // px 转 rpx (1px = 2rpx)
        decl.value = decl.value.replace(/(\d+(?:\.\d+)?)px/g, (match: string, num: string) => {
          const value = parseFloat(num)
          return `${value * 2}rpx`
        })

        // vh/vw 转换 (假设设计稿为 375*667)
        decl.value = decl.value.replace(/(\d+(?:\.\d+)?)vh/g, (match: string, num: string) => {
          const value = parseFloat(num)
          return `${(value * 667 / 100) * 2}rpx`
        })

        decl.value = decl.value.replace(/(\d+(?:\.\d+)?)vw/g, (match: string, num: string) => {
          const value = parseFloat(num)
          return `${(value * 375 / 100) * 2}rpx`
        })
      }
    }
  }

  /**
   * 创建 CSS 变量转换器
   */
  private createVariableTransformer() {
    const variables = new Map<string, string>()

    return {
      postcssPlugin: 'variable-transformer',
      Rule(rule: any) {
        // 收集 CSS 变量
        rule.walkDecls((decl: any) => {
          if (decl.prop.startsWith('--')) {
            variables.set(decl.prop, decl.value)
            decl.remove()
          }
        })

        // 替换 var() 函数
        rule.walkDecls((decl: any) => {
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
   * 分析 CSS
   */
  private async analyzeCSS(css: string): Promise<{
    features: CSSFeature[]
    variables: Map<string, string>
    selectors: string[]
    mediaQueries: string[]
    keyframes: string[]
  }> {
    const features: CSSFeature[] = []
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
   * 添加作用域样式
   */
  private addScopedStyles(css: string, filename: string): string {
    // 生成作用域 ID
    const scopeId = this.generateScopeId(filename)

    // 为每个选择器添加作用域
    const root = postcss.parse(css)

    root.walkRules(rule => {
      rule.selector = rule.selector
        .split(',')
        .map(selector => `${selector.trim()}[data-v-${scopeId}]`)
        .join(', ')
    })

    return root.toString()
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
    return Math.abs(hash).toString(36).substring(0, 8)
  }

  /**
   * 检查是否使用了不支持的特性
   */
  hasUnsupportedFeatures(result: StyleParseResult): boolean {
    return result.features.some(feature => !feature.supported)
  }

  /**
   * 获取样式复杂度评分
   */
  getComplexityScore(result: StyleParseResult): number {
    let score = 0

    // 选择器复杂度
    score += result.selectors.length

    // 媒体查询复杂度
    score += result.mediaQueries.length * 2

    // 动画复杂度
    score += result.keyframes.length * 3

    // CSS 变量复杂度
    score += result.variables.size

    return score
  }
}
