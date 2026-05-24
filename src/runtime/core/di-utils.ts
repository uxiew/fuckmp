/**
 * 依赖注入系统纯函数工具。
 */

import type { DIConfig, InjectionKey, InjectorDef, ProviderDef } from './di.js'

export interface ProviderResolveResult<T = any> {
  found: boolean
  value: T | undefined
}

export interface ProviderChainMatch<T = any> {
  instance: any
  value: T | undefined
}

export type InjectorEntry = [string, InjectorDef]

/** 合并依赖注入配置默认值。 */
export function createDIConfig(config: DIConfig = {}): Required<DIConfig> {
  return {
    debug: false,
    enableGlobalProviders: true,
    enableReactiveProviders: true,
    ...config
  }
}

/** 格式化注入 key 用于日志输出。 */
export function getInjectionLogKey(key: InjectionKey): string {
  return String(key)
}

/** 判断当前 provider map 是否提供指定 key。 */
export function hasOwnProvider(providers: Map<InjectionKey, any>, key: InjectionKey): boolean {
  return providers.has(key)
}

/** 解析 provider map 中的指定值，同时保留 undefined provider 的命中语义。 */
export function resolveProviderValue<T>(
  providers: Map<InjectionKey, any>,
  key: InjectionKey<T>
): ProviderResolveResult<T> {
  if (!hasOwnProvider(providers, key)) {
    return {
      found: false,
      value: undefined
    }
  }

  return {
    found: true,
    value: providers.get(key)
  }
}

/** 判断是否需要响应式更新依赖子实例。 */
export function shouldUpdateReactiveProvider(config: DIConfig): boolean {
  return Boolean(config.enableReactiveProviders)
}

/** 按旧 Object.values 顺序列出 provider 定义。 */
export function listProviderDefinitions(
  providers?: Record<string, ProviderDef>
): ProviderDef[] {
  return Object.values(providers ?? {})
}

/** 按旧 Object.entries 顺序列出 injector 定义。 */
export function listInjectorEntries(
  injectors?: Record<string, InjectorDef>
): InjectorEntry[] {
  return Object.entries(injectors ?? {})
}

/** 挂载实例 provide 方法。 */
export function installInstanceProvideMethod(
  instance: any,
  provide: (key: InjectionKey, value: any) => void
): void {
  instance._provide = provide
}

/** 挂载实例 inject 方法。 */
export function installInstanceInjectMethod(
  instance: any,
  inject: (key: InjectionKey, defaultValue?: any) => any
): void {
  instance._inject = inject
}

/** 构造 setData 更新对象。 */
export function createInjectedUpdate(name: string, value: any): Record<string, any> {
  return { [name]: value }
}

/** 将注入值写入小程序实例。 */
export function applyInjectedValueToInstance(instance: any, name: string, value: any): void {
  if (instance.setData) {
    instance.setData(createInjectedUpdate(name, value))
    return
  }

  instance.data = instance.data || {}
  instance.data[name] = value
}

/** 按当前实例到根实例顺序构造 provider chain。 */
export function createProviderChain(
  instance: any,
  getParent: (instance: any) => any
): any[] {
  const chain: any[] = []
  let current = instance

  while (current) {
    chain.push(current)
    current = getParent(current)
  }

  return chain
}

/** 从父实例链中查找 provider，跳过当前实例。 */
export function findProviderInParentChain<T>(
  providerChain: any[],
  key: InjectionKey<T>,
  resolveProvider: (instance: any, key: InjectionKey<T>) => ProviderResolveResult<T> | undefined
): ProviderChainMatch<T> | undefined {
  for (let i = 1; i < providerChain.length; i++) {
    const parentInstance = providerChain[i]
    if (parentInstance === undefined) continue

    const provider = resolveProvider(parentInstance, key)
    if (provider?.found) {
      return {
        instance: parentInstance,
        value: provider.value
      }
    }
  }

  return undefined
}

/** 列出直接依赖当前 provider 实例的子实例。 */
export function listDependentChildInstances(
  providerHierarchy: Map<any, any>,
  parentInstance: any
): any[] {
  const childInstances: any[] = []

  for (const [childInstance, parent] of providerHierarchy) {
    if (parent === parentInstance) {
      childInstances.push(childInstance)
    }
  }

  return childInstances
}

/** 按 key 过滤 injector entries，保留 Map 插入顺序。 */
export function listInjectorEntriesByKey(
  injectors: Map<string, InjectorDef>,
  key: InjectionKey
): InjectorEntry[] {
  const entries: InjectorEntry[] = []

  for (const [name, injector] of injectors) {
    if (injector.key === key) {
      entries.push([name, injector])
    }
  }

  return entries
}
