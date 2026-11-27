/**
 * Vue template transformer AST rendering helpers.
 */

import { parseExpression } from '@babel/parser'
import { isExpression, type Expression } from '@babel/types'
import { recordUnsupportedTemplateFeatures } from '@/utils/index.js'
import type { TransformContext } from '@/types/index.js'
import type { TemplateTransformResult } from './template-transformer.js'
import {
  extractVueTemplateExpression,
  extractWxmlTemplateExpression,
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
import { validateWxmlExpression } from './wxml-expression-utils.js'

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
    case 8: // COMPOUND_EXPRESSION - 复合表达式（混合文本+插值）
      if (node.children && Array.isArray(node.children)) {
        return node.children.map((child: any) => {
          // Vue 编译器用 " + " 字符串表示 JS 拼接，WXML 中不需要
          if (typeof child === 'string') {
            return child === ' + ' ? '' : child
          }
          return transformVueTemplateASTNode(child, result, context)
        }).join('')
      }
      return ''
    case 12: // TEXT_CALL - compileTemplate 包装的文本节点
      if (node.content) {
        return transformVueTemplateASTNode(node.content, result, context)
      }
      return ''
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
    let directive: string
    if (branch.condition) {
      const condition = escapeAttributeExpression(extractWxmlTemplateExpression(branch.condition, context))
      directive = index === 0
        ? `wx:if="{{${condition}}}"`
        : `wx:elif="{{${condition}}}"`
    } else {
      directive = 'wx:else'
    }

    const children = branch.children || []
    // 当只有一个元素节点时，直接在该元素上注入指令
    if (children.length === 1 && children[0].type === 1) {
      const childWxml = renderChild(children[0])
      output += injectAttributeToOpenTag(childWxml, directive)
    } else {
      output += `<block ${directive}>`
      output += children.map(renderChild).join('')
      output += '</block>'
    }
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
  const source = extractWxmlTemplateExpression(node.source, context)
  const valueAlias = node.valueAlias?.loc?.source ?? node.valueAlias?.content ?? 'item'
  const keyAlias = node.keyAlias?.loc?.source ?? node.keyAlias?.content ?? `__fmpIndex${node.loc?.start?.offset ?? 0}`
  if (!/^[\w$]+$/.test(valueAlias) || !/^[\w$]+$/.test(keyAlias)) {
    recordUnsupportedTemplateFeatures(context, 'v-for destructured alias')
    return ''
  }
  const keyExpression = resolveVueTemplateForKeyExpression(node, valueAlias, context)
  const data = context.data?.[source]
  if (node.objectIndexAlias || source.trimStart().startsWith('{') ||
      (data !== null && typeof data === 'object' && !Array.isArray(data))) {
    recordUnsupportedTemplateFeatures(context, 'v-for object enumeration')
    return ''
  }
  const iterable = /^\d+$/.test(source) ? `wxsH.range(${source})` : source
  const key = keyExpression ? ` wx:key="${keyExpression}"` : ''
  const forAttrs = `wx:for="{{${escapeAttributeExpression(iterable)}}}" wx:for-item="${valueAlias}" wx:for-index="${keyAlias}"${key}`

  const children = node.children || []
  // 当只有一个元素节点时，直接在该元素上注入 wx:for 属性
  if (children.length === 1 && children[0].type === 1) {
    const childWxml = renderChild(children[0])
    return injectAttributeToOpenTag(childWxml, forAttrs)
  }

  const childrenWxml = children.map(renderChild).join('')
  return `<block ${forAttrs}>${childrenWxml}</block>`
}

/**
 * 在已渲染的 WXML 字符串的第一个开标签中注入属性。
 */
function injectAttributeToOpenTag(wxml: string, attributes: string): string {
  const match = wxml.match(/^(<[\w-]+)/)
  if (match) {
    return wxml.replace(match[0], `${match[0]} ${attributes}`)
  }
  return `<block ${attributes}>${wxml}</block>`
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
  const html = node.props?.find((prop: any) => prop.type === 7 && prop.name === 'html')
  const children = html?.exp
    ? `<rich-text nodes="{{${escapeAttributeExpression(extractWxmlTemplateExpression(html.exp, context))}}}"></rich-text>`
    : (node.children || []).map(renderChild).join('')

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
      const arg = prop.name === 'bind' ? resolveStaticDirectiveArgument(prop.arg) : undefined
      if (arg === 'style') {
        const legacyStaticStyle = restoreLegacyStaticStyleBinding(prop)
        if (legacyStaticStyle !== null) {
          staticStyle = legacyStaticStyle
        } else {
          dynamicStyle = extractWxmlTemplateExpression(prop.exp, context)
        }
        return
      }

      if (arg === 'class') {
        dynamicClass = extractWxmlTemplateExpression(prop.exp, context)
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
    const style = transformVueTemplateStyleBinding(staticStyle, dynamicStyle, context)
    if (style) attrs.push(style)
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
  const arg = resolveStaticDirectiveArgument(directive.arg)
  const exp = directive.exp && !['on', 'html', 'slot'].includes(name)
    ? extractWxmlTemplateExpression(directive.exp, context)
    : ''

  if (directive.arg?.isStatic === false && !arg && ['bind', 'on', 'model'].includes(name)) {
    recordUnsupportedTemplateFeatures(context, `dynamic v-${name} argument`)
    return null
  }

  switch (name) {
    case 'bind':
      if (!arg) {
        recordUnsupportedTemplateFeatures(context, 'v-bind object spread')
        return null
      }
      if (arg === 'class' || arg === 'key') {
        return null
      }
      return `${mapVueTemplateAttributeName(tagName, arg)}="{{${escapeAttributeExpression(exp || arg)}}}"`

    case 'on': {
      if (!arg) {
        recordUnsupportedTemplateFeatures(context, 'v-on object spread')
        return null
      }
      const modifiers = (directive.modifiers || []).map((mod: any) =>
        typeof mod === 'string' ? mod : mod.content || mod
      )
      const unsupported = modifiers.filter((modifier: string) => !['stop', 'capture'].includes(modifier))
      if (unsupported.length > 0) {
        recordUnsupportedTemplateFeatures(context, ...unsupported.map((modifier: string) => `v-on.${modifier}`))
        return null
      }
      const handler = extractVueTemplateExpression(directive.exp?.loc?.source ?? directive.exp, context)
      const nativeHandler = resolveNativeEventHandler(handler, context)
      return nativeHandler
        ? transformVueTemplateEventHandler(mapVueTemplateEventName(arg), nativeHandler, result, modifiers, isCustomComponentTag(tagName))
        : null
    }

    case 'if':
      return `wx:if="{{${escapeAttributeExpression(exp)}}}"`

    case 'else-if':
      return `wx:elif="{{${escapeAttributeExpression(exp)}}}"`

    case 'else':
      return 'wx:else'

    case 'show':
      return `hidden="{{!(${escapeAttributeExpression(exp)})}}"`

    case 'for':
      return null

    case 'model': {
      const modifiers = (directive.modifiers || []).map((mod: any) =>
        typeof mod === 'string' ? mod : mod.content || mod
      )
      if (!/^[\w$]+(?:\.[\w$]+)*$/.test(exp) || exp === 'null') {
        recordUnsupportedTemplateFeatures(context, 'non-native v-model target')
        return null
      }
      return transformVueTemplateVModel(exp, result, modifiers, tagName, arg)
    }

    case 'html':
      if (!directive.exp) recordUnsupportedTemplateFeatures(context, 'empty v-html')
      return null

    case 'slot':
      return null

    default:
      recordUnsupportedTemplateFeatures(context, `v-${name}`)
      return null
  }
}

function resolveStaticDirectiveArgument(arg: any): string | undefined {
  if (!arg || arg.isStatic !== false) return arg?.content
  const raw = arg.loc?.source
  if (typeof raw !== 'string' || !raw.startsWith('[') || !raw.endsWith(']')) return undefined
  try {
    const literal = parseExpression(raw.slice(1, -1))
    if (literal.type === 'StringLiteral' && /^[\w:-]+$/.test(literal.value)) return literal.value
  } catch {}
  return undefined
}

function resolveNativeEventHandler(handler: string, context: TransformContext): string | null {
  try {
    const expression = parseExpression(handler)
    if (expression.type === 'Identifier') return expression.name
    if (expression.type === 'CallExpression' && expression.callee.type === 'Identifier') {
      if (expression.arguments.length === 1 && expression.arguments[0]?.type === 'Identifier' &&
        expression.arguments[0].name === '$event') return expression.callee.name
      if (expression.arguments.length === 0) return expression.callee.name
      const valid = expression.arguments.every(arg => {
        const source = handler.slice(arg.start ?? 0, arg.end ?? 0)
        return arg.type !== 'SpreadElement' && !/\$event\b/.test(source) &&
          validateWxmlExpression(source, context) === source
      })
      if (valid) return handler.trim()
    }
  } catch {}
  recordUnsupportedTemplateFeatures(context, 'complex v-on handler')
  return null
}

function escapeAttributeExpression(expression: string): string {
  return expression.replace(/"/g, '&quot;')
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
function transformVueTemplateStyleBinding(staticStyle: string, dynamicStyle: string, context: TransformContext): string {
  const segments = [
    staticStyle.trim(),
    formatDynamicStyleExpression(dynamicStyle, context)
  ].filter(Boolean)

  return segments.length ? `style="${joinStyleSegments(segments)}"` : ''
}

function formatDynamicStyleExpression(expression: string, context: TransformContext): string {
  if (!expression.trim()) return ''
  try {
    return renderStyleExpression(parseExpression(expression), expression, context)
  } catch {
    return ''
  }
}

function renderStyleExpression(node: Expression, source: string, context: TransformContext, arrayEntry = false): string {
  if (node.type === 'ArrayExpression') {
    return joinStyleSegments(node.elements.flatMap(element =>
      element && element.type !== 'SpreadElement' ? [renderStyleExpression(element, source, context, true)] : []
    ).filter(Boolean))
  }

  if (node.type === 'StringLiteral') return escapeAttributeExpression(node.value)
  if (node.type === 'NullLiteral') return ''

  if (node.type === 'ObjectExpression') {
    return node.properties.flatMap(property => {
      if (property.type !== 'ObjectProperty' || property.computed || !isExpression(property.value)) return []
      const name = property.key.type === 'Identifier' ? property.key.name
        : property.key.type === 'StringLiteral' ? property.key.value : ''
      if (!/^[-a-zA-Z][\w-]*$/.test(name)) return []
      const cssName = name.replace(/[A-Z]/g, char => `-${char.toLowerCase()}`)
      const value = property.value.type === 'NumericLiteral'
        ? String(property.value.value)
        : renderStyleExpression(property.value, source, context)
      return value ? [`${cssName}: ${value};`] : []
    }).join(' ')
  }

  const value = source.slice(node.start ?? 0, node.end ?? 0)
  if (arrayEntry && typeof context.data?.[value] !== 'string') {
    recordUnsupportedTemplateFeatures(context, 'non-string v-bind:style array entry')
    return ''
  }
  return `{{${escapeAttributeExpression(value)}}}`
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

/** 将 Vue/HTML 源属性名收敛为微信原生属性名。 */
function mapVueTemplateAttributeName(tagName: string | undefined, attrName: string | undefined): string {
  if (tagName === 'a' && attrName === 'href') {
    return 'url'
  }

  return attrName || ''
}
