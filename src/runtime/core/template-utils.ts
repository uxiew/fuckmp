/**
 * Runtime template pure helpers.
 */

export type TemplateErrorHandler = (message: string, error: unknown) => void

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
 * 处理运行时模板值。
 */
export function processRuntimeTemplate(
  template: any,
  context?: Record<string, any>,
  instanceData: Record<string, any> = {},
  onError?: TemplateErrorHandler
): any {
  if (typeof template === 'string') {
    return interpolateTemplate(template, context, instanceData, onError)
  }

  if (typeof template === 'function') {
    return template(context)
  }

  return template
}

/**
 * 对模板字符串执行简单插值。
 */
export function interpolateTemplate(
  template: string,
  context?: Record<string, any>,
  instanceData: Record<string, any> = {},
  onError?: TemplateErrorHandler
): string {
  if (!context) return template

  return template.replace(/\{\{([^}]+)\}\}/g, (match, expression) => {
    try {
      const value = evaluateTemplateExpression(expression.trim(), instanceData, context, onError)
      return String(value)
    } catch (error) {
      onError?.(`模板插值失败: ${expression}`, error)
      return match
    }
  })
}

/**
 * 评估运行时模板条件。
 */
export function evaluateTemplateCondition(
  condition: string | (() => boolean),
  instanceData: Record<string, any> = {},
  onError?: TemplateErrorHandler
): boolean {
  if (typeof condition === 'function') {
    return condition()
  }

  if (typeof condition === 'string') {
    return evaluateTemplateExpression(condition, instanceData, undefined, onError) as boolean
  }

  return Boolean(condition)
}

/**
 * 评估运行时模板列表数据。
 */
export function evaluateTemplateItems(
  items: string | (() => any[]),
  instanceData: Record<string, any> = {},
  onError?: TemplateErrorHandler
): any[] {
  if (typeof items === 'function') {
    return items()
  }

  if (typeof items === 'string') {
    return evaluateTemplateExpression(items, instanceData, undefined, onError) as any[]
  }

  return []
}

/**
 * 评估运行时模板表达式。
 */
export function evaluateTemplateExpression(
  expression: string,
  instanceData: Record<string, any> = {},
  context?: Record<string, any>,
  onError?: TemplateErrorHandler
): any {
  try {
    const data = { ...instanceData, ...context }

    let code = expression
    for (const [key, value] of Object.entries(data)) {
      const regex = new RegExp(`\\b${key}\\b`, 'g')
      code = code.replace(regex, JSON.stringify(value))
    }

    return new Function(`return ${code}`)()
  } catch (error) {
    onError?.(`表达式评估失败: ${expression}`, error)
    return null
  }
}
