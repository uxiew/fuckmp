/**
 * 模板字符串后处理工具。
 *
 * 这些函数只处理 WXML 字符串，不依赖 TemplateTransformer 实例状态。
 */
import { logger } from '@/utils/index.js'
import {
  buildDynamicClassExpression,
  buildVModelInputHandlerName,
  fixSelfClosingTags,
  mapAstEventName,
  mapAttributeEventName,
  mapVOnEventName,
  parseVForExpression,
  transformBasicDirectives,
  transformBasicTags,
  transformTemplateTag,
  transformVForDirectives,
  transformVModelDirectives
} from './template-string-basic-utils.js'

export { fixSelfClosingTags, transformTemplateTag } from './template-string-basic-utils.js'

/**
 * Template AST 指令转换所需的最小字段。
 */
export interface TemplateDirectiveLike {
  /** 指令表达式，例如 `foo in list` 或 `form.name` */
  expression?: string
  /** 指令参数，例如 `click` */
  arg?: string
  /** 指令修饰符，例如 `capture`、`number`、`trim` */
  modifiers?: string[]
}

/**
 * 转换 AST `v-model` 指令为小程序属性与输入事件。
 */
export function transformVModelDirective(directive: TemplateDirectiveLike): Record<string, any> {
  const expression = directive.expression || 'modelValue'
  const modifiers = directive.modifiers || []

  return {
    value: `{{${expression}}}`,
    bindinput: buildVModelInputHandlerName(expression, modifiers)
  }
}

/**
 * 转换 AST `v-for` 指令为小程序列表渲染属性。
 */
export function transformVForDirective(directive: TemplateDirectiveLike): Record<string, any> {
  const expression = directive.expression
  if (!expression) {
    return {}
  }

  const result = parseVForExpression(expression)
  if (result) {
    const { item, index, list } = result
    return {
      'wx:for': `{{${list}}}`,
      'wx:for-item': item,
      'wx:for-index': index,
      'wx:key': item
    }
  }

  return {}
}

/**
 * 转换 AST `v-on` 指令为小程序事件绑定。
 */
export function transformVOnDirective(directive: TemplateDirectiveLike): Record<string, any> {
  const eventName = directive.arg
  const handler = directive.expression
  const modifiers = directive.modifiers || []
  const mappedEvent = eventName ? mapAstEventName(eventName) : ''
  const bindType = modifiers.includes('capture') ? 'capture-bind:' : 'bind:'

  return {
    [`${bindType}${mappedEvent}`]: handler
  }
}

/**
 * 验证模板转换得到的 WXML 结果。
 */
export function validateWxmlTransformResult(result: { wxml: string }): { valid: boolean; errors: string[] } {
  const errors: string[] = []

  if (!result.wxml.trim()) {
    errors.push('生成的 WXML 为空')
  }

  const openTags = result.wxml.match(/<(\w+)(?:\s[^>]*)?>/g) || []
  const closeTags = result.wxml.match(/<\/(\w+)>/g) || []

  if (openTags.length !== closeTags.length) {
    errors.push('WXML 标签未正确闭合')
  }

  return {
    valid: errors.length === 0,
    errors
  }
}

/**
 * 转换 Vue 属性绑定语法。
 */
export function transformVueBindings(wxml: string): string {
  // 特殊处理动态类绑定：合并静态 class 和动态 :class
  wxml = transformDynamicClassBinding(wxml)

  // 处理 :prop="value" -> prop="{{value}}" (排除已处理的 class)
  wxml = wxml.replace(/:([a-zA-Z-]+)="([^"]*)"/g, (match, prop, value) => {
    if (prop === 'class') {
      // class 已经在 transformDynamicClassBinding 中处理
      return match
    }
    // 如果值已经包含花括号，不要重复添加
    const finalValue = value.includes('{{') ? value : `{{${value}}}`
    logger.debug(`转换属性绑定: :${prop}="${value}" -> ${prop}="${finalValue}"`)
    return `${prop}="${finalValue}"`
  })

  // 处理 v-bind:prop="value" -> prop="{{value}}"
  wxml = wxml.replace(/v-bind:([a-zA-Z-]+)="([^"]*)"/g, (match, prop, value) => {
    if (prop === 'class') {
      // class 已经在 transformDynamicClassBinding 中处理
      return match
    }
    const finalValue = value.includes('{{') ? value : `{{${value}}}`
    logger.debug(`转换 v-bind: v-bind:${prop}="${value}" -> ${prop}="${finalValue}"`)
    return `${prop}="${finalValue}"`
  })

  return wxml
}

/**
 * 转换动态类绑定。
 *
 * 处理同时存在 `class="static"` 和 `:class="dynamic"` 的情况。
 */
export function transformDynamicClassBinding(wxml: string): string {
  // 匹配同时包含静态 class 和动态 :class 的标签
  // 修复正则表达式，允许 class 和 :class 相邻或有其他属性分隔
  const classBindingRegex = /<([a-zA-Z-]+)([^>]*?)\sclass="([^"]*)"([^>]*?):class="([^"]*)"([^>]*)>/g

  wxml = wxml.replace(classBindingRegex, (_match, tagName, beforeClass, staticClass, betweenClass, dynamicClass, afterClass) => {
    logger.debug(`处理动态类绑定: 标签=${tagName}, 静态="${staticClass}", 动态="${dynamicClass}"`)

    const dynamicClassExpression = buildDynamicClassExpression(dynamicClass)
    const combinedClassExpression = staticClass
      ? `'${staticClass}' + ' ' + (${dynamicClassExpression})`
      : dynamicClassExpression

    // 移除 :class 属性，只保留合并后的 class
    const cleanedAfterClass = afterClass.replace(/:class="[^"]*"/, '').trim()
    const result = `<${tagName}${beforeClass} class="{{${combinedClassExpression}}}"${betweenClass}${cleanedAfterClass}>`
    logger.debug(`动态类绑定转换结果: ${result}`)

    return result
  })

  // 处理只有 :class 没有静态 class 的情况
  const dynamicOnlyRegex = /:class="([^"]*)"/g
  wxml = wxml.replace(dynamicOnlyRegex, (_match, dynamicClass) => {
    logger.debug(`处理纯动态类绑定: "${dynamicClass}"`)
    return `class="{{${buildDynamicClassExpression(dynamicClass)}}}"`
  })

  return wxml
}

/**
 * 转换 Vue 事件绑定语法。
 */
export function transformVueEvents(wxml: string): string {
  // 处理 @event.modifier="handler" -> bind:event="handler" (忽略修饰符)
  wxml = wxml.replace(/@([a-zA-Z-]+)(?:\.[a-zA-Z]+)*="([^"]*)"/g, (match, event, handler) => {
    const mappedEvent = mapAttributeEventName(event)
    logger.debug(`转换事件绑定: ${match} -> bind:${mappedEvent}="${handler}"`)

    return `bind:${mappedEvent}="${handler}"`
  })

  // 处理 v-on:event.modifier="handler" -> bind:event="handler"
  wxml = wxml.replace(/v-on:([a-zA-Z-]+)(?:\.[a-zA-Z]+)*="([^"]*)"/g, (match, event, handler) => {
    const mappedEvent = mapVOnEventName(event)
    logger.debug(`转换 v-on: ${match} -> bind:${mappedEvent}="${handler}"`)

    return `bind:${mappedEvent}="${handler}"`
  })

  return wxml
}

/**
 * 执行标准 fallback 字符串模板转换管线。
 */
export function transformBasicTemplateSyntax(template: string): string {
  let wxml = template

  wxml = transformVueBindings(wxml)
  wxml = transformVueEvents(wxml)
  wxml = transformVModelDirectives(wxml)
  wxml = transformVForDirectives(wxml)
  wxml = transformBasicDirectives(wxml)
  wxml = transformBasicTags(wxml)
  wxml = fixSelfClosingTags(wxml)
  wxml = fixTripleBraces(wxml)
  wxml = cleanupWhitespace(wxml)

  return wxml
}

/**
 * 修复三重花括号问题。
 */
export function fixTripleBraces(wxml: string): string {
  return wxml.replace(/\{\{\{([^}]+)\}\}\}/g, '{{$1}}')
}

/**
 * 清理多余的空格和换行。
 */
export function cleanupWhitespace(wxml: string): string {
  return wxml
    .replace(/\n\s*/g, ' ')
    .replace(/\s{2,}/g, ' ')
    .trim()
}

/**
 * 转换为 kebab-case。
 */
export function toKebabCase(str: string): string {
  return str.replace(/([A-Z])/g, '-$1').toLowerCase().replace(/^-/, '')
}

/**
 * 合并静态 class 与动态 class 表达式。
 */
export function buildClassBindingExpression(staticClass: string, dynamicClass: string): string {
  if (dynamicClass) {
    const dynamicClassExpression = buildDynamicClassExpression(dynamicClass)
    return staticClass ? `'${staticClass}' + ' ' + (${dynamicClassExpression})` : dynamicClassExpression
  }

  return staticClass ? `'${staticClass}'` : ''
}
