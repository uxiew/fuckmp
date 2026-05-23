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
import { processComponentConfig } from './component-config-utils.js'

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
 * 组件管理器依赖
 */
export interface ComponentDependencies {
  reactivity: Reactivity
  lifecycle: Lifecycle
  template: TemplateEngine
  di: DependencyInjection
  event: EventSystem
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

  constructor(config: ComponentManagerConfig = {}, deps?: ComponentDependencies) {
    this.config = {
      debug: false,
      enableMixins: true,
      enableInheritance: true,
      ...config
    }

    this.reactivity = deps?.reactivity ?? new Reactivity(config)
    this.lifecycle = deps?.lifecycle ?? new Lifecycle(config)
    this.template = deps?.template ?? new TemplateEngine(config)
    this.di = deps?.di ?? new DependencyInjection(config)
    this.event = deps?.event ?? new EventSystem(config)
  }

  /**
   * 设置依赖
   */
  setDependencies(deps: ComponentDependencies): void {
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
    const processedConfig = this.processConfig(config)
    const pageInstance = this.createInstance(processedConfig, true)

    // 返回小程序页面配置
    return this.generateMiniProgramConfig(pageInstance, true)
  }

  /**
   * 创建组件
   */
  createComponent(config: ComponentConfig): any {
    const processedConfig = this.processConfig(config)
    const componentInstance = this.createInstance(processedConfig, false)

    // 返回小程序组件配置
    return this.generateMiniProgramConfig(componentInstance, false)
  }

  /**
   * 处理配置
   */
  private processConfig(config: ComponentConfig): ComponentConfig {
    return processComponentConfig(config, this.config)
  }

  /**
   * 创建实例
   */
  private createInstance(config: ComponentConfig, isPage: boolean): ComponentInstance {
    const instance = new ComponentInstance(config)

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
      },

      // 添加响应式 API
      ref: <T>(value: T) => this.reactivity.ref(value, rawInstance),
      reactive: <T extends object>(target: T) => this.reactivity.reactive(target, rawInstance),
      computed: <T>(getter: () => T) => this.reactivity.computed(getter, rawInstance)
    }

    // 添加方法
    if (config.methods) {
      Object.assign(miniProgramConfig, config.methods)
    }

    // 添加生命周期方法
    if (isPage) {
      // 页面生命周期
      if (rawInstance.onLoad) miniProgramConfig.onLoad = rawInstance.onLoad
      if (rawInstance.onShow) miniProgramConfig.onShow = rawInstance.onShow
      if (rawInstance.onReady) miniProgramConfig.onReady = rawInstance.onReady
      if (rawInstance.onHide) miniProgramConfig.onHide = rawInstance.onHide
      if (rawInstance.onUnload) miniProgramConfig.onUnload = rawInstance.onUnload
    } else {
      // 组件生命周期
      if (rawInstance.lifetimes) {
        miniProgramConfig.lifetimes = rawInstance.lifetimes
      }
    }

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
    for (const rawInstance of this.instances.keys()) {
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
  private rawInstance: any = {}

  constructor(config: ComponentConfig) {
    this.config = config
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
   * 清理
   */
  cleanup(): void {
    // 清理逻辑
  }
}
