import postcss from 'postcss'
import { describe, expect, it } from 'vitest'
import {
  analyzeStyleCss,
  createMiniprogramStylePlugin,
  createStyleParseResult,
  createStyleUnitPlugin,
  createStyleVariablePlugin,
  getStyleComplexityScore,
  shouldCompileStylePreprocessor
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

  it('仅对 scss/sass 启用预处理编译', () => {
    expect(shouldCompileStylePreprocessor('scss')).toBe(true)
    expect(shouldCompileStylePreprocessor('sass')).toBe(true)
    expect(shouldCompileStylePreprocessor('css')).toBe(false)
    expect(shouldCompileStylePreprocessor('less')).toBe(false)
  })

  it('分析 CSS selectors、变量、媒体查询与 keyframes', () => {
    const analysis = analyzeStyleCss(`
      :root { --main: #333; }
      .card, .panel { color: var(--main); }
      @media (min-width: 750px) { .card { display: flex; } }
      @keyframes fade { from { opacity: 0; } to { opacity: 1; } }
    `)

    expect(analysis.features).toEqual([])
    expect([...analysis.variables.entries()]).toEqual([['--main', '#333']])
    expect(analysis.selectors).toEqual([':root', '.card, .panel', '.card', 'from', 'to'])
    expect(analysis.mediaQueries).toEqual(['(min-width: 750px)'])
    expect(analysis.keyframes).toEqual(['fade'])
  })

  it('构造解析结果并按旧权重计算复杂度', () => {
    const analysis = {
      features: [],
      variables: new Map([['--main', '#333']]),
      selectors: ['.a', '.b'],
      mediaQueries: ['screen'],
      keyframes: ['fade']
    }

    expect(createStyleParseResult('.a{}', undefined, analysis)).toEqual({
      css: '.a{}',
      features: [],
      variables: analysis.variables,
      selectors: ['.a', '.b'],
      mediaQueries: ['screen'],
      keyframes: ['fade'],
      errors: [],
      warnings: []
    })
    expect(createStyleParseResult('.a{}', 'source-map', analysis)).toMatchObject({
      css: '.a{}',
      map: 'source-map'
    })
    expect(getStyleComplexityScore(createStyleParseResult('.a{}', undefined, analysis))).toBe(8)
  })
})
