import { describe, expect, it, vi } from 'vitest'
import {
  DIInstance,
  type DIContainerContext
} from '@/runtime/core/di-instance.js'

function createContext(
  instances = new Map<any, DIInstance>(),
  hierarchy = new Map<any, any>(),
  globalProviders = new Map<any, any>()
): DIContainerContext {
  return {
    getProviderChain(instance: any) {
      const chain: any[] = []
      let current = instance

      while (current) {
        chain.push(current)
        current = hierarchy.get(current)
      }

      return chain
    },
    getInstances() {
      return instances
    },
    getProviderHierarchy() {
      return hierarchy
    },
    inject(key: any, defaultValue?: any) {
      return globalProviders.has(key) ? globalProviders.get(key) : defaultValue
    }
  }
}

describe('runtime DIInstance', () => {
  it('设置 provider/injector 并挂载实例 provide/inject 方法', () => {
    const setData = vi.fn()
    const instance: any = { setData }
    const instances = new Map<any, DIInstance>()
    const context = createContext(instances)
    const diInstance = new DIInstance(
      instance,
      {
        providers: {
          theme: { key: 'theme', value: 'dark' }
        },
        injectors: {
          theme: { key: 'theme', defaultValue: 'light' }
        }
      },
      { debug: false, enableGlobalProviders: true, enableReactiveProviders: true },
      context
    )

    instances.set(instance, diInstance)
    diInstance.setup()
    instance._provide('locale', 'zh-CN')

    expect(setData).toHaveBeenCalledWith({ theme: 'dark' })
    expect(instance._inject('theme', 'light')).toBe('dark')
    expect(instance._inject('locale')).toBe('zh-CN')
  })

  it('按父实例链和全局 provider fallback 注入值', () => {
    const parent: any = {}
    const child: any = { setData: vi.fn() }
    const instances = new Map<any, DIInstance>()
    const hierarchy = new Map<any, any>([[child, parent]])
    const context = createContext(instances, hierarchy, new Map([['token', 'global-token']]))
    const parentDI = new DIInstance(
      parent,
      {
        providers: {
          theme: { key: 'theme', value: 'parent-theme' }
        }
      },
      { debug: false, enableGlobalProviders: true, enableReactiveProviders: true },
      context
    )
    const childDI = new DIInstance(
      child,
      {
        injectors: {
          theme: { key: 'theme', defaultValue: 'light' },
          token: { key: 'token' }
        }
      },
      { debug: false, enableGlobalProviders: true, enableReactiveProviders: true },
      context
    )

    instances.set(parent, parentDI)
    instances.set(child, childDI)
    parentDI.setup()
    childDI.setup()

    expect(child.setData).toHaveBeenCalledWith({ theme: 'parent-theme' })
    expect(child.setData).toHaveBeenCalledWith({ token: 'global-token' })
    expect(child._inject('missing', 'fallback')).toBe('fallback')
  })

  it('父 provider 更新时同步直接依赖子实例的 injected value', () => {
    const parent: any = {}
    const child: any = { setData: vi.fn() }
    const instances = new Map<any, DIInstance>()
    const hierarchy = new Map<any, any>([[child, parent]])
    const context = createContext(instances, hierarchy)
    const parentDI = new DIInstance(
      parent,
      {
        providers: {
          theme: { key: 'theme', value: 'dark' }
        }
      },
      { debug: false, enableGlobalProviders: true, enableReactiveProviders: true },
      context
    )
    const childDI = new DIInstance(
      child,
      {
        injectors: {
          theme: { key: 'theme', defaultValue: 'light' }
        }
      },
      { debug: false, enableGlobalProviders: true, enableReactiveProviders: true },
      context
    )

    instances.set(parent, parentDI)
    instances.set(child, childDI)
    parentDI.setup()
    childDI.setup()
    parentDI.provide('theme', 'blue')

    expect(child.setData).toHaveBeenNthCalledWith(1, { theme: 'dark' })
    expect(child.setData).toHaveBeenNthCalledWith(2, { theme: 'blue' })
  })
})
