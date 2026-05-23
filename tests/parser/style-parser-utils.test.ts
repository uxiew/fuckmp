import postcss from 'postcss'
import { describe, expect, it } from 'vitest'
import {
  createMiniprogramStylePlugin,
  createStyleUnitPlugin,
  createStyleVariablePlugin
} from '@/parser/style-parser-utils.js'

describe('style-parser utils', () => {
  it('转换小程序不支持的选择器和声明', async () => {
    const result = await postcss([createMiniprogramStylePlugin()]).process(
      '.btn:hover{box-shadow:0 1px 2px #000;position:sticky;filter:blur(1px)}',
      { from: undefined }
    )

    expect(result.css).not.toContain(':hover')
    expect(result.css).not.toContain('box-shadow')
    expect(result.css).not.toContain('filter')
    expect(result.css).toContain('.btn{position:relative}')
  })

  it('转换 px/vh/vw 为 rpx 单位', async () => {
    const result = await postcss([createStyleUnitPlugin()]).process(
      '.box{width:10px;min-height:50vh;max-width:80vw}',
      { from: undefined }
    )

    expect(result.css).toContain('width:20rpx')
    expect(result.css).toContain('min-height:667rpx')
    expect(result.css).toContain('max-width:600rpx')
  })

  it('替换 CSS 变量并保留 fallback', async () => {
    const result = await postcss([createStyleVariablePlugin()]).process(
      ':root{--main:#333}.title{color:var(--main);border-color:var(--missing,#eee)}',
      { from: undefined }
    )

    expect(result.css).not.toContain('--main')
    expect(result.css).not.toContain('var(')
    expect(result.css).toContain('color:#333')
    expect(result.css).toContain('border-color:#eee')
  })
})
