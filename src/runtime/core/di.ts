/**
 * 依赖注入系统
 * 提供 provide/inject 的运行时支持
 */

import { logger } from '../utils/logger'

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
    this.config = {
      debug: false,
      enableGlobalProviders: true,
      enableReactiveProviders: true,
      ...config
    }
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
      logger.debug(`全局提供: ${String(key)}`, value)
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

    logger.warn(`全局注入失败，未找到提供者: ${String(key)}`)
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
    const chain: any[] = []
    let current = instance

    while (current) {
      chain.push(current)
      current = this.providerHierarchy.get(current)
    }

    return chain
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
    for (const [instance, diInstance] of this.instances) {
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

/**
 * 依赖注入实例
 */
class DIInstance {
  private instance: any
  private config: any
  private diConfig: DIConfig
  private di: DependencyInjection
  private providers: Map<InjectionKey, any> = new Map()
  private injectors: Map<string, InjectorDef> = new Map()
  private injectedValues: Map<string, any> = new Map()

  constructor(instance: any, config: any, diConfig: DIConfig, di: DependencyInjection) {
    this.instance = instance
    this.config = config
    this.diConfig = diConfig
    this.di = di
  }

  /**
   * 设置依赖注入实例
   */
  setup(): void {
    this.setupProviders()
    this.setupInjectors()
  }

  /**
   * 设置提供者
   */
  private setupProviders(): void {
    if (!this.config.providers) return

    for (const [name, provider] of Object.entries(this.config.providers)) {
      const providerDef = provider as ProviderDef
      this.providers.set(providerDef.key, providerDef.value)

      if (this.diConfig.debug) {
        logger.debug(`设置提供者: ${String(providerDef.key)}`, providerDef.value)
      }
    }

    // 添加provide方法到实例
    this.instance._provide = (key: InjectionKey, value: any) => {
      this.provide(key, value)
    }
  }

  /**
   * 设置注入者
   */
  private setupInjectors(): void {
    if (!this.config.injectors) return

    for (const [name, injector] of Object.entries(this.config.injectors)) {
      const injectorDef = injector as InjectorDef
      this.injectors.set(name, injectorDef)

      // 立即注入值
      const value = this.inject(injectorDef.key, injectorDef.defaultValue)

      if (value !== undefined) {
        this.injectedValues.set(name, value)

        // 设置到实例数据中
        if (this.instance.setData) {
          this.instance.setData({ [name]: value })
        } else {
          this.instance.data = this.instance.data || {}
          this.instance.data[name] = value
        }
      } else if (injectorDef.required) {
        logger.error(`必需的注入值未找到: ${String(injectorDef.key)}`)
      }
    }

    // 添加inject方法到实例
    this.instance._inject = (key: InjectionKey, defaultValue?: any) => {
      return this.inject(key, defaultValue)
    }
  }

  /**
   * 提供值
   */
  provide(key: InjectionKey, value: any): void {
    this.providers.set(key, value)

    if (this.diConfig.debug) {
      logger.debug(`实例提供: ${String(key)}`, value)
    }

    // 如果启用了响应式提供者，更新所有依赖的子实例
    if (this.diConfig.enableReactiveProviders) {
      this.updateDependentInstances(key, value)
    }
  }

  /**
   * 注入值
   */
  inject<T>(key: InjectionKey<T>, defaultValue?: T): T | undefined {
    // 首先检查本实例的提供者
    if (this.providers.has(key)) {
      const value = this.providers.get(key)

      if (this.diConfig.debug) {
        logger.debug(`从本实例注入: ${String(key)}`, value)
      }

      return value
    }

    // 然后检查父实例链
    const providerChain = this.di.getProviderChain(this.instance)

    for (let i = 1; i < providerChain.length; i++) {
      const parentInstance = providerChain[i]
      const parentDI = this.di.getInstances().get(parentInstance)

      if (parentDI && parentDI.providers.has(key)) {
        const value = parentDI.providers.get(key)

        if (this.diConfig.debug) {
          logger.debug(`从父实例注入: ${String(key)}`, value)
        }

        return value
      }
    }

    // 最后检查全局提供者
    const globalValue = this.di.inject(key, defaultValue)
    if (globalValue !== undefined) {
      return globalValue
    }

    if (this.diConfig.debug) {
      logger.debug(`注入失败，使用默认值: ${String(key)}`, defaultValue)
    }

    return defaultValue
  }

  /**
   * 更新依赖的子实例
   */
  private updateDependentInstances(key: InjectionKey, value: any): void {
    // 查找所有以当前实例为父的子实例
    for (const [childInstance, parentInstance] of this.di.getProviderHierarchy()) {
      if (parentInstance === this.instance) {
        const childDI = this.di.getInstances().get(childInstance)
        if (childDI) {
          childDI.updateInjectedValue(key, value)
        }
      }
    }
  }

  /**
   * 更新注入的值
   */
  private updateInjectedValue(key: InjectionKey, value: any): void {
    // 查找使用此key的注入者
    for (const [name, injector] of this.injectors) {
      if (injector.key === key) {
        this.injectedValues.set(name, value)

        // 更新实例数据
        if (this.instance.setData) {
          this.instance.setData({ [name]: value })
        } else {
          this.instance.data = this.instance.data || {}
          this.instance.data[name] = value
        }

        if (this.diConfig.debug) {
          logger.debug(`更新注入值: ${name}`, value)
        }
      }
    }
  }

  /**
   * 获取所有注入的值
   */
  getInjectedValues(): Record<string, any> {
    const result: Record<string, any> = {}
    for (const [name, value] of this.injectedValues) {
      result[name] = value
    }
    return result
  }

  /**
   * 获取所有提供的值
   */
  getProvidedValues(): Record<InjectionKey, any> {
    const result: Record<InjectionKey, any> = {}
    for (const [key, value] of this.providers) {
      result[key] = value
    }
    return result
  }

  /**
   * 清理
   */
  cleanup(): void {
    this.providers.clear()
    this.injectors.clear()
    this.injectedValues.clear()
  }
}
