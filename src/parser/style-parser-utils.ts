/**
 * Style parser PostCSS plugin helpers.
 */

import type { Declaration, Plugin, Rule } from 'postcss'

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
        .replace(/:deep\(/g, ' ')
        .replace(/\)/g, '')
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
