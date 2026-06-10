/**
 * 事件系统
 * 提供双向绑定、事件处理等功能的运行时支持
 */

import { logger } from '../utils/logger'
import {
  applyEventModifiers,
  applyTwoWayBindingValueToInstance,
  createEventConfig,
  extractTwoWayBindingValue,
  getBindingHandlerName,
  shouldSetupTwoWayBindings
} from './event-utils.js'

/**
 * 事件处理器定义
 */
export interface EventHandler {
  name: string
  handler: Function
  modifiers?: string[]
  once?: boolean
  passive?: boolean
}

/**
 * 双向绑定定义
 */
export interface TwoWayBinding {
  property: string
  eventName: string
  transformer?: (value: any) => any
  validator?: (value: any) => boolean
}

/**
 * 事件系统配置
 */
export interface EventConfig {
  debug?: boolean
  enableTwoWayBinding?: boolean
  enableEventModifiers?: boolean
}

/**
 * 事件系统
 */
export class EventSystem {
  private config: EventConfig
  private instances: Map<any, EventInstance> = new Map()
  private globalEventBus: Map<string, Function[]> = new Map()
  private initialized = false

  constructor(config: EventConfig = {}) {
    this.config = createEventConfig(config)
  }

  /**
   * 初始化事件系统
   */
  async initialize(): Promise<void> {
    if (this.initialized) {
      return
    }

    logger.debug('初始化事件系统')
    this.initialized = true
  }

  /**
   * 为实例设置事件系统
   */
  setupInstance(instance: any, config: {
    events?: Record<string, EventHandler>
    bindings?: Record<string, TwoWayBinding>
  }): void {
    const eventInstance = new EventInstance(instance, config, this.config)
    this.instances.set(instance, eventInstance)
    eventInstance.setup()
  }

  /**
   * 全局事件发射
   */
  emit(eventName: string, ...args: any[]): void {
    const handlers = this.globalEventBus.get(eventName)
    if (handlers) {
      for (const handler of handlers) {
        try {
          handler(...args)
        } catch (error) {
          logger.error(`全局事件处理器执行失败: ${eventName}`, error)
        }
      }
    }
  }

  /**
   * 全局事件监听
   */
  on(eventName: string, handler: Function): void {
    if (!this.globalEventBus.has(eventName)) {
      this.globalEventBus.set(eventName, [])
    }
    this.globalEventBus.get(eventName)!.push(handler)
  }

  /**
   * 移除全局事件监听
   */
  off(eventName: string, handler?: Function): void {
    if (!handler) {
      this.globalEventBus.delete(eventName)
      return
    }

    const handlers = this.globalEventBus.get(eventName)
    if (handlers) {
      const index = handlers.indexOf(handler)
      if (index > -1) {
        handlers.splice(index, 1)
      }
    }
  }

  /**
   * 清理实例
   */
  cleanupInstance(instance: any): void {
    const eventInstance = this.instances.get(instance)
    if (eventInstance) {
      eventInstance.cleanup()
      this.instances.delete(instance)
    }
  }

  /**
   * 销毁事件系统
   */
  destroy(): void {
    for (const eventInstance of this.instances.values()) {
      eventInstance.cleanup()
    }
    this.instances.clear()
    this.globalEventBus.clear()
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
 * 事件实例
 */
class EventInstance {
  private instance: any
  private config: any
  private eventConfig: EventConfig
  private bindings: Map<string, TwoWayBinding> = new Map()
  private boundMethods: Map<string, Function> = new Map()

  constructor(instance: any, config: any, eventConfig: EventConfig) {
    this.instance = instance
    this.config = config
    this.eventConfig = eventConfig
  }

  /**
   * 设置事件实例
   */
  setup(): void {
    this.setupEventHandlers()
    this.setupTwoWayBindings()
  }

  /**
   * 设置事件处理器
   */
  private setupEventHandlers(): void {
    if (!this.config.events) return

    for (const [name, handler] of Object.entries(this.config.events)) {
      const eventHandler = handler as EventHandler

      // 创建包装的处理器
      const wrappedHandler = this.createWrappedHandler(eventHandler)
      this.boundMethods.set(name, wrappedHandler)

      // 设置到实例
      this.instance[name] = wrappedHandler
    }
  }

  /**
   * 设置双向绑定
   */
  private setupTwoWayBindings(): void {
    if (!shouldSetupTwoWayBindings(this.config.bindings, this.eventConfig)) return

    for (const [name, binding] of Object.entries(this.config.bindings)) {
      const bindingDef = binding as TwoWayBinding
      this.bindings.set(name, bindingDef)

      // 创建绑定处理器
      const bindingHandler = this.createBindingHandler(bindingDef)
      const handlerName = getBindingHandlerName(name)
      
      this.boundMethods.set(handlerName, bindingHandler)
      this.instance[handlerName] = bindingHandler
    }
  }

  /**
   * 创建包装的事件处理器
   */
  private createWrappedHandler(eventHandler: EventHandler): Function {
    return (event: any, ...args: any[]) => {
      try {
        if (this.eventConfig.debug) {
          logger.debug(`执行事件处理器: ${eventHandler.name}`, { event, args })
        }

        // 应用事件修饰符
        if (this.eventConfig.enableEventModifiers && eventHandler.modifiers) {
          event = applyEventModifiers(event, eventHandler.modifiers)
          if (event === null) {
            return undefined
          }
        }

        // 执行处理器
        const result = eventHandler.handler.call(this.instance, event, ...args)

        // 如果是once修饰符，移除处理器
        if (eventHandler.once) {
          delete this.instance[eventHandler.name]
        }

        return result
      } catch (error) {
        logger.error(`事件处理器执行失败: ${eventHandler.name}`, error)
        throw error
      }
    }
  }

  /**
   * 创建双向绑定处理器
   */
  private createBindingHandler(binding: TwoWayBinding): Function {
    return (event: any) => {
      try {
        let value = extractTwoWayBindingValue(event)

        // 应用转换器
        if (binding.transformer) {
          value = binding.transformer(value)
        }

        // 应用验证器
        if (binding.validator && !binding.validator(value)) {
          logger.warn(`双向绑定值验证失败: ${binding.property}`, value)
          return
        }

        // 更新数据
        applyTwoWayBindingValueToInstance(this.instance, binding.property, value)

        // 触发计算属性更新
        if (this.instance._updateComputed) {
          this.instance._updateComputed()
        }

        if (this.eventConfig.debug) {
          logger.debug(`双向绑定更新: ${binding.property}`, value)
        }
      } catch (error) {
        logger.error(`双向绑定处理失败: ${binding.property}`, error)
      }
    }
  }

  /**
   * 清理
   */
  cleanup(): void {
    // 移除绑定的方法
    for (const name of this.boundMethods.keys()) {
      delete this.instance[name]
    }

    this.bindings.clear()
    this.boundMethods.clear()
  }
}
