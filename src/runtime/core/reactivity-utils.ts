/**
 * 响应式运行时纯函数工具。
 */

import type { ReactivityConfig } from './reactivity.js'

/** 合并响应式系统配置默认值。 */
export function createReactivityConfig(config: ReactivityConfig = {}): Required<ReactivityConfig> {
  return {
    debug: false,
    enableComputed: true,
    enableWatch: true,
    ...config
  }
}

/** 将响应式数据写入小程序实例。 */
export function applyReactiveDataToInstance(instance: any, data: Record<string, any>): void {
  if (Object.keys(data).length === 0) {
    return
  }

  if (instance.setData) {
    instance.setData(data)
    return
  }

  Object.assign(instance.data || {}, data)
}

/** 从实例 data 中读取响应式字段值。 */
export function getReactiveInstanceValue(instance: any, key: string): any {
  if (instance.data && key in instance.data) {
    return instance.data[key]
  }

  return undefined
}

/** 深拷贝响应式旧值，用于 watcher oldValue 快照。 */
export function cloneReactiveValue<T>(value: T): T {
  if (value === null || typeof value !== 'object') {
    return value
  }

  if (value instanceof Date) {
    return new Date(value.getTime()) as T
  }

  if (value instanceof Array) {
    return value.map(item => cloneReactiveValue(item)) as T
  }

  const cloned: any = {}
  for (const key in value) {
    if (Object.prototype.hasOwnProperty.call(value, key)) {
      cloned[key] = cloneReactiveValue((value as any)[key])
    }
  }

  return cloned
}

/** 按旧 runtime 规则比较两个响应式值是否相等。 */
export function areReactiveValuesEqual(a: any, b: any): boolean {
  if (a === b) return true
  if (a == null || b == null) return a === b
  if (typeof a !== typeof b) return false

  if (typeof a === 'object') {
    return JSON.stringify(a) === JSON.stringify(b)
  }

  return false
}
