import { describe, expect, it } from 'vitest'
import {
  generatePageComputedMethods,
  generatePageComputedUpdate,
  generatePageLifecycleCode,
  generatePageMethodsCode,
  generatePageReactivitySetup,
  generatePageTemplateEventHandlers,
  generatePageWXSS
} from '@/generator/page-generator-utils.js'

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

  it('生成页面生命周期并确保 onLoad 初始化响应式系统', () => {
    const emptySetupLine = '    '

    expect(generatePageLifecycleCode({
      onLoad: 'this.ready = true',
      onShow: 'this.trackShow()'
    })).toBe(`  onLoad(options) {
    this._setupReactivity()
    this.ready = true
  },

  onShow() {
${emptySetupLine}
    this.trackShow()
  }`)
  })

  it('缺少 onLoad 时生成默认响应式初始化生命周期', () => {
    expect(generatePageLifecycleCode({})).toBe(`  onLoad(options) {
    this._setupReactivity()
    // 页面加载完成
  }`)
  })

  it('生成对象、箭头函数和字符串方法', () => {
    const methods = generatePageMethodsCode({
      inc: { body: '(step) => { this.count += step }' },
      label: { body: '() => count + 1' },
      raw: 'console.log("ok")'
    })

    expect(methods).toContain(`  inc(step) {
    this.count += step
  }`)
    expect(methods).toContain(`  label() {
    return count + 1
  }`)
    expect(methods).toContain(`  raw() {
    console.log("ok")
  }`)
  })

  it('生成计算属性方法与更新代码', () => {
    expect(generatePageComputedMethods({
      total: { getter: 'return this.data.count + 1' }
    })).toBe(`  _computed_total() {
    return this.data.count + 1
  }`)

    expect(generatePageComputedUpdate({ total: {}, title: {} })).toBe(`    this.setData({
      total: this._computed_total(),
      title: this._computed_title()
    })`)
  })

  it('生成模板 v-model 回写事件处理器', () => {
    const eventHandlers = new Map([
      ['_handleUpdate_title', 'unused'],
      ['handleTap', 'unused']
    ])

    expect(generatePageTemplateEventHandlers({ eventHandlers } as any)).toBe(`  _handleUpdate_title(event) {
    this.setData({
      title: event.detail
    })
    this._updateComputed()
  }`)
  })

  it('生成页面响应式初始化代码', () => {
    expect(generatePageReactivitySetup({
      hasComputed: true,
      includeLoadingState: true
    })).toBe(`    this._updateComputed()
    // 初始化页面状态
    this.setData({
      loading: false,
      hasMore: true
    })`)
  })
})
