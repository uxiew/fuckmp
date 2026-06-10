/**
 * Runtime template pure helpers.
 */

import {
  evaluateTemplateCondition,
  evaluateTemplateItems,
  processRuntimeTemplate
} from './template-expression-utils.js'

export type { TemplateErrorHandler } from './template-expression-utils.js'
export {
  evaluateTemplateCondition,
  evaluateTemplateExpression,
  evaluateTemplateItems,
  interpolateTemplate,
  processRuntimeTemplate
} from './template-expression-utils.js'

/**
 * Runtime template renderer logger.
 */
export interface RuntimeTemplateLogger {
  /** 记录缺失或非致命渲染问题。 */
  warn(message: string): void
  /** 记录模板渲染异常。 */
  error(message: string, error: unknown): void
}

/**
 * Runtime slot definition used by registered render helpers.
 */
export interface RuntimeSlotDefinition {
  props?: Record<string, any>
  fallback?: any
  content?: any
}

/**
 * Runtime conditional definition used by registered render helpers.
 */
export interface RuntimeConditionalDefinition {
  condition: string | (() => boolean)
  template: string
  elseTemplate?: string
}

/**
 * Runtime list definition used by registered render helpers.
 */
export interface RuntimeListDefinition {
  items: string | (() => any[])
  itemName: string
  indexName?: string
  keyField?: string
  template: string
}

/**
 * Runtime template engine configuration.
 */
export interface RuntimeTemplateConfig {
  debug: boolean
  enableSlots: boolean
  enableConditional: boolean
  enableList: boolean
}

/**
 * 构造模板引擎配置，保留运行时旧默认值。
 */
export function createTemplateConfig(config: Partial<RuntimeTemplateConfig> = {}): RuntimeTemplateConfig {
  return {
    debug: false,
    enableSlots: true,
    enableConditional: true,
    enableList: true,
    ...config
  }
}

/**
 * 将配置对象中的模板定义注册到目标 Map。
 */
export function registerTemplateDefinitions<T>(
  target: Map<string, T>,
  definitions?: Record<string, T>
): void {
  if (!definitions) return

  for (const [name, definition] of Object.entries(definitions)) {
    target.set(name, definition)
  }
}

/**
 * 合并插槽默认 props 与调用方 props。
 */
export function mergeSlotRenderProps(
  slotProps?: Record<string, any>,
  renderProps?: Record<string, any>
): Record<string, any> {
  return { ...slotProps, ...renderProps }
}

/**
 * 按旧 truthy 规则选择 slot content/fallback 模板。
 */
export function resolveSlotRenderTemplate(slot: {
  content?: any
  fallback?: any
}): any {
  if (slot.content) return slot.content
  if (slot.fallback) return slot.fallback
  return null
}

/**
 * 构造列表项模板渲染上下文。
 */
export function createListItemRenderContext(
  itemName: string,
  indexName: string | undefined,
  keyField: string | undefined,
  item: any,
  index: number
): Record<string, any> {
  const context: Record<string, any> = {
    [itemName]: item,
    [indexName || 'index']: index
  }

  if (keyField && item[keyField] !== undefined) {
    context.key = item[keyField]
  }

  return context
}

/**
 * 渲染已注册的 slot 模板，保留旧缺失和 fallback 语义。
 */
export function renderRegisteredSlotTemplate(
  slots: Map<string, RuntimeSlotDefinition>,
  name: string,
  props: Record<string, any> | undefined,
  instanceData: Record<string, any>,
  logger: RuntimeTemplateLogger
): any {
  const slot = slots.get(name)
  if (!slot) {
    logger.warn(`插槽 ${name} 不存在`)
    return null
  }

  try {
    const slotProps = mergeSlotRenderProps(slot.props, props)
    const template = resolveSlotRenderTemplate(slot)

    if (template) {
      return processRuntimeTemplate(template, slotProps, instanceData, logger.error)
    }

    return null
  } catch (error) {
    logger.error(`渲染插槽 ${name} 失败:`, error)
    return slot.fallback || null
  }
}

/**
 * 渲染已注册的条件模板，保留旧 else 和异常语义。
 */
export function renderRegisteredConditionalTemplate(
  conditionals: Map<string, RuntimeConditionalDefinition>,
  name: string,
  instanceData: Record<string, any>,
  logger: RuntimeTemplateLogger
): any {
  const conditional = conditionals.get(name)
  if (!conditional) {
    logger.warn(`条件渲染 ${name} 不存在`)
    return null
  }

  try {
    const condition = evaluateTemplateCondition(conditional.condition, instanceData, logger.error)

    if (condition) {
      return processRuntimeTemplate(conditional.template, undefined, instanceData, logger.error)
    }

    if (conditional.elseTemplate) {
      return processRuntimeTemplate(conditional.elseTemplate, undefined, instanceData, logger.error)
    }

    return null
  } catch (error) {
    logger.error(`渲染条件模板 ${name} 失败:`, error)
    return null
  }
}

/**
 * 渲染已注册的列表模板，保留旧非数组和异常语义。
 */
export function renderRegisteredListTemplate(
  lists: Map<string, RuntimeListDefinition>,
  name: string,
  instanceData: Record<string, any>,
  logger: RuntimeTemplateLogger
): any {
  const list = lists.get(name)
  if (!list) {
    logger.warn(`列表渲染 ${name} 不存在`)
    return null
  }

  try {
    const items = evaluateTemplateItems(list.items, instanceData, logger.error)
    if (!Array.isArray(items)) {
      logger.warn(`列表渲染 ${name} 的items不是数组`)
      return null
    }

    return items.map((item, index) => {
      const context = createListItemRenderContext(
        list.itemName,
        list.indexName,
        list.keyField,
        item,
        index
      )

      return processRuntimeTemplate(list.template, context, instanceData, logger.error)
    })
  } catch (error) {
    logger.error(`渲染列表模板 ${name} 失败:`, error)
    return []
  }
}
