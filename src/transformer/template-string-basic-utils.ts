/**
 * 模板字符串基础纯函数工具。
 */

import { VUE_DIRECTIVE_MAP } from '@/types/index.js'

const TEMPLATE_TAG_MAP: Record<string, string> = {
  div: 'view',
  span: 'text',
  p: 'text',
  img: 'image',
  a: 'navigator',
  ul: 'view',
  li: 'view',
  button: 'button',
  input: 'input',
  textarea: 'textarea',
  select: 'picker',
  option: 'picker-view-column'
}

const AST_EVENT_MAP: Record<string, string> = {
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

const ATTRIBUTE_EVENT_MAP: Record<string, string> = {
  click: 'tap',
  'user-click': 'user-click',
  'send-message': 'send-message'
}

const V_ON_EVENT_MAP: Record<string, string> = {
  click: 'tap'
}

/** 转换 Vue/HTML 标签名为微信小程序标签名。 */
export function transformTemplateTag(tag: string): string {
  return TEMPLATE_TAG_MAP[tag] || tag
}

/** 映射 AST v-on 指令事件名。 */
export function mapAstEventName(eventName: string): string {
  return AST_EVENT_MAP[eventName] || eventName
}

/** 映射字符串 `@event` 事件名。 */
export function mapAttributeEventName(eventName: string): string {
  return ATTRIBUTE_EVENT_MAP[eventName] || eventName
}

/** 映射字符串 `v-on:event` 事件名。 */
export function mapVOnEventName(eventName: string): string {
  return V_ON_EVENT_MAP[eventName] || eventName
}

/** 构造 v-model 输入 handler 名称。 */
export function buildVModelInputHandlerName(expression: string, modifiers: string[] = []): string {
  let inputHandler = '_handleInput'
  if (modifiers.includes('number')) {
    inputHandler = '_handleNumberInput'
  } else if (modifiers.includes('trim')) {
    inputHandler = '_handleTrimInput'
  }

  return `${inputHandler}_${expression.replace(/\./g, '_')}`
}

/** 解析 v-for 表达式。 */
export function parseVForExpression(expression: string): { item: string, index: string, list: string } | undefined {
  const match = expression.match(/(\w+)(?:\s*,\s*(\w+))?\s+in\s+(.+)/)
  if (!match) {
    return undefined
  }

  const [, item, index, list] = match
  return {
    item: item || '',
    index: index || 'index',
    list: list || ''
  }
}

/** 转换基础 Vue 指令名称为小程序指令。 */
export function transformBasicDirectives(wxml: string): string {
  Object.entries(VUE_DIRECTIVE_MAP).forEach(([vueDirective, wxDirective]) => {
    const regex = new RegExp(`\\s${vueDirective}=`, 'g')
    wxml = wxml.replace(regex, ` ${wxDirective}=`)
  })

  return wxml
}

/** 转换基础 Vue/HTML 标签为小程序标签。 */
export function transformBasicTags(wxml: string): string {
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

  return wxml
}

/** 转换 v-model 字符串指令。 */
export function transformVModelDirectives(wxml: string): string {
  return wxml.replace(/v-model="([^"]+)"/g, (_match, expression) => {
    return `value="{{${expression}}}" bindinput="${buildVModelInputHandlerName(expression)}"`
  })
}

/** 转换 v-for 字符串指令。 */
export function transformVForDirectives(wxml: string): string {
  return wxml.replace(/v-for="(\w+)(?:\s*,\s*(\w+))?\s+in\s+([^"]+)"/g, (_match, item, index, list) => {
    return `wx:for="{{${list}}}" wx:for-item="${item}" wx:for-index="${index || 'index'}" wx:key="${item}"`
  })
}

/** 修复自闭合标签语法。 */
export function fixSelfClosingTags(wxml: string): string {
  wxml = wxml.replace(/(<[^>]+)\s\/\s([^>]*>)/g, '$1 $2')

  const selfClosingTags = ['image', 'input', 'icon', 'progress', 'slider', 'switch']
  selfClosingTags.forEach(tag => {
    const regex = new RegExp(`<${tag}([^>]*[^/])>`, 'g')
    wxml = wxml.replace(regex, `<${tag}$1 />`)
  })

  return wxml
}

/** 根据 Vue `:class` 内容生成 WXML 表达式片段。 */
export function buildDynamicClassExpression(dynamicClass: string): string {
  if (dynamicClass.trim().startsWith('{') && dynamicClass.trim().endsWith('}')) {
    const objectContent = dynamicClass.trim().slice(1, -1)
    const classConditions = objectContent.split(',').map((condition: string) => {
      const [className, expression] = condition.split(':').map((s: string) => s.trim())
      const cleanClassName = (className || '').replace(/['"]/g, '')
      const cleanExpression = (expression || '').trim()
      return `${cleanExpression} ? '${cleanClassName}' : ''`
    }).filter((condition: string) => !condition.includes("'' ? '' : ''"))

    if (classConditions.length === 1) {
      return classConditions[0] || ''
    }
    if (classConditions.length > 1) {
      return `(${classConditions.join(' + " " + ')})`
    }
    return ''
  }

  return dynamicClass
}
