/**
 * Vue AST 模板节点转换的无状态工具函数。
 *
 * 这些 helper 只依赖传入参数，不持有 `VueTemplateTransformer` 实例状态，
 * 便于让主转换器聚焦 AST 遍历与上下文流转。
 */
import { logger } from '@/utils/index.js'
import { EVENT_MAP, TAG_MAP } from './template-constants.js'
import type { TemplateTransformResult } from './template-transformer.js'

/**
 * 将 Vue/HTML 标签名转换为微信小程序目标标签名。
 */
export function transformVueTemplateTagName(tagName: string): string {
  if (/^[A-Z]/.test(tagName)) {
    return toKebabCase(tagName)
  }

  return TAG_MAP[tagName.toLowerCase() as keyof typeof TAG_MAP] || tagName
}

/**
 * 转换 Vue class 绑定为 WXML class 属性。
 */
export function transformVueTemplateClassBinding(staticClass: string, dynamicClass: string): string {
  if (!staticClass && !dynamicClass) return ''

  if (staticClass && !dynamicClass) {
    return `class="${staticClass}"`
  }

  const dynamicExpression = buildDynamicClassExpression(dynamicClass)
  const classExpression = staticClass && dynamicExpression
    ? `'${staticClass}' + ' ' + (${dynamicExpression})`
    : dynamicExpression || `'${staticClass}'`

  return `class="{{${classExpression}}}"`
}

/**
 * 映射 Vue 事件名到微信小程序事件名。
 */
export function mapVueTemplateEventName(eventName: string): string {
  return EVENT_MAP[eventName as keyof typeof EVENT_MAP] || eventName
}

/**
 * 转换事件处理器，并把带参数调用转换为 bind + data-arg 属性组合。
 */
export function transformVueTemplateEventHandler(
  eventName: string,
  expression: string,
  result: TemplateTransformResult
): string | string[] {
  const functionCallMatch = expression.match(/^(\w+)\s*\(\s*(.+)\s*\)$/)

  if (!functionCallMatch) {
    result.eventHandlers.set(expression, expression)
    return `bind:${eventName}="${expression}"`
  }

  const [, functionName, argsString] = functionCallMatch

  if (!functionName || !argsString) {
    result.eventHandlers.set(expression, expression)
    return `bind:${eventName}="${expression}"`
  }

  const dataAttrs = parseEventArguments(argsString).map((arg, index) => {
    const cleanArg = arg.replace(/^['"]|['"]$/g, '')
    return `data-arg${index}="${cleanArg}"`
  })

  result.eventHandlers.set(functionName, functionName)

  const eventBinding = `bind:${eventName}="${functionName}"`
  return dataAttrs.length > 0 ? [eventBinding, ...dataAttrs] : eventBinding
}

/**
 * 转换 v-model 指令为原生属性和事件绑定。
 */
export function transformVueTemplateVModel(
  expression: string,
  result: TemplateTransformResult,
  modifiers: string[] = [],
  elementType?: string,
  modelArg?: string
): string[] {
  if (isCustomComponentTag(elementType)) {
    return transformComponentVModel(expression, result, modelArg)
  }

  let handlerPrefix = '_handleInput'
  let eventType = 'bindinput'

  if (elementType === 'radio-group') {
    handlerPrefix = '_handleRadio'
    eventType = 'bindchange'
  } else if (elementType === 'checkbox-group') {
    handlerPrefix = '_handleCheckbox'
    eventType = 'bindchange'
  } else if (elementType === 'picker') {
    handlerPrefix = '_handlePicker'
    eventType = 'bindchange'
  } else if (modifiers.includes('number')) {
    handlerPrefix = '_handleNumberInput'
  } else if (modifiers.includes('trim')) {
    handlerPrefix = '_handleTrimInput'
  }

  const inputHandler = `${handlerPrefix}_${expression.replace(/\./g, '_')}`
  result.eventHandlers.set(inputHandler, inputHandler)

  return [
    `value="{{${expression}}}"`,
    `${eventType}="${inputHandler}"`
  ]
}

/**
 * 在 Vue 模板 AST 不可用时执行保守字符串回退转换。
 */
export function transformVueTemplateFallbackString(source: string): string {
  logger.warn(`使用字符串回退处理`)

  let wxml = source

  const tagReplacements = [
    ['<div', '<view'],
    ['</div>', '</view>'],
    ['<span', '<text'],
    ['</span>', '</text>'],
    ['<img', '<image'],
    ['<p', '<text'],
    ['</p>', '</text>']
  ]

  tagReplacements.forEach(([from, to]) => {
    wxml = wxml.replace(new RegExp(from as string, 'g'), to as string)
  })

  wxml = wxml.replace(/\sv-if=/g, ' wx:if=')
  wxml = wxml.replace(/\sv-else-if=/g, ' wx:elif=')
  wxml = wxml.replace(/\sv-else\b/g, ' wx:else')
  wxml = wxml.replace(/\sv-for=/g, ' wx:for=')
  wxml = wxml.replace(/\sv-show=/g, ' hidden=')
  wxml = wxml.replace(/@(\w+)=/g, 'bind:$1=')
  wxml = wxml.replace(/:(\w+)=/g, '$1=')

  return wxml
}

/**
 * 根据 Vue `:class` 表达式生成 WXML class 表达式片段。
 */
function buildDynamicClassExpression(dynamicClass: string): string {
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
function parseEventArguments(argsString: string): string[] {
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
function transformComponentVModel(
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
function isCustomComponentTag(tagName?: string): boolean {
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
function toKebabCase(str: string): string {
  return str.replace(/([A-Z])/g, '-$1').toLowerCase().replace(/^-/, '')
}
