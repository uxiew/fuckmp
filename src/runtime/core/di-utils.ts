/**
 * 依赖注入系统纯函数工具。
 */

import type { DIConfig, InjectionKey } from './di.js'

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

/** 判断是否需要响应式更新依赖子实例。 */
export function shouldUpdateReactiveProvider(config: DIConfig): boolean {
  return Boolean(config.enableReactiveProviders)
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
