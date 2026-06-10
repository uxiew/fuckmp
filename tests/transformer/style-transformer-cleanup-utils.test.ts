import { describe, expect, it } from 'vitest'
import {
  removeUnsupportedStyleRules,
  transformStyleProperties,
  transformStyleSelectors
} from '@/transformer/style-transformer-cleanup-utils.js'

describe('style-transformer cleanup utils', () => {
  it('清理不支持的伪类和 webkit/moz 伪元素选择器', () => {
    const css = [
      '.button:hover { color: red; }',
      '.input:focus { color: blue; }',
      '.scroll::-webkit-scrollbar { width: 4px; }',
      '.range::-moz-range-thumb { color: red; }',
      '.deep ::v-deep .child { color: green; }',
      '.wrap :deep(.inner) { color: black; }'
    ].join('\n')

    const result = transformStyleSelectors(css)

    expect(result).not.toContain(':hover')
    expect(result).not.toContain(':focus')
    expect(result).not.toContain('::-webkit-scrollbar')
    expect(result).not.toContain('::-moz-range-thumb')
    expect(result).toContain('.button { color: red; }')
    expect(result).toContain('.input { color: blue; }')
    expect(result).toContain('.deep  .child { color: green; }')
    expect(result).toContain('.wrap .inner { color: black; }')
  })

  it('转换或移除小程序不支持的样式属性', () => {
    const css = [
      '.card {',
      '  box-shadow: 0 0 2px #000;',
      '  filter: blur(2px);',
      '  position: sticky;',
      '  cursor: pointer;',
      '  color: red;',
      '}'
    ].join('\n')

    const result = transformStyleProperties(css)

    expect(result).not.toContain('box-shadow')
    expect(result).not.toContain('filter')
    expect(result).not.toContain('cursor')
    expect(result).toContain('position: relative')
    expect(result).toContain('color: red;')
  })

  it('只移除声明块内的 mask 属性，不破坏包含 mask 的选择器', () => {
    const css = [
      '.ui-mask:empty::after {',
      '  color: #9aa4b2;',
      "  content: 'mask';",
      '  font-size: 24rpx;',
      '}',
      '.masked {',
      '  mask: linear-gradient(#000, transparent);',
      '  color: red;',
      '}'
    ].join('\n')

    const result = transformStyleProperties(css)

    expect(result).toContain('.ui-mask:empty::after')
    expect(result).toContain("content: 'mask';")
    expect(result).toContain('font-size: 24rpx;')
    expect(result).toContain('.masked {')
    expect(result).not.toContain('mask: linear-gradient')
    expect(result).toContain('color: red;')
  })

  it('移除 unsupported 属性、媒体查询和非 import at-rule 并统计数量', () => {
    const css = [
      '@import "./base.wxss";',
      '@media screen and (min-width: 600px) { .wide { color: red; } }',
      '@keyframes fade { from { opacity: 0; } to { opacity: 1; } }',
      '.card {',
      '  box-shadow: 0 0 2px #000;',
      '  user-select: none;',
      '  color: blue;',
      '}',
      '.empty { box-shadow: 0 0 1px #000; }'
    ].join('\n')

    const result = removeUnsupportedStyleRules(css)

    expect(result.css).toContain('@import "./base.wxss";')
    expect(result.css).not.toContain('@media')
    expect(result.css).not.toContain('@keyframes')
    expect(result.css).not.toContain('box-shadow')
    expect(result.css).not.toContain('user-select')
    expect(result.css).toContain('color: blue;')
    expect(result.css).not.toContain('.empty')
    expect(result.removedCount).toBe(5)
  })

  it('清理 unsupported 属性时保留包含属性名的合法选择器和内容值', () => {
    const css = [
      '.ui-mask:empty::after {',
      '  color: #9aa4b2;',
      "  content: 'mask';",
      '  font-size: 24rpx;',
      '}',
      '.card {',
      '  mask: linear-gradient(#000, transparent);',
      '  color: blue;',
      '}'
    ].join('\n')

    const result = removeUnsupportedStyleRules(css)

    expect(result.css).toContain('.ui-mask:empty::after')
    expect(result.css).toContain("content: 'mask';")
    expect(result.css).toContain('font-size: 24rpx;')
    expect(result.css).not.toContain('mask: linear-gradient')
    expect(result.css).toContain('color: blue;')
    expect(result.removedCount).toBe(1)
  })
})
