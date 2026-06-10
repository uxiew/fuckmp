import { describe, expect, it } from 'vitest'
import {
  addPageHeader,
  generatePageEventHandlers,
  generatePageComputedMethods,
  generatePageComputedUpdate,
  generatePageLifecycleCode,
  generatePageMethodsCode,
  getPagePath,
  getPageTitle,
  generatePageReactivitySetup,
  generatePageTemplateEventHandlers,
  generatePageWXSS,
  hasPageLoadingState,
  hasPageRefreshHandler
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

  it('推断页面标题、路径与状态判断并保持旧语义', () => {
    expect(getPageTitle('src/pages/index.vue')).toBe('Index')
    expect(getPageTitle('src/pages/user-profile.vue')).toBe('User-profile')
    expect(getPageTitle('')).toBe('Page')
    expect(getPagePath('src/pages/index.vue')).toBe('pages/index')

    expect(hasPageRefreshHandler({
      lifecycle: { onPullDownRefresh: 'this.refreshData()' },
      methods: {}
    } as any)).toBe(true)
    expect(hasPageRefreshHandler({
      lifecycle: {},
      methods: { refreshData: 'return Promise.resolve()' }
    } as any)).toBe(true)
    expect(hasPageRefreshHandler({ lifecycle: {}, methods: {} } as any)).toBe(false)
    expect(hasPageLoadingState({ data: { loading: false } } as any)).toBe(true)
    expect(hasPageLoadingState({ data: {} } as any)).toBe(false)
  })

  it('生成页面内置事件处理器并保持旧输出片段', () => {
    const handlers = generatePageEventHandlers({
      data: { count: 0, 'user.name': '' },
      lifecycle: {},
      methods: {}
    } as any)

    expect(handlers).toContain(`  handleTap(event) {
    const { dataset } = event.currentTarget
    const { action, data } = dataset`)
    expect(handlers).toContain(`  _handleInput_count(event) {
    const value = event.detail.value
    this.setData({
      count: value
    })
    this._updateComputed()
  }`)
    expect(handlers).toContain('  _handleInput_user_name(event) {')
    expect(handlers).toContain('  onReachBottom() {')
    expect(handlers).toContain('  loadMoreData() {')
    expect(handlers).not.toContain('  onPullDownRefresh() {')
  })

  it('有刷新入口时生成下拉刷新处理器', () => {
    const handlers = generatePageEventHandlers({
      data: {},
      lifecycle: { onPullDownRefresh: 'this.refreshData()' },
      methods: {}
    } as any)

    expect(handlers).toContain('  onPullDownRefresh() {')
    expect(handlers).toContain('      wx.stopPullDownRefresh()')
    expect(handlers).toContain('  refreshData() {')
  })

  it('追加页面文件头并保留源文件与页面类型信息', () => {
    const code = addPageHeader('Page({})', 'src/pages/index.vue')

    expect(code).toContain('// 由 Vue3 微信小程序编译器自动生成')
    expect(code).toContain('// 源文件: src/pages/index.vue')
    expect(code).toContain('// 页面类型: Page')
    expect(code).toContain('// 生成时间: ')
    expect(code.endsWith('\n\nPage({})')).toBe(true)
  })
})
