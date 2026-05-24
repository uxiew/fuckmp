import { describe, expect, it, vi } from 'vitest'
import {
  applyInjectedValueToInstance,
  createDIConfig,
  createInjectedUpdate,
  getInjectionLogKey,
  hasOwnProvider,
  shouldUpdateReactiveProvider
} from '@/runtime/core/di-utils.js'

describe('runtime DI utils', () => {
  it('合并 DI 配置并保留默认开关旧语义', () => {
    expect(createDIConfig()).toEqual({
      debug: false,
      enableGlobalProviders: true,
      enableReactiveProviders: true
    })
    expect(createDIConfig({ debug: true, enableGlobalProviders: false })).toEqual({
      debug: true,
      enableGlobalProviders: false,
      enableReactiveProviders: true
    })
  })

  it('判断 provider 命中和响应式更新开关', () => {
    const symbolKey = Symbol('theme')
    const providers = new Map<any, any>([[symbolKey, 'dark']])

    expect(hasOwnProvider(providers, symbolKey)).toBe(true)
    expect(hasOwnProvider(providers, 'missing')).toBe(false)
    expect(shouldUpdateReactiveProvider({ enableReactiveProviders: true })).toBe(true)
    expect(shouldUpdateReactiveProvider({ enableReactiveProviders: false })).toBe(false)
  })

  it('构造注入更新对象并格式化日志 key', () => {
    const symbolKey = Symbol('token')

    expect(createInjectedUpdate('theme', 'dark')).toEqual({ theme: 'dark' })
    expect(getInjectionLogKey('theme')).toBe('theme')
    expect(getInjectionLogKey(symbolKey)).toBe('Symbol(token)')
  })

  it('优先通过 setData 写入注入值', () => {
    const instance = { setData: vi.fn() }

    applyInjectedValueToInstance(instance, 'theme', 'dark')

    expect(instance.setData).toHaveBeenCalledWith({ theme: 'dark' })
    expect(instance).not.toHaveProperty('data')
  })

  it('缺少 setData 时写入 data 对象', () => {
    const instance: any = {}

    applyInjectedValueToInstance(instance, 'theme', 'dark')
    applyInjectedValueToInstance(instance, 'locale', 'zh-CN')

    expect(instance.data).toEqual({ theme: 'dark', locale: 'zh-CN' })
  })
})
