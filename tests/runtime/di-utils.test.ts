import { describe, expect, it, vi } from 'vitest'
import {
  applyInjectedValueToInstance,
  createDIConfig,
  createInjectedUpdate,
  createProviderChain,
  findProviderInParentChain,
  getInjectionLogKey,
  hasOwnProvider,
  listDependentChildInstances,
  resolveProviderValue,
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
    expect(resolveProviderValue(providers, symbolKey)).toEqual({
      found: true,
      value: 'dark'
    })
    expect(resolveProviderValue(providers, 'missing')).toEqual({
      found: false,
      value: undefined
    })
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

  it('按当前实例到根实例顺序构造 provider chain', () => {
    const root = { name: 'root' }
    const parent = { name: 'parent' }
    const child = { name: 'child' }
    const hierarchy = new Map<any, any>([
      [child, parent],
      [parent, root]
    ])

    expect(createProviderChain(child, instance => hierarchy.get(instance))).toEqual([
      child,
      parent,
      root
    ])
  })

  it('从父链查找 provider 时跳过当前实例并按父级优先', () => {
    const root = { name: 'root' }
    const parent = { name: 'parent' }
    const child = { name: 'child' }
    const providers = new Map<any, Map<any, any>>([
      [child, new Map([['theme', 'child-theme']])],
      [parent, new Map([['theme', 'parent-theme']])],
      [root, new Map([['theme', 'root-theme']])]
    ])

    const match = findProviderInParentChain(
      [child, parent, root],
      'theme',
      (instance, key) => {
        const provider = providers.get(instance)
        return {
          found: Boolean(provider?.has(key)),
          value: provider?.get(key)
        }
      }
    )

    expect(match).toEqual({
      instance: parent,
      value: 'parent-theme'
    })
  })

  it('只列出直接依赖当前 provider 的子实例', () => {
    const parent = { name: 'parent' }
    const child = { name: 'child' }
    const grandchild = { name: 'grandchild' }
    const sibling = { name: 'sibling' }
    const hierarchy = new Map<any, any>([
      [child, parent],
      [grandchild, child],
      [sibling, { name: 'other-parent' }]
    ])

    expect(listDependentChildInstances(hierarchy, parent)).toEqual([child])
  })
})
