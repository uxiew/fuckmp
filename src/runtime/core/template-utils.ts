/**
 * Runtime template pure helpers.
 */

export type TemplateErrorHandler = (message: string, error: unknown) => void

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
