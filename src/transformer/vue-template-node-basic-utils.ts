import { parseExpression } from '@babel/parser'
import { isExpression, type Expression } from '@babel/types'
import type { TemplateTransformResult } from './template-transformer.js'

/**
 * 根据 Vue `:class` 表达式生成 WXML class 表达式片段。
 */
export function buildDynamicClassExpression(dynamicClass: string): string {
  try {
    return formatClassExpression(parseExpression(dynamicClass), dynamicClass)
  } catch {
    return dynamicClass
  }
}

function formatClassExpression(node: Expression, source: string): string {
  if (node.type === 'ObjectExpression') {
    const conditions = node.properties.flatMap(property => {
      if (property.type !== 'ObjectProperty' || property.computed || !isExpression(property.value)) return []
      const key = property.key.type === 'Identifier' ? property.key.name
        : property.key.type === 'StringLiteral' ? property.key.value : undefined
      if (key === undefined) return []
      const label = key.replace(/\\/g, '\\\\').replace(/'/g, "\\'")
      const value = source.slice(property.value.start ?? 0, property.value.end ?? 0)
      return [`${value} ? '${label}' : ''`]
    })
    return conditions.length === 1 ? conditions[0]! : joinClassExpressions(conditions)
  }

  if (node.type === 'ArrayExpression') {
    return joinClassExpressions(node.elements.flatMap(element => {
      if (!element || element.type === 'SpreadElement') return []
      const expression = formatClassExpression(element, source)
      return expression ? [`${expression} || ''`] : []
    }))
  }

  return source.slice(node.start ?? 0, node.end ?? 0)
}

function joinClassExpressions(expressions: string[]): string {
  return expressions.length > 0 ? `(${expressions.map(expression => `(${expression})`).join(" + ' ' + ")})` : ''
}

/**
 * 解析事件调用参数，保留嵌套函数和引号内逗号。
 */
export function parseVueTemplateEventArguments(argsString: string): string[] {
  const source = `[${argsString}]`
  try {
    const expression = parseExpression(source)
    if (expression.type === 'ArrayExpression') {
      return expression.elements.flatMap(element =>
        element ? [source.slice(element.start ?? 0, element.end ?? 0)] : []
      )
    }
  } catch {}
  return []
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
