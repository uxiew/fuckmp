import { describe, expect, it } from 'vitest'
import {
  addScopedStyles,
  countStyleRules,
  generateStyleScopeId,
  minifyCSS,
  transformStyleUnits
} from '@/transformer/style-transformer-utils.js'

describe('style-transformer utils', () => {
  it('转换 web 单位为小程序 rpx 单位', () => {
    const css = [
      '.box {',
      '  width: 10px;',
      '  font-size: 1rem;',
      '  border-width: 0.125em;',
      '  min-height: 50vh;',
      '  max-width: 80vw;',
      '}'
    ].join('\n')

    expect(transformStyleUnits(css)).toContain('width: 20rpx')
    expect(transformStyleUnits(css)).toContain('font-size: 32rpx')
    expect(transformStyleUnits(css)).toContain('border-width: 4rpx')
    expect(transformStyleUnits(css)).toContain('min-height: 667rpx')
    expect(transformStyleUnits(css)).toContain('max-width: 600rpx')
  })

  it('为多选择器添加 scoped 属性', () => {
    expect(addScopedStyles('.a, .b > .c {\n  color: red;\n}', 'abc123')).toBe(
      '.a[data-v-abc123], .b > .c[data-v-abc123] {\n  color: red;\n}'
    )
  })

  it('压缩 CSS 并移除注释和多余空白', () => {
    const css = `
      /* comment */
      .a {
        color : red ;
      }
      .b, .c {
        padding : 10rpx ;
      }
    `

    expect(minifyCSS(css)).toBe('.a{color:red;}.b,.c{padding:10rpx;}')
  })

  it('生成稳定 scopeId 并统计规则数量', () => {
    expect(generateStyleScopeId('components/Card.vue')).toMatch(/^[a-z0-9]{6}$/)
    expect(generateStyleScopeId('components/Card.vue')).toBe(generateStyleScopeId('components/Card.vue'))
    expect(countStyleRules('.a { color: red; }\n.b { color: blue; }')).toBe(2)
    expect(countStyleRules('')).toBe(0)
  })
})
