/**
 * 响应式系统运行时 - 基于 @vue/reactivity
 */

import {
  ref as vueRef,
  reactive as vueReactive,
  computed as vueComputed,
  watch as vueWatch,
  effect as vueWatchEffect,
  effect,
  stop,
  isRef,
  isReactive,
  toRaw,
  unref,
  type Ref,
  type ComputedRef
} from '@vue/reactivity'
import { logger } from '@/utils/index.js'

/**
 * 响应式数据类型
 */
export type ReactiveData = Record<string, any>

/**
 * 小程序适配的响应式系统
 */
export class ReactiveWrapper {
  private context: any
  private effects: Set<() => void> = new Set()
  private watchers: Map<string, () => void> = new Map()
  private refMap: Map<any, string> = new Map()
  private computedMap: Map<any, string> = new Map()

  constructor(context: any) {
    this.context = context
  }

  /**
   * 创建响应式引用
   */
  ref<T>(value: T, key?: string): any {
    const refValue = vueRef(value)

    // 如果提供了键名，注册映射关系
    if (key) {
      this.refMap.set(refValue, key)

      // 监听变化并同步到小程序
      const stopEffect = vueWatchEffect(() => {
        if (this.context && this.context.setData) {
          this.context.setData({
            [key]: refValue.value
          })
        }
      })

      this.effects.add(stopEffect)
    }

    return refValue
  }

  /**
   * 创建响应式对象
   */
  reactive<T extends object>(obj: T, key?: string): any {
    const reactiveValue = vueReactive(obj)

    // 如果提供了键名，注册映射关系
    if (key) {
      // 监听变化并同步到小程序
      const stopEffect = vueWatchEffect(() => {
        if (this.context && this.context.setData) {
          // 将 reactive 对象的所有属性同步到小程序
          const rawValue = toRaw(reactiveValue)
          const updateData: Record<string, any> = {}

          Object.keys(rawValue).forEach(prop => {
            updateData[`${key}.${prop}`] = (reactiveValue as any)[prop]
          })

          this.context.setData(updateData)
        }
      })

      this.effects.add(stopEffect)
    }

    return reactiveValue
  }

  /**
   * 创建计算属性
   */
  computed<T>(getter: () => T, key?: string): any {
    const computedValue = vueComputed(getter)

    // 如果提供了键名，注册映射关系
    if (key) {
      this.computedMap.set(computedValue, key)

      // 监听变化并同步到小程序
      const stopEffect = vueWatchEffect(() => {
        if (this.context && this.context.setData) {
          this.context.setData({
            [key]: computedValue.value
          })
        }
      })

      this.effects.add(stopEffect)
    }

    return computedValue
  }

  /**
   * 创建监听器
   */
  watch<T>(
    source: () => T,
    callback: (newValue: T, oldValue: T) => void,
    options?: { immediate?: boolean; deep?: boolean }
  ): () => void {
    return vueWatch(source, callback, options)
  }

  /**
   * 创建副作用
   */
  watchEffect(fn: () => void | (() => void)): () => void {
    const stopEffect = vueWatchEffect(fn)
    this.effects.add(stopEffect)

    return () => {
      stopEffect()
      this.effects.delete(stopEffect)
    }
  }

  /**
   * 生成唯一键
   */
  private generateKey(): string {
    return `_reactive_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`
  }

  /**
   * 清理所有响应式效果
   */
  cleanup(): void {
    // 停止所有副作用
    this.effects.forEach(stopEffect => {
      try {
        stopEffect()
      } catch (error) {
        console.error('停止副作用失败', error)
      }
    })
    this.effects.clear()

    // 停止所有监听器
    this.watchers.forEach(stopWatcher => {
      try {
        stopWatcher()
      } catch (error) {
        console.error('停止监听器失败', error)
      }
    })
    this.watchers.clear()

    // 清理映射关系
    this.refMap.clear()
    this.computedMap.clear()
  }
}

/**
 * 创建响应式系统实例
 */
export function createReactivity(context: any): ReactiveWrapper {
  return new ReactiveWrapper(context)
}

/**
 * ref 函数 - 直接使用 @vue/reactivity
 */
export function ref<T>(value: T): any {
  return vueRef(value)
}

/**
 * reactive 函数 - 直接使用 @vue/reactivity
 */
export function reactive<T extends object>(obj: T): any {
  return vueReactive(obj)
}

/**
 * computed 函数 - 直接使用 @vue/reactivity
 */
export function computed<T>(getter: () => T): any {
  return vueComputed(getter)
}

/**
 * watch 函数 - 直接使用 @vue/reactivity
 */
export function watch<T>(
  source: () => T,
  callback: (newValue: T, oldValue: T) => void,
  options?: { immediate?: boolean; deep?: boolean }
): () => void {
  return vueWatch(source, callback, options)
}

/**
 * watchEffect 函数 - 直接使用 @vue/reactivity
 */
export function watchEffect(effect: () => void | (() => void)): () => void {
  return vueWatchEffect(effect)
}

/**
 * 获取当前实例
 */
function getCurrentInstance(): any {
  // 在小程序环境中，通过 getCurrentPages 或其他方式获取当前实例
  if (typeof (globalThis as any).getCurrentPages !== 'undefined') {
    const pages = (globalThis as any).getCurrentPages()
    return pages[pages.length - 1]
  }

  // 组件环境中的处理
  return (globalThis as any)._currentComponent || {}
}

/**
 * 响应式数据转换工具 - 基于 @vue/reactivity
 */
export class ReactiveTransformer {
  /**
   * 将 Vue3 响应式数据转换为小程序数据
   */
  static transformData(vueData: Record<string, any>): Record<string, any> {
    const miniprogramData: Record<string, any> = {}

    Object.entries(vueData).forEach(([key, value]) => {
      if (isRef(value)) {
        miniprogramData[key] = unref(value)
      } else if (isReactive(value)) {
        miniprogramData[key] = toRaw(value)
      } else {
        miniprogramData[key] = value
      }
    })

    return miniprogramData
  }

  /**
   * 深度克隆
   */
  static deepClone(obj: any): any {
    if (obj === null || typeof obj !== 'object') {
      return obj
    }

    if (obj instanceof Date) {
      return new Date(obj.getTime())
    }

    if (obj instanceof Array) {
      return obj.map(item => this.deepClone(item))
    }

    if (typeof obj === 'object') {
      const cloned: any = {}
      Object.keys(obj).forEach(key => {
        cloned[key] = this.deepClone(obj[key])
      })
      return cloned
    }

    return obj
  }
}

/**
 * 响应式系统初始化
 */
export function setupReactivity(context: any): void {
  // 为当前实例设置响应式系统
  context._reactivity = createReactivity(context)

    // 设置全局当前组件引用
    ; (globalThis as any)._currentComponent = context

  // 重写 setData 方法以支持响应式更新
  const originalSetData = context.setData
  context.setData = function (data: Record<string, any>, callback?: () => void) {
    // 转换响应式数据
    const transformedData = ReactiveTransformer.transformData(data)

    // 调用原始 setData
    originalSetData.call(this, transformedData, callback)
  }
}

/**
 * 清理响应式系统
 */
export function cleanupReactivity(context: any): void {
  if (context._reactivity) {
    // 清理响应式系统
    context._reactivity.cleanup()
    delete context._reactivity
  }

  // 清理全局引用
  if ((globalThis as any)._currentComponent === context) {
    ; (globalThis as any)._currentComponent = null
  }
}
