/**
 * Vue template transformer AST rendering helpers.
 */

import { logger } from '@/utils/index.js'
import type { TransformContext } from '@/types/index.js'
import type { TemplateTransformResult } from './template-transformer.js'
import {
  extractVueTemplateExpression,
  isVueTemplateSelfClosingTag,
  mapVueTemplateEventName,
  resolveVueTemplateForKeyExpression,
  transformVueTemplateClassBinding,
  transformVueTemplateEventHandler,
  transformVueTemplateInterpolationNode,
  transformVueTemplateTextNode,
  transformVueTemplateTagName,
  transformVueTemplateVModel
} from './vue-template-node-utils.js'
import { isCustomComponentTag } from './vue-template-node-basic-utils.js'

/**
 * Renders a Vue template AST child node to WXML.
 */
export type VueTemplateChildRenderer = (node: any) => string

/**
 * 转换 Vue template AST 节点。
 */
export function transformVueTemplateASTNode(
  node: any,
  result: TemplateTransformResult,
  context: TransformContext
): string {
  if (!node) return ''

  switch (node.type) {
    case 1: // ELEMENT
      return transformVueTemplateElementNode(
        node,
        result,
        context,
        child => transformVueTemplateASTNode(child, result, context)
      )
    case 2: // TEXT
      return transformVueTemplateTextNode(node)
    case 5: // INTERPOLATION
      return transformVueTemplateInterpolationNode(node, context)
    case 9: // IF
      return transformVueTemplateIfNode(
        node,
        context,
        child => transformVueTemplateASTNode(child, result, context)
      )
    case 11: // FOR
      return transformVueTemplateForNode(
        node,
        context,
        child => transformVueTemplateASTNode(child, result, context)
      )
    case 3: // COMMENT
      return ''
    default:
      if (node.children && Array.isArray(node.children)) {
        return node.children
          .map((child: any) => transformVueTemplateASTNode(child, result, context))
          .join('')
      }
      return ''
  }
}

/**
 * 转换 Vue template v-if / v-else-if / v-else AST 节点。
 */
export function transformVueTemplateIfNode(
  node: any,
  context: TransformContext,
  renderChild: VueTemplateChildRenderer
): string {
  let output = ''

  node.branches?.forEach((branch: any, index: number) => {
    if (branch.condition) {
      const condition = extractVueTemplateExpression(branch.condition, context)
      output += index === 0
        ? `<view wx:if="{{${condition}}}">`
        : `<view wx:elif="{{${condition}}}">`
    } else {
      output += '<view wx:else>'
    }

    output += (branch.children || []).map(renderChild).join('')
    output += '</view>'
  })

  return output
}

/**
 * 转换 Vue template v-for AST 节点。
 */
export function transformVueTemplateForNode(
  node: any,
  context: TransformContext,
  renderChild: VueTemplateChildRenderer
): string {
  const source = extractVueTemplateExpression(node.source, context)
  const valueAlias = node.valueAlias?.content || 'item'
  const keyAlias = node.keyAlias?.content || 'index'
  const keyExpression = resolveVueTemplateForKeyExpression(node, valueAlias, context)
  const children = (node.children || []).map(renderChild).join('')

  return `<view wx:for="{{${source}}}" wx:for-item="${valueAlias}" wx:for-index="${keyAlias}" wx:key="${keyExpression}">${children}</view>`
}

/**
 * 转换 Vue template element AST 节点。
 */
export function transformVueTemplateElementNode(
  node: any,
  result: TemplateTransformResult,
  context: TransformContext,
  renderChild: VueTemplateChildRenderer
): string {
  const staticSlotName = resolveStaticSlotTemplateName(node)
  if (staticSlotName) {
    const slotChildren = (node.children || []).map(renderChild).join('')
    return staticSlotName === 'default'
      ? slotChildren
      : `<view slot="${staticSlotName}">${slotChildren}</view>`
  }

  const tagName = transformVueTemplateTagName(node.tag)
  const attributes = transformVueTemplateElementProps(node.props || [], result, context, node.tag)
  const children = (node.children || []).map(renderChild).join('')

  if (isVueTemplateSelfClosingTag(tagName, children)) {
    return `<${tagName}${attributes} />`
  }

  return `<${tagName}${attributes}>${children}</${tagName}>`
}

/**
 * 解析 `<template #name>` 静态具名 slot 使用。
 *
 * 仅映射微信原生可等价的静态 named/default slot 内容投递；带 slot props 或动态 slot
 * 名的模板仍交给现有 Native-first 降级记录，不在这里生成伪 runtime。
 */
function resolveStaticSlotTemplateName(node: any): string | null {
  if (node.tag !== 'template') return null

  const slotDirective = (node.props || []).find((prop: any) =>
    prop.type === 7 && prop.name === 'slot'
  )

  if (!slotDirective || slotDirective.exp) return null
  if (slotDirective.arg && slotDirective.arg.isStatic === false) return null

  return slotDirective.arg?.content || 'default'
}

/**
 * 转换 Vue template element props AST 列表。
 */
export function transformVueTemplateElementProps(
  props: any[],
  result: TemplateTransformResult,
  context: TransformContext,
  tagName?: string
): string {
  const attrs: string[] = []
  let staticClass = ''
  let dynamicClass = ''
  let staticStyle = ''
  let dynamicStyle = ''

  props.forEach(prop => {
    if (prop.type === 6) {
      if (prop.name === 'class') {
        staticClass = prop.value?.content || ''
      } else if (prop.name === 'style') {
        staticStyle = prop.value?.content || ''
      } else {
        const attrName = mapVueTemplateAttributeName(tagName, prop.name)
        attrs.push(`${attrName}="${prop.value?.content || ''}"`)
      }
      return
    }

    if (prop.type === 7) {
      if (prop.name === 'bind' && prop.arg?.content === 'style') {
        const legacyStaticStyle = restoreLegacyStaticStyleBinding(prop)
        if (legacyStaticStyle !== null) {
          staticStyle = legacyStaticStyle
        } else {
          dynamicStyle = extractVueTemplateExpression(prop.exp, context)
        }
        return
      }

      if (prop.name === 'bind' && prop.arg?.content === 'class') {
        dynamicClass = extractVueTemplateExpression(prop.exp, context)
        return
      }

      const transformed = transformVueTemplateDirective(prop, result, context, tagName)
      if (Array.isArray(transformed)) {
        attrs.push(...transformed)
      } else if (transformed) {
        attrs.push(transformed)
      }
    }
  })

  if (staticClass || dynamicClass) {
    const classAttr = transformVueTemplateClassBinding(staticClass, dynamicClass)
    if (classAttr) {
      attrs.push(classAttr)
    }
  }

  if (staticStyle || dynamicStyle) {
    attrs.push(transformVueTemplateStyleBinding(staticStyle, dynamicStyle))
  }

  return attrs.length > 0 ? ` ${attrs.join(' ')}` : ''
}

/**
 * 转换 Vue template directive AST 节点。
 */
export function transformVueTemplateDirective(
  directive: any,
  result: TemplateTransformResult,
  context: TransformContext,
  tagName?: string
): string | string[] | null {
  const name = directive.name
  const arg = directive.arg?.content
  const exp = directive.exp ? extractVueTemplateExpression(directive.exp, context) : ''

  switch (name) {
    case 'bind':
      if (arg === 'class') {
        return null
      }
      return `${mapVueTemplateAttributeName(tagName, arg)}="{{${exp}}}"`

    case 'on': {
      const eventName = mapVueTemplateEventName(arg)
      const modifiers = (directive.modifiers || []).map((mod: any) =>
        typeof mod === 'string' ? mod : mod.content || mod
      )
      return transformVueTemplateEventHandler(eventName, exp, result, modifiers, isCustomComponentTag(tagName))
    }

    case 'if':
      return `wx:if="{{${exp}}}"`

    case 'else-if':
      return `wx:elif="{{${exp}}}"`

    case 'else':
      return 'wx:else'

    case 'show':
      return `hidden="{{!(${exp})}}"`

    case 'for':
      return null

    case 'model': {
      const modifiers = (directive.modifiers || []).map((mod: any) =>
        typeof mod === 'string' ? mod : mod.content || mod
      )
      return transformVueTemplateVModel(exp, result, modifiers, tagName, arg)
    }

    default:
      logger.warn(`未处理的指令: v-${name}`)
      return null
  }
}

/** Vue compiler 会把静态 style 解析成 bind 指令，这里按原始属性文本恢复。 */
function restoreLegacyStaticStyleBinding(directive: any): string | null {
  if (directive.name !== 'bind') return null

  const arg = directive.arg?.content
  if (arg !== 'style' || directive.rawName) return null

  const rawSource = directive.loc?.source
  if (typeof rawSource !== 'string') return null

  return restoreLegacyWxAttribute(rawSource, arg)
}

function restoreLegacyWxAttribute(rawSource: string, attrName: string): string | null {
  if (!rawSource.trimStart().startsWith(attrName)) return null

  const equalIndex = rawSource.indexOf('=')
  if (equalIndex === -1) return null

  const valueSource = rawSource.slice(equalIndex + 1).trim()
  const quote = valueSource[0]
  if ((quote !== '"' && quote !== "'") || valueSource[valueSource.length - 1] !== quote) {
    return null
  }

  return valueSource.slice(1, -1)
}

/**
 * 合并静态 style 与 Vue `:style` 对象字面量，避免输出 `style="{{{...}}}"`。
 */
function transformVueTemplateStyleBinding(staticStyle: string, dynamicStyle: string): string {
  const segments = [
    staticStyle.trim(),
    formatDynamicStyleExpression(dynamicStyle)
  ].filter(Boolean)

  return `style="${joinStyleSegments(segments)}"`
}

function formatDynamicStyleExpression(expression: string): string {
  const trimmed = expression.trim()
  if (!trimmed) return ''

  if (trimmed.startsWith('{') && trimmed.endsWith('}')) {
    const declarations = splitTopLevel(trimmed.slice(1, -1), ',')
      .map(propertySource => formatObjectStyleProperty(propertySource))
      .filter((declaration): declaration is string => Boolean(declaration))

    if (declarations.length > 0) {
      return declarations.join(' ')
    }
  }

  return `{{${trimmed}}}`
}

function formatObjectStyleProperty(propertySource: string): string | null {
  const separatorIndex = findTopLevelSeparator(propertySource, ':')
  if (separatorIndex === -1) return null

  const propertyName = normalizeCssPropertyName(propertySource.slice(0, separatorIndex))
  const propertyValue = propertySource.slice(separatorIndex + 1).trim()
  if (!propertyName || !propertyValue) return null

  return `${propertyName}: ${formatStyleValue(propertyValue)};`
}

function joinStyleSegments(segments: string[]): string {
  return segments
    .map((segment, index) => {
      const trimmed = segment.trim()
      if (index < segments.length - 1 && trimmed && !trimmed.endsWith(';')) {
        return `${trimmed};`
      }
      return trimmed
    })
    .join(' ')
}

function normalizeCssPropertyName(propertyName: string): string {
  const unquoted = stripQuotes(propertyName.trim())
  return unquoted.replace(/[A-Z]/g, char => `-${char.toLowerCase()}`)
}

function formatStyleValue(value: string): string {
  const trimmed = value.trim()
  if (isQuotedStringLiteral(trimmed)) {
    return stripQuotes(trimmed)
  }

  if (/^-?\d+(?:\.\d+)?$/.test(trimmed)) {
    return trimmed
  }

  return `{{${trimmed}}}`
}

function splitTopLevel(source: string, separator: string): string[] {
  const parts: string[] = []
  let current = ''
  let quote = ''
  let depth = 0

  for (let i = 0; i < source.length; i++) {
    const char = source.charAt(i)

    if (quote) {
      current += char
      if (char === quote && source.charAt(i - 1) !== '\\') {
        quote = ''
      }
      continue
    }

    if (char === '\'' || char === '"') {
      quote = char
      current += char
      continue
    }

    if (char === '(' || char === '[' || char === '{') {
      depth += 1
      current += char
      continue
    }

    if (char === ')' || char === ']' || char === '}') {
      depth -= 1
      current += char
      continue
    }

    if (char === separator && depth === 0) {
      parts.push(current.trim())
      current = ''
      continue
    }

    current += char
  }

  if (current.trim()) {
    parts.push(current.trim())
  }

  return parts
}

function findTopLevelSeparator(source: string, separator: string): number {
  let quote = ''
  let depth = 0

  for (let i = 0; i < source.length; i++) {
    const char = source.charAt(i)

    if (quote) {
      if (char === quote && source.charAt(i - 1) !== '\\') {
        quote = ''
      }
      continue
    }

    if (char === '\'' || char === '"') {
      quote = char
      continue
    }

    if (char === '(' || char === '[' || char === '{') {
      depth += 1
      continue
    }

    if (char === ')' || char === ']' || char === '}') {
      depth -= 1
      continue
    }

    if (char === separator && depth === 0) {
      return i
    }
  }

  return -1
}

function isQuotedStringLiteral(value: string): boolean {
  if (value.length < 2) return false
  const quote = value.charAt(0)
  return (quote === '\'' || quote === '"') && value.charAt(value.length - 1) === quote
}

function stripQuotes(value: string): string {
  return isQuotedStringLiteral(value) ? value.slice(1, -1) : value
}

/** 将 Vue/HTML 源属性名收敛为微信原生属性名。 */
function mapVueTemplateAttributeName(tagName: string | undefined, attrName: string | undefined): string {
  if (tagName === 'a' && attrName === 'href') {
    return 'url'
  }

  return attrName || ''
}
