/**
 * 依赖注入系统
 * 提供 provide/inject 的运行时支持
 */

import { logger } from '../utils/logger'
import * as diUtils from './di-utils.js'
import { DIInstance } from './di-instance.js'

/**
 * 注入键类型
 */
export type InjectionKey<T = any> = string | symbol

/**
 * 提供者定义
 */
export interface ProviderDef {
  key: InjectionKey
  value: any
  reactive?: boolean
}

/**
 * 注入者定义
 */
export interface InjectorDef {
  key: InjectionKey
  defaultValue?: any
  required?: boolean
}

/**
 * 依赖注入配置
 */
export interface DIConfig {
  debug?: boolean
  enableGlobalProviders?: boolean
  enableReactiveProviders?: boolean
}

/**
 * 依赖注入系统
 */
export class DependencyInjection {
  private config: DIConfig
  private globalProviders: Map<InjectionKey, any> = new Map()
  private instances: Map<any, DIInstance> = new Map()
  private providerHierarchy: Map<any, any> = new Map() // 实例 -> 父实例
  private initialized = false

  constructor(config: DIConfig = {}) {
    this.config = diUtils.createDIConfig(config)
  }

  /**
   * 初始化依赖注入系统
   */
  async initialize(): Promise<void> {
    if (this.initialized) {
      return
    }

    logger.debug('初始化依赖注入系统')
    this.initialized = true
  }

  /**
   * 为实例设置依赖注入
   */
  setupInstance(instance: any, config: {
    providers?: Record<string, ProviderDef>
    injectors?: Record<string, InjectorDef>
    parent?: any
  }): void {
    const diInstance = new DIInstance(instance, config, this.config, this)
    this.instances.set(instance, diInstance)

    // 设置父子关系
    if (config.parent) {
      this.providerHierarchy.set(instance, config.parent)
    }

    diInstance.setup()
  }

  /**
   * 全局提供
   */
  provide(key: InjectionKey, value: any): void {
    if (!this.config.enableGlobalProviders) {
      logger.warn('全局提供者已禁用')
      return
    }

    this.globalProviders.set(key, value)

    if (this.config.debug) {
      logger.debug(`全局提供: ${diUtils.getInjectionLogKey(key)}`, value)
    }
  }

  /**
   * 全局注入
   */
  inject<T>(key: InjectionKey<T>, defaultValue?: T): T | undefined {
    const value = this.globalProviders.get(key)

    if (value !== undefined) {
      return value
    }

    if (defaultValue !== undefined) {
      return defaultValue
    }

    logger.warn(`全局注入失败，未找到提供者: ${diUtils.getInjectionLogKey(key)}`)
    return undefined
  }

  /**
   * 从实例注入
   */
  injectFromInstance<T>(instance: any, key: InjectionKey<T>, defaultValue?: T): T | undefined {
    const diInstance = this.instances.get(instance)
    if (diInstance) {
      return diInstance.inject(key, defaultValue)
    }

    // 尝试全局注入
    return this.inject(key, defaultValue)
  }

  /**
   * 获取提供者链
   */
  getProviderChain(instance: any): any[] {
    return diUtils.createProviderChain(instance, current => this.providerHierarchy.get(current))
  }

  /**
   * 清理实例
   */
  cleanupInstance(instance: any): void {
    const diInstance = this.instances.get(instance)
    if (diInstance) {
      diInstance.cleanup()
      this.instances.delete(instance)
    }
    this.providerHierarchy.delete(instance)
  }

  /**
   * 销毁依赖注入系统
   */
  destroy(): void {
    for (const diInstance of this.instances.values()) {
      diInstance.cleanup()
    }
    this.instances.clear()
    this.providerHierarchy.clear()
    this.globalProviders.clear()
    this.initialized = false
  }

  /**
   * 检查是否已初始化
   */
  isInitialized(): boolean {
    return this.initialized
  }

  /**
   * 获取实例映射（供DIInstance使用）
   */
  getInstances(): Map<any, DIInstance> {
    return this.instances
  }

  /**
   * 获取提供者层级（供DIInstance使用）
   */
  getProviderHierarchy(): Map<any, any> {
    return this.providerHierarchy
  }
}
