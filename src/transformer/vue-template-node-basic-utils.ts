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
 * 将 Vue 事件调用参数转换为 WXML data-* 属性值。
 *
 * 字符串、数字、布尔值等静态字面量保持静态 dataset；标识符、成员访问、
 * 表达式等动态参数使用 WXML moustache 绑定，避免把 `activity.id` 误写成
 * 字面量字符串。
 */
export function formatVueTemplateEventDataArgument(arg: string): string {
  const trimmed = arg.trim()

  if (isQuotedStringLiteral(trimmed)) {
    return trimmed.slice(1, -1)
  }

  if (isStaticDatasetLiteral(trimmed)) {
    return trimmed
  }

  return `{{${trimmed.replace(/"/g, '&quot;')}}}`
}

function isQuotedStringLiteral(value: string): boolean {
  if (value.length < 2) return false
  const quote = value[0]
  return (quote === '\'' || quote === '"') && value[value.length - 1] === quote
}

function isStaticDatasetLiteral(value: string): boolean {
  if (/^-?\d+(\.\d+)?$/.test(value)) return true
  return ['true', 'false', 'null', 'undefined'].includes(value)
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
