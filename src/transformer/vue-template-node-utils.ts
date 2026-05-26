/**
 * Vue AST 模板节点转换的无状态工具函数。
 *
 * 这些 helper 只依赖传入参数，不持有 `VueTemplateTransformer` 实例状态，
 * 便于让主转换器聚焦 AST 遍历与上下文流转。
 */
import { logger } from '@/utils/index.js'
import { EVENT_MAP, TAG_MAP } from './template-constants.js'
import type { TemplateTransformResult } from './template-transformer.js'
import type { TransformContext } from '@/types/index.js'
import { applyPropAccessMappingsToTemplate } from './prop-access-mapping.js'
import {
  buildDynamicClassExpression,
  isCustomComponentTag,
  parseVueTemplateEventArguments,
  toKebabCase,
  transformVueTemplateComponentVModel
} from './vue-template-node-basic-utils.js'

const SELF_CLOSING_TEMPLATE_TAGS = ['input', 'image', 'icon', 'progress', 'slider', 'switch']

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
 * 转换 Vue AST 文本节点。
 */
export function transformVueTemplateTextNode(node: any): string {
  return node.content || ''
}

/**
 * 转换 Vue AST 插值节点为 WXML moustache 表达式。
 */
export function transformVueTemplateInterpolationNode(node: any, context?: TransformContext): string {
  if (!node.content) return ''

  if (node.content.type === 4 && node.content.content) {
    return `{{${extractVueTemplateExpression(node.content.content, context)}}}`
  }

  if (node.content.type === 8) {
    if (node.content.loc?.source) {
      return `{{${extractVueTemplateExpression(node.content.loc.source, context)}}}`
    }

    if (node.content.children) {
      const expressions = node.content.children
        .filter((child: any) => child.type === 4)
        .map((child: any) => child.content)
        .join('')

      if (expressions) {
        return `{{${extractVueTemplateExpression(expressions, context)}}}`
      }
    }
  }

  if (node.content.loc?.source) {
    return `{{${extractVueTemplateExpression(node.content.loc.source, context)}}}`
  }

  return ''
}

/**
 * 提取 Vue AST 表达式内容，移除 `_ctx.` 前缀并应用 props 别名映射。
 */
export function extractVueTemplateExpression(exp: any, context?: TransformContext): string {
  let expression = ''

  if (typeof exp === 'string') {
    expression = exp
  } else if (exp?.content) {
    expression = exp.content
  } else if (exp?.loc?.source) {
    expression = exp.loc.source
  }

  if (expression.startsWith('_ctx.')) {
    expression = expression.substring(5)
  }

  return applyPropAccessMappingsToTemplate(expression, context)
}

/**
 * 从 `v-for` 子节点上的 `:key` 推断 WXML `wx:key` 表达式。
 */
export function resolveVueTemplateForKeyExpression(
  node: any,
  valueAlias: string,
  context?: TransformContext
): string {
  const firstChild = node.children?.[0]
  const keyProp = firstChild?.props?.find((prop: any) =>
    prop.type === 7 && prop.name === 'bind' && prop.arg?.content === 'key'
  )

  if (!keyProp?.exp) {
    return valueAlias
  }

  const fullKeyExpression = extractVueTemplateExpression(keyProp.exp, context)

  if (!fullKeyExpression.includes('.')) {
    return fullKeyExpression
  }

  const parts = fullKeyExpression.split('.')
  if (parts.length === 2 && parts[0] === valueAlias) {
    return parts[1] || valueAlias
  }

  return fullKeyExpression
}

/**
 * 判断 Vue AST 元素是否应输出为 WXML 自闭合标签。
 */
export function isVueTemplateSelfClosingTag(tagName: string, children: string): boolean {
  return SELF_CLOSING_TEMPLATE_TAGS.includes(tagName) && !children.trim()
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
  result: TemplateTransformResult,
  modifiers: string[] = []
): string | string[] {
  const eventBindingPrefix = getVueTemplateEventBindingPrefix(modifiers)
  const functionCallMatch = expression.match(/^(\w+)\s*\(\s*(.+)\s*\)$/)

  if (!functionCallMatch) {
    result.eventHandlers.set(expression, expression)
    return `${eventBindingPrefix}${eventName}="${expression}"`
  }

  const [, functionName, argsString] = functionCallMatch

  if (!functionName || !argsString) {
    result.eventHandlers.set(expression, expression)
    return `${eventBindingPrefix}${eventName}="${expression}"`
  }

  const dataAttrs = parseVueTemplateEventArguments(argsString).map((arg, index) => {
    const cleanArg = arg.replace(/^['"]|['"]$/g, '')
    return `data-arg${index}="${cleanArg}"`
  })

  result.eventHandlers.set(functionName, functionName)

  const eventBinding = `${eventBindingPrefix}${eventName}="${functionName}"`
  return dataAttrs.length > 0 ? [eventBinding, ...dataAttrs] : eventBinding
}

/**
 * 根据 Vue 事件修饰符选择微信原生事件绑定前缀。
 */
function getVueTemplateEventBindingPrefix(modifiers: string[]): string {
  if (modifiers.includes('stop')) return 'catch:'
  if (modifiers.includes('capture')) return 'capture-bind:'
  return 'bind:'
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
    return transformVueTemplateComponentVModel(expression, result, modelArg)
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
