/**
 * Proxy-based ref/computed helpers for the mini-program reactivity runtime.
 */
import { logger } from '../utils/logger'

/**
 * Runtime ref proxy surface.
 */
export type RuntimeRef<T> = { value: T; _isRef: true; _key: string }

/**
 * Runtime computed proxy surface.
 */
export type RuntimeComputed<T> = { value: T; _isComputed: true; _key: string }

/**
 * Create a Proxy-backed ref and sync value changes to a mini-program context.
 */
export function createRefProxy<T>(value: T, context?: any): RuntimeRef<T> {
  const key = `ref_${Math.random().toString(36).substr(2, 9)}`
  const target = {
    _isRef: true as const,
    _key: key,
    _value: value,
    _context: context
  }

  const refProxy = new Proxy(target, {
    get(target, prop: string | symbol): any {
      if (prop === 'value') {
        return target._value
      }
      if (prop === '_isRef' || prop === '_key') {
        return target[prop as keyof typeof target]
      }
      return target[prop as keyof typeof target]
    },

    set(target, prop: string | symbol, newValue: any): boolean {
      if (prop === 'value') {
        const oldValue = target._value
        if (newValue !== oldValue) {
          target._value = newValue

          if (target._context && typeof target._context.setData === 'function') {
            target._context.setData({ [target._key]: newValue })
          }
        }
        return true
      }

      if (prop === '_isRef' || prop === '_key') {
        logger.warn(`尝试修改 ref 的只读属性: ${String(prop)}`)
        return false
      }

      ;(target as any)[prop] = newValue
      return true
    },

    has(target, prop: string | symbol): boolean {
      return prop === 'value' || prop === '_isRef' || prop === '_key' || prop in target
    },

    ownKeys(): (string | symbol)[] {
      return ['value', '_isRef', '_key']
    },

    getOwnPropertyDescriptor(_target, prop: string | symbol) {
      if (prop === 'value' || prop === '_isRef' || prop === '_key') {
        return {
          enumerable: true,
          configurable: true,
          ...(prop === 'value' ? { writable: true } : { writable: false })
        }
      }
      return undefined
    }
  })

  if (context && typeof context.setData === 'function') {
    context.setData({ [key]: value })
  }

  return refProxy as unknown as RuntimeRef<T>
}

/**
 * Create a Proxy-backed computed ref and sync computed values to context.
 */
export function createComputedProxy<T>(getter: () => T, context?: any): RuntimeComputed<T> {
  const key = `computed_${Math.random().toString(36).substr(2, 9)}`
  let value: T
  const target = {
    _isComputed: true as const,
    _key: key,
    _getter: getter,
    _context: context,
    _dirty: true,
    _computing: false
  }

  const computedProxy = new Proxy(target, {
    get(target, prop: string | symbol): any {
      if (prop === 'value') {
        return resolveComputedValue(target, currentValue => {
          value = currentValue
        }, () => value)
      }

      if (prop === '_isComputed' || prop === '_key') {
        return target[prop as keyof typeof target]
      }

      return target[prop as keyof typeof target]
    },

    set(target, prop: string | symbol, newValue: any): boolean {
      if (prop === 'value') {
        logger.warn(`计算属性 ${target._key} 的 value 是只读的`)
        return false
      }

      if (prop === '_isComputed' || prop === '_key') {
        logger.warn(`尝试修改 computed 的只读属性: ${String(prop)}`)
        return false
      }

      if (prop === '_dirty') {
        target._dirty = newValue
        return true
      }

      ;(target as any)[prop] = newValue
      return true
    },

    has(target, prop: string | symbol): boolean {
      return prop === 'value' || prop === '_isComputed' || prop === '_key' || prop in target
    },

    ownKeys(): (string | symbol)[] {
      return ['value', '_isComputed', '_key']
    },

    getOwnPropertyDescriptor(_target, prop: string | symbol) {
      if (prop === 'value') {
        return {
          enumerable: true,
          configurable: true,
          writable: false
        }
      }
      if (prop === '_isComputed' || prop === '_key') {
        return {
          enumerable: true,
          configurable: true,
          writable: false
        }
      }
      return undefined
    }
  })

  try {
    void (computedProxy as any).value
  } catch (error) {
    logger.error(`计算属性 ${key} 初始计算失败:`, error)
  }

  return computedProxy as unknown as RuntimeComputed<T>
}

/**
 * Resolve a computed value with dirty and circular-computation protection.
 */
function resolveComputedValue<T>(
  target: {
    _key: string
    _getter: () => T
    _context: any
    _dirty: boolean
    _computing: boolean
  },
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
