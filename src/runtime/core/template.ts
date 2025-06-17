/**
 * 模板渲染引擎
 * 提供插槽、条件渲染、列表渲染等功能的运行时支持
 */

import { logger } from '../utils/logger'

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
    this.config = {
      debug: false,
      enableSlots: true,
      enableConditional: true,
      enableList: true,
      ...config
    }
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
    for (const [instance, templateInstance] of this.instances) {
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

    for (const [name, slot] of Object.entries(this.config.slots)) {
      this.slots.set(name, slot as SlotDef)
    }

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

    for (const [name, conditional] of Object.entries(this.config.conditionals)) {
      this.conditionals.set(name, conditional as ConditionalConfig)
    }

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

    for (const [name, list] of Object.entries(this.config.lists)) {
      this.lists.set(name, list as ListConfig)
    }

    // 添加列表渲染方法到实例
    this.instance._renderList = (name: string) => {
      return this.renderList(name)
    }
  }

  /**
   * 渲染插槽
   */
  renderSlot(name: string, props?: Record<string, any>): any {
    const slot = this.slots.get(name)
    if (!slot) {
      logger.warn(`插槽 ${name} 不存在`)
      return null
    }

    try {
      // 合并props
      const slotProps = { ...slot.props, ...props }

      // 如果有内容，返回内容
      if (slot.content) {
        return this.processTemplate(slot.content, slotProps)
      }

      // 否则返回fallback
      if (slot.fallback) {
        return this.processTemplate(slot.fallback, slotProps)
      }

      return null
    } catch (error) {
      logger.error(`渲染插槽 ${name} 失败:`, error)
      return slot.fallback || null
    }
  }

  /**
   * 渲染条件模板
   */
  renderConditional(name: string): any {
    const conditional = this.conditionals.get(name)
    if (!conditional) {
      logger.warn(`条件渲染 ${name} 不存在`)
      return null
    }

    try {
      const condition = this.evaluateCondition(conditional.condition)
      
      if (condition) {
        return this.processTemplate(conditional.template)
      } else if (conditional.elseTemplate) {
        return this.processTemplate(conditional.elseTemplate)
      }

      return null
    } catch (error) {
      logger.error(`渲染条件模板 ${name} 失败:`, error)
      return null
    }
  }

  /**
   * 渲染列表模板
   */
  renderList(name: string): any {
    const list = this.lists.get(name)
    if (!list) {
      logger.warn(`列表渲染 ${name} 不存在`)
      return null
    }

    try {
      const items = this.evaluateItems(list.items)
      if (!Array.isArray(items)) {
        logger.warn(`列表渲染 ${name} 的items不是数组`)
        return null
      }

      return items.map((item, index) => {
        const context = {
          [list.itemName]: item,
          [list.indexName || 'index']: index
        }

        if (list.keyField && item[list.keyField] !== undefined) {
          context['key'] = item[list.keyField]
        }

        return this.processTemplate(list.template, context)
      })
    } catch (error) {
      logger.error(`渲染列表模板 ${name} 失败:`, error)
      return []
    }
  }

  /**
   * 处理模板
   */
  private processTemplate(template: any, context?: Record<string, any>): any {
    if (typeof template === 'string') {
      // 简单的模板字符串处理
      return this.interpolateTemplate(template, context)
    }

    if (typeof template === 'function') {
      // 函数模板
      return template(context)
    }

    // 直接返回
    return template
  }

  /**
   * 模板字符串插值
   */
  private interpolateTemplate(template: string, context?: Record<string, any>): string {
    if (!context) return template

    return template.replace(/\{\{([^}]+)\}\}/g, (match, expression) => {
      try {
        const value = this.evaluateExpression(expression.trim(), context)
        return String(value)
      } catch (error) {
        logger.error(`模板插值失败: ${expression}`, error)
        return match
      }
    })
  }

  /**
   * 评估条件
   */
  private evaluateCondition(condition: string | (() => boolean)): boolean {
    if (typeof condition === 'function') {
      return condition()
    }

    if (typeof condition === 'string') {
      return this.evaluateExpression(condition) as boolean
    }

    return Boolean(condition)
  }

  /**
   * 评估items
   */
  private evaluateItems(items: string | (() => any[])): any[] {
    if (typeof items === 'function') {
      return items()
    }

    if (typeof items === 'string') {
      return this.evaluateExpression(items) as any[]
    }

    return []
  }

  /**
   * 评估表达式
   */
  private evaluateExpression(expression: string, context?: Record<string, any>): any {
    try {
      // 简单的表达式评估
      // 在实际实现中，这里应该使用更安全的表达式解析器
      const data = { ...this.instance.data, ...context }
      
      // 替换表达式中的变量
      let code = expression
      for (const [key, value] of Object.entries(data)) {
        const regex = new RegExp(`\\b${key}\\b`, 'g')
        code = code.replace(regex, JSON.stringify(value))
      }

      // 使用Function构造器评估表达式（注意：这在生产环境中需要更安全的实现）
      return new Function(`return ${code}`)()
    } catch (error) {
      logger.error(`表达式评估失败: ${expression}`, error)
      return null
    }
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
