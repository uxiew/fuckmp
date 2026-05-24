/**
 * Vue3 响应式系统的小程序适配层
 * 提供 ref、reactive、computed 等API的运行时支持
 */

import { logger } from '../utils/logger'
import {
  createComputedProxy,
  createReactiveProxy,
  createRefProxy,
  type RuntimeComputed,
  type RuntimeRef
} from './reactivity-proxy-helpers'
import {
  applyReactiveDataToInstance,
  areReactiveValuesEqual,
  cloneReactiveValue,
  createReactivityConfig,
  getReactiveInstanceValue
} from './reactivity-utils.js'

/**
 * 响应式数据类型
 */
export type ReactiveData = Record<string, any>

/**
 * 计算属性定义
 */
export interface ComputedDef {
  getter: () => any
  setter?: (value: any) => void
  cached?: boolean
  dirty?: boolean
  value?: any
}

/**
 * 监听器定义
 */
export interface WatcherDef {
  source: string | (() => any)
  callback: (newValue: any, oldValue: any) => void
  immediate?: boolean
  deep?: boolean
}

/**
 * 响应式系统配置
 */
export interface ReactivityConfig {
  debug?: boolean
  enableComputed?: boolean
  enableWatch?: boolean
}

/**
 * 响应式系统
 */
export class Reactivity {
  private config: ReactivityConfig
  private instances: Map<any, ReactiveInstance> = new Map()
  private initialized = false

  constructor(config: ReactivityConfig = {}) {
    this.config = createReactivityConfig(config)
  }

  /**
   * 初始化响应式系统
   */
  async initialize(): Promise<void> {
    if (this.initialized) {
      return
    }

    logger.debug('初始化响应式系统')
    this.initialized = true
  }

  /**
   * 为实例设置响应式系统
   */
  setupInstance(instance: any, config: {
    data?: ReactiveData
    computed?: Record<string, ComputedDef>
    watch?: Record<string, WatcherDef>
  }): void {
    const reactiveInstance = new ReactiveInstance(instance, config, this.config)
    this.instances.set(instance, reactiveInstance)
    reactiveInstance.setup()
  }

  /**
   * 获取实例的响应式系统
   */
  getInstance(instance: any): ReactiveInstance | undefined {
    return this.instances.get(instance)
  }

  /**
   * 清理实例
   */
  cleanupInstance(instance: any): void {
    const reactiveInstance = this.instances.get(instance)
    if (reactiveInstance) {
      reactiveInstance.cleanup()
      this.instances.delete(instance)
    }
  }

  /**
   * 创建 ref (基于 Proxy 的实现)
   */
  ref<T>(value: T, context?: any): RuntimeRef<T> {
    return createRefProxy(value, context)
  }

  /**
   * 创建 reactive 对象 (优化的 Proxy 实现)
   */
  reactive<T extends object>(target: T, context?: any): T {
    return createReactiveProxy(target, context)
  }

  /**
   * 创建 computed (基于 Proxy 的实现)
   */
  computed<T>(getter: () => T, context?: any): RuntimeComputed<T> {
    return createComputedProxy(getter, context)
  }

  /**
   * 销毁响应式系统
   */
  destroy(): void {
    for (const reactiveInstance of this.instances.values()) {
      reactiveInstance.cleanup()
    }
    this.instances.clear()
    this.initialized = false
  }

  /**
   * 检查是否已初始化
   */
  isInitialized(): boolean {
    return this.initialized
  }
}

/**
 * 响应式实例
 */
class ReactiveInstance {
  private instance: any
  private config: any
  private reactivityConfig: ReactivityConfig
  private computedCache: Map<string, any> = new Map()
  private watchers: Map<string, WatcherDef> = new Map()
  private oldValues: Map<string, any> = new Map()

  constructor(instance: any, config: any, reactivityConfig: ReactivityConfig) {
    this.instance = instance
    this.config = config
    this.reactivityConfig = reactivityConfig
  }

  /**
   * 设置响应式系统
   */
  setup(): void {
    this.setupData()
    this.setupComputed()
    this.setupWatch()
  }

  /**
   * 设置响应式数据
   */
  private setupData(): void {
    if (!this.config.data) return

    // 初始化数据
    const data = { ...this.config.data }

    // 保存旧值用于监听
    for (const key in data) {
      this.oldValues.set(key, cloneReactiveValue(data[key]))
    }

    // 设置到实例
    applyReactiveDataToInstance(this.instance, data)
  }

  /**
   * 设置计算属性
   */
  private setupComputed(): void {
    if (!this.config.computed || !this.reactivityConfig.enableComputed) return

    const computedData: Record<string, any> = {}

    for (const [key, computedDef] of Object.entries(this.config.computed)) {
      try {
        const value = (computedDef as ComputedDef).getter()
        computedData[key] = value
        this.computedCache.set(key, value)
      } catch (error) {
        logger.error(`计算属性 ${key} 计算失败:`, error)
        computedData[key] = null
      }
    }

    // 更新到实例
    this.updateData(computedData)
  }

  /**
   * 设置监听器
   */
  private setupWatch(): void {
    if (!this.config.watch || !this.reactivityConfig.enableWatch) return

    for (const [key, watcherDef] of Object.entries(this.config.watch)) {
      this.watchers.set(key, watcherDef as WatcherDef)

      // 如果设置了 immediate，立即执行一次
      if ((watcherDef as WatcherDef).immediate) {
        try {
          (watcherDef as WatcherDef).callback(getReactiveInstanceValue(this.instance, key), undefined)
        } catch (error) {
          logger.error(`监听器 ${key} 立即执行失败:`, error)
        }
      }
    }
  }

  /**
   * 更新计算属性
   */
  updateComputed(): void {
    if (!this.config.computed || !this.reactivityConfig.enableComputed) return

    const computedData: Record<string, any> = {}
    let hasChanges = false

    for (const [key, computedDef] of Object.entries(this.config.computed)) {
      try {
        const newValue = (computedDef as ComputedDef).getter()
        const oldValue = this.computedCache.get(key)

        if (!areReactiveValuesEqual(newValue, oldValue)) {
          computedData[key] = newValue
          this.computedCache.set(key, newValue)
          hasChanges = true
        }
      } catch (error) {
        logger.error(`计算属性 ${key} 更新失败:`, error)
      }
    }

    if (hasChanges) {
      this.updateData(computedData)
    }
  }

  /**
   * 触发监听器
   */
  triggerWatchers(changedData: Record<string, any>): void {
    if (!this.reactivityConfig.enableWatch) return

    for (const [key, newValue] of Object.entries(changedData)) {
      const watcher = this.watchers.get(key)
      if (watcher) {
        try {
          const oldValue = this.oldValues.get(key)
          watcher.callback(newValue, oldValue)
          this.oldValues.set(key, cloneReactiveValue(newValue))
        } catch (error) {
          logger.error(`监听器 ${key} 执行失败:`, error)
        }
      }
    }
  }

  /**
   * 更新数据
   */
  private updateData(data: Record<string, any>): void {
    applyReactiveDataToInstance(this.instance, data)

    // 触发监听器
    this.triggerWatchers(data)
  }

  /**
   * 清理
   */
  cleanup(): void {
    this.computedCache.clear()
    this.watchers.clear()
    this.oldValues.clear()
  }
}
