/**
 * Enhanced template transformer rendering helpers.
 */

import { HTMLElement, TextNode } from 'node-html-parser'
import type { TransformContext } from '@/types/index.js'
import type { TemplateTransformResult } from './template-transformer.js'

const ENHANCED_TEMPLATE_TAG_MAP: Record<string, string> = {
  div: 'view',
  span: 'text',
  img: 'image',
  p: 'text',
  a: 'navigator',
  input: 'input',
  textarea: 'textarea',
  button: 'button',
  form: 'form'
}

const ENHANCED_TEMPLATE_EVENT_MAP: Record<string, string> = {
  click: 'tap',
  input: 'input',
  change: 'change',
  focus: 'focus',
  blur: 'blur',
  submit: 'submit',
  touchstart: 'touchstart',
  touchmove: 'touchmove',
  touchend: 'touchend'
}

const SELF_CLOSING_TAGS = [
  'input',
  'image',
  'icon',
  'progress',
  'slider',
  'switch',
  'audio',
  'video',
  'camera',
  'live-player',
  'live-pusher',
  'map',
  'canvas',
  'open-data',
  'web-view'
]

/**
 * 转换 enhanced template AST 节点。
 */
export function transformEnhancedTemplateNode(
  node: any,
  result: TemplateTransformResult,
  context: TransformContext
): string {
  if (!node) return ''

  if (node instanceof TextNode) {
    return transformEnhancedTemplateTextNode(node)
  }

  if (node instanceof HTMLElement && node.tagName) {
    return transformEnhancedTemplateElementNode(node, result, context)
  }

  if (node.childNodes && node.childNodes.length > 0) {
    return node.childNodes
      .map((child: any) => transformEnhancedTemplateNode(child, result, context))
      .join('')
  }

  return ''
}

/**
 * 转换 enhanced template 文本节点。
 */
export function transformEnhancedTemplateTextNode(node: TextNode): string {
  return node.text.replace(/\{\{\{([^}]+)\}\}\}/g, '{{$1}}')
}

/**
 * 转换 enhanced template 元素节点。
 */
export function transformEnhancedTemplateElementNode(
  node: HTMLElement,
  result: TemplateTransformResult,
  context: TransformContext
): string {
  const tagName = transformEnhancedTemplateTagName(getEnhancedTemplateTagName(node))
  const attributes = transformEnhancedTemplateAttributes(node)
  const children = node.childNodes
    .map((child: any) => transformEnhancedTemplateNode(child, result, context))
    .join('')

  if (SELF_CLOSING_TAGS.includes(tagName) && !children.trim()) {
    return `<${tagName}${attributes} />`
  }

  return `<${tagName}${attributes}>${children}</${tagName}>`
}

/**
 * 转换 enhanced template 标签名。
 */
export function transformEnhancedTemplateTagName(tagName: string): string {
  if (/^[A-Z]/.test(tagName)) {
    return toKebabCase(tagName)
  }

  return ENHANCED_TEMPLATE_TAG_MAP[tagName.toLowerCase()] || tagName
}

/**
 * 获取 node-html-parser 保留的原始标签名，避免大写 `tagName` 被误判为组件名。
 */
function getEnhancedTemplateTagName(node: HTMLElement): string {
  return node.rawTagName || node.tagName
}

/**
 * 转换 enhanced template 元素属性。
 */
export function transformEnhancedTemplateAttributes(
  node: HTMLElement
): string {
  const attrs: string[] = []
  let staticClass = ''
  let dynamicClass = ''

  Object.entries(node.attributes || {}).forEach(([name, value]) => {
    if (name === 'class') {
      staticClass = value
    } else if (name === ':class') {
      dynamicClass = value
    } else if (name.startsWith(':')) {
      const propName = name.substring(1)
      attrs.push(`${propName}="{{${value}}}"`)
    } else if (name.startsWith('@')) {
      const eventName = name.substring(1)
      const mappedEvent = mapEnhancedTemplateEventName(eventName)
      attrs.push(`bind:${mappedEvent}="${value}"`)
    } else if (name.startsWith('v-')) {
      const transformed = transformEnhancedTemplateDirective(name, value)
      if (transformed) {
        attrs.push(transformed)
      }
    } else {
      attrs.push(`${name}="${value}"`)
    }
  })

  if (staticClass || dynamicClass) {
    const classAttr = transformEnhancedTemplateClassBinding(staticClass, dynamicClass)
    if (classAttr) {
      attrs.push(classAttr)
    }
  }

  return attrs.length > 0 ? ` ${attrs.join(' ')}` : ''
}

/**
 * 转换 enhanced template class 绑定。
 */
export function transformEnhancedTemplateClassBinding(staticClass: string, dynamicClass: string): string {
  if (!staticClass && !dynamicClass) return ''

  let classExpression = ''

  if (dynamicClass) {
    let dynamicExpression = ''

    if (dynamicClass.trim().startsWith('{') && dynamicClass.trim().endsWith('}')) {
      const objectContent = dynamicClass.trim().slice(1, -1)
      const classConditions = objectContent.split(',').map((condition: string) => {
        const [className, expression] = condition.split(':').map((s: string) => s.trim())
        const cleanClassName = (className || '').replace(/['"]/g, '')
        const cleanExpression = (expression || '').trim()
        return `${cleanExpression} ? '${cleanClassName}' : ''`
      }).filter((condition: string) => !condition.includes("'' ? '' : ''"))

      if (classConditions.length === 1) {
        dynamicExpression = classConditions[0] || ''
      } else if (classConditions.length > 1) {
        dynamicExpression = `(${classConditions.join(' + " " + ')})`
      }
    } else {
      dynamicExpression = dynamicClass
    }

    if (staticClass && dynamicExpression) {
      classExpression = `'${staticClass}' + ' ' + (${dynamicExpression})`
    } else if (dynamicExpression) {
      classExpression = dynamicExpression
    } else {
      classExpression = `'${staticClass}'`
    }
  } else {
    classExpression = `'${staticClass}'`
  }

  return `class="{{${classExpression}}}"`
}

/**
 * 映射 enhanced template 事件名。
 */
export function mapEnhancedTemplateEventName(eventName: string): string {
  return ENHANCED_TEMPLATE_EVENT_MAP[eventName] || eventName
}

/**
 * 转换 enhanced template Vue 指令。
 */
export function transformEnhancedTemplateDirective(name: string, value: string): string | null {
  switch (name) {
    case 'v-if':
      return `wx:if="{{${value}}}"`
    case 'v-else-if':
      return `wx:elif="{{${value}}}"`
    case 'v-else':
      return 'wx:else'
    case 'v-for':
      return transformEnhancedTemplateVFor(value)
    case 'v-show':
      return `hidden="{{!(${value})}}"`
    case 'v-model':
      return transformEnhancedTemplateVModel(value)
    default:
      return null
  }
}

/**
 * 转换 enhanced template v-for 指令。
 */
export function transformEnhancedTemplateVFor(expression: string): string {
  const match = expression.match(/(\w+)(?:\s*,\s*(\w+))?\s+in\s+(.+)/)
  if (match) {
    const [, item, index, list] = match
    return `wx:for="{{${list}}}" wx:for-item="${item}" wx:for-index="${index || 'index'}" wx:key="${item}"`
  }
  return ''
}

/**
 * 转换 enhanced template v-model 指令。
 */
export function transformEnhancedTemplateVModel(expression: string): string {
  return `value="{{${expression}}}" bindinput="_handleInput_${expression.replace(/\./g, '_')}"`
}

/**
 * 转换为 kebab-case。
 */
export function toKebabCase(str: string): string {
  return str.replace(/([A-Z])/g, '-$1').toLowerCase().replace(/^-/, '')
}
