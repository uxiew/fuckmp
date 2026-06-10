import { describe, expect, it } from 'vitest'
import {
  createComponentLifecycleHandlers,
  createLifecycleConfig,
  createPageLifecycleHandlers,
  ensureLifetimes,
  getHookNameFromPerformanceStartKey,
  getOptionalPageHookNames,
  getPerformanceStartKey,
  isPerformanceStartKey
} from '@/runtime/core/lifecycle-utils.js'

describe('runtime lifecycle utils', () => {
  it('合并生命周期配置并保留默认开关旧语义', () => {
    expect(createLifecycleConfig()).toEqual({
      debug: false,
      enablePerformanceTracking: false
    })
    expect(createLifecycleConfig({ debug: true })).toEqual({
      debug: true,
      enablePerformanceTracking: false
    })
  })

  it('构造页面 lifecycle handlers 并保持 Vue hook 包裹顺序', () => {
    const events: string[] = []
    const handlers = createPageLifecycleHandlers({
      onLoad: options => events.push(`onLoad:${options.id}`),
      onShow: () => events.push('onShow'),
      onReady: () => events.push('onReady'),
      onHide: () => events.push('onHide'),
      onUnload: () => events.push('onUnload')
    }, hookName => events.push(hookName))

    handlers.onLoad({ id: 42 })
    handlers.onShow()
    handlers.onReady?.()
    handlers.onHide()
    handlers.onUnload()

    expect(events).toEqual([
      'onBeforeMount',
      'onLoad:42',
      'onMounted',
      'onActivated',
      'onShow',
      'onReady',
      'onDeactivated',
      'onHide',
      'onBeforeUnmount',
      'onUnload',
      'onUnmounted'
    ])
  })

  it('缺少页面原生 hooks 时仍创建基础 Vue 生命周期包装', () => {
    const events: string[] = []
    const handlers = createPageLifecycleHandlers({}, hookName => events.push(hookName))

    handlers.onLoad({ id: 1 })
    handlers.onShow()
    handlers.onHide()
    handlers.onUnload()

    expect(handlers.onReady).toBeUndefined()
    expect(events).toEqual([
      'onBeforeMount',
      'onMounted',
      'onActivated',
      'onDeactivated',
      'onBeforeUnmount',
      'onUnmounted'
    ])
  })

  it('构造组件 lifecycle handlers 并保持包裹顺序和 error 透传', () => {
    const events: string[] = []
    const error = new Error('boom')
    const handlers = createComponentLifecycleHandlers({
      created: () => events.push('created'),
      ready: () => events.push('ready'),
      detached: () => events.push('detached'),
      error: receivedError => events.push(`error:${receivedError.message}`)
    }, hookName => events.push(hookName))

    handlers.created()
    handlers.ready()
    handlers.detached()
    handlers.error(error)

    expect(events).toEqual([
      'onBeforeMount',
      'created',
      'onMounted',
      'ready',
      'onBeforeUnmount',
      'detached',
      'onUnmounted',
      'error:boom'
    ])
  })

  it('复用现有 lifetimes 对象，缺少时按旧语义创建', () => {
    const existing = { attached: () => undefined }
    const withExisting: any = { lifetimes: existing }
    const withoutLifetimes: any = {}

    expect(ensureLifetimes(withExisting)).toBe(existing)
    expect(ensureLifetimes(withoutLifetimes)).toEqual({})
    expect(withoutLifetimes.lifetimes).toBe(ensureLifetimes(withoutLifetimes))
  })

  it('返回可选页面 hook 顺序并封装性能 start key 规则', () => {
    expect(getOptionalPageHookNames()).toEqual([
      'onPullDownRefresh',
      'onReachBottom',
      'onShareAppMessage',
      'onPageScroll',
      'onResize',
      'onTabItemTap'
    ])
    expect(getPerformanceStartKey('onLoad')).toBe('onLoad_start')
    expect(isPerformanceStartKey('onLoad_start')).toBe(true)
    expect(isPerformanceStartKey('onLoad_end')).toBe(false)
    expect(getHookNameFromPerformanceStartKey('onLoad_start')).toBe('onLoad')
  })
})
