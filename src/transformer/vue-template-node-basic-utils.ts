import type { TemplateTransformResult } from './template-transformer.js'

/**
 * 根据 Vue `:class` 表达式生成 WXML class 表达式片段。
 */
export function buildDynamicClassExpression(dynamicClass: string): string {
  const trimmed = dynamicClass.trim()

  if (trimmed.startsWith('{') && trimmed.endsWith('}')) {
    const objectContent = trimmed.slice(1, -1)
    const classConditions = objectContent
      .split(',')
      .map((condition: string) => {
        const [className, expression] = condition.split(':').map((s: string) => s.trim())
        const cleanClassName = (className || '').replace(/['"]/g, '')
        const cleanExpression = (expression || '').trim()
        return `${cleanExpression} ? '${cleanClassName}' : ''`
      })
      .filter((condition: string) => !condition.includes("'' ? '' : ''"))

    if (classConditions.length === 1) {
      return classConditions[0] || ''
    }

    if (classConditions.length > 1) {
      return `(${classConditions.join(' + " " + ')})`
    }

    return ''
  }

  if (trimmed.startsWith('[') && trimmed.endsWith(']')) {
    return trimmed.slice(1, -1)
  }

  return dynamicClass
}

/**
 * 解析事件调用参数，保留嵌套函数和引号内逗号。
 */
export function parseVueTemplateEventArguments(argsString: string): string[] {
  const args: string[] = []
  let current = ''
  let inQuotes = false
  let quoteChar = ''
  let depth = 0

  for (let i = 0; i < argsString.length; i++) {
    const char = argsString[i]

    if (!inQuotes && (char === '"' || char === "'")) {
      inQuotes = true
      quoteChar = char
      current += char
    } else if (inQuotes && char === quoteChar) {
      inQuotes = false
      current += char
    } else if (!inQuotes && char === '(') {
      depth++
      current += char
    } else if (!inQuotes && char === ')') {
      depth--
      current += char
    } else if (!inQuotes && char === ',' && depth === 0) {
      args.push(current.trim())
      current = ''
    } else {
      current += char
    }
  }

  if (current.trim()) {
    args.push(current.trim())
  }

  return args
}

/**
 * 转换自定义组件 v-model 为原生属性绑定与 update 事件监听。
 */
export function transformVueTemplateComponentVModel(
  expression: string,
  result: TemplateTransformResult,
  modelArg?: string
): string[] {
  const propName = modelArg || 'modelValue'
  const attrName = propName === 'modelValue' ? 'model-value' : toKebabCase(propName)
  const updateEvent = propName === 'modelValue' ? 'update:modelValue' : `update:${propName}`
  const handlerName = `_handleUpdate_${expression.replace(/\./g, '_')}`

  result.eventHandlers.set(handlerName, handlerName)

  return [
    `${attrName}="{{${expression}}}"`,
    `bind:${updateEvent}="${handlerName}"`
  ]
}

/**
 * 判断标签是否需要走自定义组件 v-model 转换。
 */
export function isCustomComponentTag(tagName?: string): boolean {
  if (!tagName) return false
  const nativeModelTags = new Set([
    'input',
    'textarea',
    'radio-group',
    'checkbox-group',
    'picker',
    'switch',
    'slider'
  ])
  if (nativeModelTags.has(tagName)) return false
  return /^[A-Z]/.test(tagName) || tagName.includes('-')
}

/**
 * 转换为 kebab-case。
 */
export function toKebabCase(str: string): string {
  return str.replace(/([A-Z])/g, '-$1').toLowerCase().replace(/^-/, '')
}
