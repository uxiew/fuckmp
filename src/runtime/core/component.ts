/**
 * 组件管理器
 * 统一管理页面和组件的创建、生命周期和销毁
 */

import { Reactivity } from './reactivity'
import { Lifecycle } from './lifecycle'
import { TemplateEngine } from './template'
import { DependencyInjection } from './di'
import { EventSystem } from './event'
import { logger } from '../utils/logger'

/**
 * 组件配置
 */
export interface ComponentConfig {
  // 数据
  data?: Record<string, any>
  computed?: Record<string, any>
  watch?: Record<string, any>

  // 方法
  methods?: Record<string, Function>

  // 生命周期
  lifecycle?: Record<string, Function>

  // 属性
  props?: Record<string, any>

  // 依赖注入
  providers?: Record<string, any>
  injectors?: Record<string, any>

  // 事件
  events?: Record<string, any>
  bindings?: Record<string, any>

  // 模板
  slots?: Record<string, any>
  conditionals?: Record<string, any>
  lists?: Record<string, any>

  // 其他配置
  mixins?: any[]
  extends?: any
  parent?: any
}

/**
 * 组件管理器配置
 */
export interface ComponentManagerConfig {
  debug?: boolean
  enableMixins?: boolean
  enableInheritance?: boolean
}

/**
 * 组件管理器
 */
export class ComponentManager {
  private config: ComponentManagerConfig
  private reactivity: Reactivity
  private lifecycle: Lifecycle
  private template: TemplateEngine
  private di: DependencyInjection
  private event: EventSystem
  private instances: Map<any, ComponentInstance> = new Map()
  private initialized = false

  constructor(config: ComponentManagerConfig = {}) {
    this.config = {
      debug: false,
      enableMixins: true,
      enableInheritance: true,
      ...config
    }

    // 注意：这些依赖应该从外部注入，这里为了简化直接创建
    this.reactivity = new Reactivity()
    this.lifecycle = new Lifecycle()
    this.template = new TemplateEngine()
    this.di = new DependencyInjection()
    this.event = new EventSystem()
  }

  /**
   * 设置依赖
   */
  setDependencies(deps: {
    reactivity: Reactivity
    lifecycle: Lifecycle
    template: TemplateEngine
    di: DependencyInjection
    event: EventSystem
  }): void {
    this.reactivity = deps.reactivity
    this.lifecycle = deps.lifecycle
    this.template = deps.template
    this.di = deps.di
    this.event = deps.event
  }

  /**
   * 初始化组件管理器
   */
  async initialize(): Promise<void> {
    if (this.initialized) {
      return
    }

    logger.debug('初始化组件管理器')
    this.initialized = true
  }

  /**
   * 创建页面
   */
  createPage(config: ComponentConfig): any {
    const processedConfig = this.processConfig(config, true)
    const pageInstance = this.createInstance(processedConfig, true)

    // 返回小程序页面配置
    return this.generateMiniProgramConfig(pageInstance, true)
  }

  /**
   * 创建组件
   */
  createComponent(config: ComponentConfig): any {
    const processedConfig = this.processConfig(config, false)
    const componentInstance = this.createInstance(processedConfig, false)

    // 返回小程序组件配置
    return this.generateMiniProgramConfig(componentInstance, false)
  }

  /**
   * 处理配置
   */
  private processConfig(config: ComponentConfig, isPage: boolean): ComponentConfig {
    let processedConfig = { ...config }

    // 处理mixins
    if (this.config.enableMixins && config.mixins) {
      processedConfig = this.applyMixins(processedConfig, config.mixins)
    }

    // 处理继承
    if (this.config.enableInheritance && config.extends) {
      processedConfig = this.applyInheritance(processedConfig, config.extends)
    }

    return processedConfig
  }

  /**
   * 应用mixins
   */
  private applyMixins(config: ComponentConfig, mixins: any[]): ComponentConfig {
    let result = { ...config }

    for (const mixin of mixins) {
      result = this.mergeConfigs(result, mixin)
    }

    return result
  }

  /**
   * 应用继承
   */
  private applyInheritance(config: ComponentConfig, parent: any): ComponentConfig {
    return this.mergeConfigs(parent, config)
  }

  /**
   * 合并配置
   */
  private mergeConfigs(base: ComponentConfig, override: ComponentConfig): ComponentConfig {
    const result: ComponentConfig = { ...base }

    // 合并对象类型的配置
    const objectKeys = ['data', 'computed', 'watch', 'methods', 'lifecycle', 'providers', 'injectors', 'events', 'bindings', 'slots', 'conditionals', 'lists']

    for (const key of objectKeys) {
      if (override[key as keyof ComponentConfig]) {
        result[key as keyof ComponentConfig] = {
          ...base[key as keyof ComponentConfig],
          ...override[key as keyof ComponentConfig]
        }
      }
    }

    // 合并数组类型的配置
    if (override.mixins) {
      result.mixins = [...(base.mixins || []), ...override.mixins]
    }

    // 直接覆盖的配置
    if (override.extends) {
      result.extends = override.extends
    }
    if (override.parent) {
      result.parent = override.parent
    }

    return result
  }

  /**
   * 创建实例
   */
  private createInstance(config: ComponentConfig, isPage: boolean): ComponentInstance {
    const instance = new ComponentInstance(config, isPage, this.config)

    // 设置各个系统
    this.reactivity.setupInstance(instance.getRawInstance(), {
      data: config.data || {},
      computed: config.computed || {},
      watch: config.watch || {}
    })

    this.lifecycle.setupInstance(instance.getRawInstance(), config.lifecycle || {}, isPage)

    this.template.setupInstance(instance.getRawInstance(), {
      slots: config.slots || {},
      conditionals: config.conditionals || {},
      lists: config.lists || {}
    })

    this.di.setupInstance(instance.getRawInstance(), {
      providers: config.providers || {},
      injectors: config.injectors || {},
      parent: config.parent
    })

    this.event.setupInstance(instance.getRawInstance(), {
      events: config.events || {},
      bindings: config.bindings || {}
    })

    this.instances.set(instance.getRawInstance(), instance)
    return instance
  }

  /**
   * 生成小程序配置
   */
  private generateMiniProgramConfig(instance: ComponentInstance, isPage: boolean): any {
    const config = instance.getConfig()
    const rawInstance = instance.getRawInstance()

    const miniProgramConfig: any = {
      data: config.data || {},

      // 添加运行时方法
      _updateComputed: () => {
        const reactivityInstance = this.reactivity.getInstance(rawInstance)
        if (reactivityInstance) {
          reactivityInstance.updateComputed()
        }
      },

      _triggerWatchers: (changedData: Record<string, any>) => {
        const reactivityInstance = this.reactivity.getInstance(rawInstance)
        if (reactivityInstance) {
          reactivityInstance.triggerWatchers(changedData)
        }
      }
    }

    // 添加方法
    if (config.methods) {
      Object.assign(miniProgramConfig, config.methods)
    }

    // 添加生命周期（已经在lifecycle中处理）

    // 如果是组件，添加组件特有配置
    if (!isPage) {
      miniProgramConfig.options = {
        multipleSlots: true,
        addGlobalClass: true
      }

      miniProgramConfig.properties = config.props || {}
      miniProgramConfig.observers = {}

      // 添加数据观察器
      if (config.watch) {
        for (const key of Object.keys(config.watch)) {
          miniProgramConfig.observers[key] = function (newVal: any) {
            this._triggerWatchers({ [key]: newVal })
          }
        }
      }
    }

    return miniProgramConfig
  }

  /**
   * 获取实例
   */
  getInstance(rawInstance: any): ComponentInstance | undefined {
    return this.instances.get(rawInstance)
  }

  /**
   * 清理实例
   */
  cleanupInstance(rawInstance: any): void {
    const instance = this.instances.get(rawInstance)
    if (instance) {
      // 清理各个系统
      this.reactivity.cleanupInstance(rawInstance)
      this.lifecycle.cleanupInstance(rawInstance)
      this.template.cleanupInstance(rawInstance)
      this.di.cleanupInstance(rawInstance)
      this.event.cleanupInstance(rawInstance)

      instance.cleanup()
      this.instances.delete(rawInstance)
    }
  }

  /**
   * 销毁组件管理器
   */
  destroy(): void {
    for (const [rawInstance, instance] of this.instances) {
      this.cleanupInstance(rawInstance)
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
 * 组件实例
 */
class ComponentInstance {
  private config: ComponentConfig
  private isPage: boolean
  private managerConfig: ComponentManagerConfig
  private rawInstance: any = {}

  constructor(config: ComponentConfig, isPage: boolean, managerConfig: ComponentManagerConfig) {
    this.config = config
    this.isPage = isPage
    this.managerConfig = managerConfig
  }

  /**
   * 获取配置
   */
  getConfig(): ComponentConfig {
    return this.config
  }

  /**
   * 获取原始实例
   */
  getRawInstance(): any {
    return this.rawInstance
  }

  /**
   * 是否为页面
   */
  getIsPage(): boolean {
    return this.isPage
  }

  /**
   * 清理
   */
  cleanup(): void {
    // 清理逻辑
  }
}
