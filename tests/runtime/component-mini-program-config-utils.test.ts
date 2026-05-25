import { describe, expect, it, vi } from 'vitest'
import { createMiniProgramComponentConfig } from '@/runtime/core/component-mini-program-config-utils.js'
import type { ComponentConfig } from '@/runtime/core/component.js'

function createRuntimeApi() {
  return {
    updateComputed: vi.fn(),
    triggerWatchers: vi.fn(),
    ref: vi.fn((value: unknown, rawInstance: any) => ({ type: 'ref', value, rawInstance })),
    reactive: vi.fn((target: object, rawInstance: any) => ({ type: 'reactive', target, rawInstance })),
    computed: vi.fn((getter: () => unknown, rawInstance: any) => ({ type: 'computed', value: getter(), rawInstance }))
  }
}

describe('component mini program config utils', () => {
  it('生成页面配置并保留运行时 API、methods 与页面生命周期透传', () => {
    const rawInstance = {
      onLoad: vi.fn(),
      onShow: vi.fn(),
      onUnload: vi.fn()
    }
    const runtimeApi = createRuntimeApi()
    const increment = vi.fn()

    const result = createMiniProgramComponentConfig(
      {
        data: { count: 1 },
        methods: { increment }
      },
      rawInstance,
      true,
      runtimeApi
    )

    expect(result.data).toEqual({ count: 1 })
    expect(result.increment).toBe(increment)
    expect(result.onLoad).toBe(rawInstance.onLoad)
    expect(result.onShow).toBe(rawInstance.onShow)
    expect(result.onReady).toBeUndefined()
    expect(result.onHide).toBeUndefined()
    expect(result.onUnload).toBe(rawInstance.onUnload)

    result._updateComputed()
    result._triggerWatchers({ count: 2 })
    expect(runtimeApi.updateComputed).toHaveBeenCalledWith(rawInstance)
    expect(runtimeApi.triggerWatchers).toHaveBeenCalledWith(rawInstance, { count: 2 })
    expect(result.ref('x')).toEqual({ type: 'ref', value: 'x', rawInstance })
    expect(result.reactive({ ok: true })).toEqual({ type: 'reactive', target: { ok: true }, rawInstance })
    expect(result.computed(() => 42)).toEqual({ type: 'computed', value: 42, rawInstance })
  })

  it('生成组件配置并保留 properties、options 与 watch observers 行为', () => {
    const rawInstance = {
      lifetimes: {
        attached: vi.fn()
      }
    }
    const runtimeApi = createRuntimeApi()
    const config: ComponentConfig = {
      data: { title: 'old' },
      props: { title: String },
      watch: {
        title: vi.fn(),
        count: vi.fn()
      }
    }

    const result = createMiniProgramComponentConfig(config, rawInstance, false, runtimeApi)

    expect(result.data).toEqual({ title: 'old' })
    expect(result.lifetimes).toBe(rawInstance.lifetimes)
    expect(result.options).toEqual({
      multipleSlots: true,
      addGlobalClass: true
    })
    expect(result.properties).toEqual({ title: String })
    expect(Object.keys(result.observers)).toEqual(['title', 'count'])

    const observerContext = { _triggerWatchers: vi.fn() }
    result.observers.title.call(observerContext, 'new title')
    result.observers.count.call(observerContext, 3)

    expect(observerContext._triggerWatchers).toHaveBeenCalledWith({ title: 'new title' })
    expect(observerContext._triggerWatchers).toHaveBeenCalledWith({ count: 3 })
    expect(runtimeApi.triggerWatchers).not.toHaveBeenCalled()
  })
})
