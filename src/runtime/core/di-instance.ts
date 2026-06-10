/**
 * 依赖注入实例运行时。
 *
 * 仅承载单个小程序实例的 provider / injector 行为，容器级编排仍保留在 di.ts。
 */

import { logger } from '../utils/logger'
import * as diUtils from './di-utils.js'
import type { DIConfig, InjectionKey, InjectorDef, ProviderDef } from './di.js'

/** 依赖注入实例访问容器所需的最小上下文。 */
export interface DIContainerContext {
  /** 获取从当前实例到根实例的 provider 链。 */
  getProviderChain(instance: any): any[]
  /** 获取容器内所有 DIInstance。 */
  getInstances(): Map<any, DIInstance>
  /** 获取实例父子层级。 */
  getProviderHierarchy(): Map<any, any>
  /** 从全局 provider 注入值。 */
  inject<T>(key: InjectionKey<T>, defaultValue?: T): T | undefined
}

/** 单个小程序实例的依赖注入状态与行为。 */
export class DIInstance {
  private instance: any
  private config: {
    providers?: Record<string, ProviderDef>
    injectors?: Record<string, InjectorDef>
  }
  private diConfig: DIConfig
  private di: DIContainerContext
  private providers: Map<InjectionKey, any> = new Map()
  private injectors: Map<string, InjectorDef> = new Map()
  private injectedValues: Map<string, any> = new Map()

  constructor(
    instance: any,
    config: {
      providers?: Record<string, ProviderDef>
      injectors?: Record<string, InjectorDef>
    },
    diConfig: DIConfig,
    di: DIContainerContext
  ) {
    this.instance = instance
    this.config = config
    this.diConfig = diConfig
    this.di = di
  }

  /** 设置依赖注入实例。 */
  setup(): void {
    this.setupProviders()
    this.setupInjectors()
  }

  private setupProviders(): void {
    if (!this.config.providers) return

    for (const providerDef of diUtils.listProviderDefinitions(this.config.providers)) {
      this.providers.set(providerDef.key, providerDef.value)

      if (this.diConfig.debug) {
        logger.debug(`设置提供者: ${diUtils.getInjectionLogKey(providerDef.key)}`, providerDef.value)
      }
    }

    diUtils.installInstanceProvideMethod(this.instance, (key: InjectionKey, value: any) => {
      this.provide(key, value)
    })
  }

  private setupInjectors(): void {
    if (!this.config.injectors) return

    for (const [name, injectorDef] of diUtils.listInjectorEntries(this.config.injectors)) {
      this.injectors.set(name, injectorDef)

      const value = this.inject(injectorDef.key, injectorDef.defaultValue)

      if (value !== undefined) {
        this.injectedValues.set(name, value)
        diUtils.applyInjectedValueToInstance(this.instance, name, value)
      } else if (injectorDef.required) {
        logger.error(`必需的注入值未找到: ${diUtils.getInjectionLogKey(injectorDef.key)}`)
      }
    }

    diUtils.installInstanceInjectMethod(this.instance, (key: InjectionKey, defaultValue?: any) => {
      return this.inject(key, defaultValue)
    })
  }

  /** 提供值。 */
  provide(key: InjectionKey, value: any): void {
    this.providers.set(key, value)

    if (this.diConfig.debug) {
      logger.debug(`实例提供: ${diUtils.getInjectionLogKey(key)}`, value)
    }

    if (diUtils.shouldUpdateReactiveProvider(this.diConfig)) {
      this.updateDependentInstances(key, value)
    }
  }

  /** 注入值。 */
  inject<T>(key: InjectionKey<T>, defaultValue?: T): T | undefined {
    const ownProvider = diUtils.resolveProviderValue<T>(this.providers, key)
    if (ownProvider.found) {
      if (this.diConfig.debug) {
        logger.debug(`从本实例注入: ${diUtils.getInjectionLogKey(key)}`, ownProvider.value)
      }

      return ownProvider.value
    }

    const providerChain = this.di.getProviderChain(this.instance)
    const parentProvider = diUtils.findProviderInParentChain<T>(
      providerChain,
      key,
      (parentInstance, providerKey) => {
        const parentDI = this.di.getInstances().get(parentInstance)

        return parentDI
          ? diUtils.resolveProviderValue<T>(parentDI.providers, providerKey)
          : { found: false, value: undefined }
      }
    )

    if (parentProvider) {
      if (this.diConfig.debug) {
        logger.debug(`从父实例注入: ${diUtils.getInjectionLogKey(key)}`, parentProvider.value)
      }

      return parentProvider.value
    }

    const globalValue = this.di.inject(key, defaultValue)
    if (globalValue !== undefined) {
      return globalValue
    }

    if (this.diConfig.debug) {
      logger.debug(`注入失败，使用默认值: ${diUtils.getInjectionLogKey(key)}`, defaultValue)
    }

    return defaultValue
  }

  private updateDependentInstances(key: InjectionKey, value: any): void {
    for (const childInstance of diUtils.listDependentChildInstances(this.di.getProviderHierarchy(), this.instance)) {
      const childDI = this.di.getInstances().get(childInstance)
      if (childDI) {
        childDI.updateInjectedValue(key, value)
      }
    }
  }

  private updateInjectedValue(key: InjectionKey, value: any): void {
    for (const [name] of diUtils.listInjectorEntriesByKey(this.injectors, key)) {
      this.injectedValues.set(name, value)
      diUtils.applyInjectedValueToInstance(this.instance, name, value)

      if (this.diConfig.debug) {
        logger.debug(`更新注入值: ${name}`, value)
      }
    }
  }

  /** 清理实例状态。 */
  cleanup(): void {
    this.providers.clear()
    this.injectors.clear()
    this.injectedValues.clear()
  }
}
