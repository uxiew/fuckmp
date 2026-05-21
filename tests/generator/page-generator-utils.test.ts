import { describe, expect, it } from 'vitest'
import { generatePageWXSS } from '@/generator/page-generator-utils.js'

describe('page generator utils', () => {
  it('未启用基础样式时返回单个样式内容', () => {
    expect(
      generatePageWXSS({ wxss: '.title { color: red; }' } as any, { includeBaseStyles: false })
    ).toBe('.title { color: red; }')
  })

  it('启用基础样式时追加用户样式', () => {
    const wxss = generatePageWXSS({ wxss: '.title { color: red; }' } as any, {
      includeBaseStyles: true,
    })

    expect(wxss).toContain('.page-container')
    expect(wxss).toContain('/* 用户自定义样式 */\n.title { color: red; }')
  })

  it('合并多个样式结果并过滤空样式', () => {
    const wxss = generatePageWXSS([{ wxss: '.a {}' }, { wxss: '' }, { wxss: '.b {}' }] as any, {
      includeBaseStyles: false,
    })

    expect(wxss).toBe('.a {}\n\n.b {}')
  })
})
