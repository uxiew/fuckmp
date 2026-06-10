/**
 * 模板渲染引擎
 * 提供插槽、条件渲染、列表渲染等功能的运行时支持
 */

import { logger } from '../utils/logger'
import {
  createTemplateConfig,
  renderRegisteredConditionalTemplate,
  renderRegisteredListTemplate,
  renderRegisteredSlotTemplate,
  registerTemplateDefinitions,
} from './template-utils'

/**
 * 插槽定义
 */
export interface SlotDef {
  name: string
  props?: Record<string, any>
  fallback?: any
  content?: any
}

/**
 * 条件渲染配置
 */
export interface ConditionalConfig {
  condition: string | (() => boolean)
  template: string
  elseTemplate?: string
}

/**
 * 列表渲染配置
 */
export interface ListConfig {
  items: string | (() => any[])
  itemName: string
  indexName?: string
  keyField?: string
  template: string
}

/**
 * 模板引擎配置
 */
export interface TemplateConfig {
  debug?: boolean
  enableSlots?: boolean
  enableConditional?: boolean
  enableList?: boolean
}

/**
 * 模板渲染引擎
 */
export class TemplateEngine {
  private config: TemplateConfig
  private instances: Map<any, TemplateInstance> = new Map()
  private slotRegistry: Map<string, SlotDef> = new Map()
  private initialized = false

  constructor(config: TemplateConfig = {}) {
    this.config = createTemplateConfig(config)
  }

  /**
   * 初始化模板引擎
   */
  async initialize(): Promise<void> {
    if (this.initialized) {
      return
    }

    logger.debug('初始化模板引擎')
    this.initialized = true
  }

  /**
   * 为实例设置模板引擎
   */
  setupInstance(instance: any, config: {
    slots?: Record<string, SlotDef>
    conditionals?: Record<string, ConditionalConfig>
    lists?: Record<string, ListConfig>
  }): void {
    const templateInstance = new TemplateInstance(instance, config, this.config)
    this.instances.set(instance, templateInstance)
    templateInstance.setup()
  }

  /**
   * 注册全局插槽
   */
  registerSlot(name: string, slot: SlotDef): void {
    this.slotRegistry.set(name, slot)
  }

  /**
   * 获取全局插槽
   */
  getSlot(name: string): SlotDef | undefined {
    return this.slotRegistry.get(name)
  }

  /**
   * 渲染插槽
   */
  renderSlot(instance: any, slotName: string, props?: Record<string, any>): any {
    const templateInstance = this.instances.get(instance)
    if (templateInstance) {
      return templateInstance.renderSlot(slotName, props)
    }
    return null
  }

  /**
   * 渲染条件模板
   */
  renderConditional(instance: any, conditionName: string): any {
    const templateInstance = this.instances.get(instance)
    if (templateInstance) {
      return templateInstance.renderConditional(conditionName)
    }
    return null
  }

  /**
   * 渲染列表模板
   */
  renderList(instance: any, listName: string): any {
    const templateInstance = this.instances.get(instance)
    if (templateInstance) {
      return templateInstance.renderList(listName)
    }
    return null
  }

  /**
   * 清理实例
   */
  cleanupInstance(instance: any): void {
    const templateInstance = this.instances.get(instance)
    if (templateInstance) {
      templateInstance.cleanup()
      this.instances.delete(instance)
    }
  }

  /**
   * 销毁模板引擎
   */
  destroy(): void {
    for (const templateInstance of this.instances.values()) {
      templateInstance.cleanup()
    }
    this.instances.clear()
    this.slotRegistry.clear()
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
 * 模板实例
 */
class TemplateInstance {
  private instance: any
  private config: any
  private templateConfig: TemplateConfig
  private slots: Map<string, SlotDef> = new Map()
  private conditionals: Map<string, ConditionalConfig> = new Map()
  private lists: Map<string, ListConfig> = new Map()

  constructor(instance: any, config: any, templateConfig: TemplateConfig) {
    this.instance = instance
    this.config = config
    this.templateConfig = templateConfig
  }

  /**
   * 设置模板实例
   */
  setup(): void {
    this.setupSlots()
    this.setupConditionals()
    this.setupLists()
  }

  /**
   * 设置插槽
   */
  private setupSlots(): void {
    if (!this.config.slots || !this.templateConfig.enableSlots) return

    registerTemplateDefinitions(this.slots, this.config.slots)

    // 添加插槽渲染方法到实例
    this.instance._renderSlot = (name: string, props?: Record<string, any>) => {
      return this.renderSlot(name, props)
    }
  }

  /**
   * 设置条件渲染
   */
  private setupConditionals(): void {
    if (!this.config.conditionals || !this.templateConfig.enableConditional) return

    registerTemplateDefinitions(this.conditionals, this.config.conditionals)

    // 添加条件渲染方法到实例
    this.instance._renderConditional = (name: string) => {
      return this.renderConditional(name)
    }
  }

  /**
   * 设置列表渲染
   */
  private setupLists(): void {
    if (!this.config.lists || !this.templateConfig.enableList) return

    registerTemplateDefinitions(this.lists, this.config.lists)

    // 添加列表渲染方法到实例
    this.instance._renderList = (name: string) => {
      return this.renderList(name)
    }
  }

  /**
   * 渲染插槽
   */
  renderSlot(name: string, props?: Record<string, any>): any {
    return renderRegisteredSlotTemplate(
      this.slots,
      name,
      props,
      this.instance.data,
      logger
    )
  }

  /**
   * 渲染条件模板
   */
  renderConditional(name: string): any {
    return renderRegisteredConditionalTemplate(
      this.conditionals,
      name,
      this.instance.data,
      logger
    )
  }

  /**
   * 渲染列表模板
   */
  renderList(name: string): any {
    return renderRegisteredListTemplate(
      this.lists,
      name,
      this.instance.data,
      logger
    )
  }

  /**
   * 清理
   */
  cleanup(): void {
    this.slots.clear()
    this.conditionals.clear()
    this.lists.clear()
  }
}
