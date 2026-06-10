/**
 * Internal helpers for Proxy-based reactivity runtime adapters.
 */

import { logger } from '../utils/logger'

/**
 * Internal state required to resolve a computed proxy value.
 */
export interface ComputedProxyTarget<T> {
  _key: string
  _getter: () => T
  _context: any
  _dirty: boolean
  _computing: boolean
}

/**
 * Resolve a computed value with dirty and circular-computation protection.
 */
export function resolveComputedProxyValue<T>(
  target: ComputedProxyTarget<T>,
  setValue: (value: T) => void,
  getValue: () => T
): T | undefined {
  if (target._computing) {
    logger.warn(`检测到计算属性 ${target._key} 的循环依赖`)
    return undefined
  }

  if (target._dirty) {
    target._computing = true
    try {
      const value = target._getter()
      setValue(value)
      target._dirty = false

      if (target._context && typeof target._context.setData === 'function') {
        target._context.setData({ [target._key]: value })
      }
    } catch (error) {
      logger.error(`计算属性 ${target._key} 计算失败:`, error)
      setValue(undefined as T)
    } finally {
      target._computing = false
    }
  }

  return getValue()
}

/**
 * Sync one reactive mutation to the mini-program context when available.
 */
export function syncReactiveProxyContextData(
  context: any,
  rootKey: string,
  path: string[],
  prop: string,
  value: any
): void {
  if (!context || typeof context.setData !== 'function') {
    return
  }

  const fullPath = path.length > 0
    ? `${rootKey}.${[...path, prop].join('.')}`
    : `${rootKey}.${prop}`

  context.setData({ [fullPath]: value })
}
