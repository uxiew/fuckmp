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

  props.forEach(prop => {
    if (prop.type === 6) {
      if (prop.name === 'class') {
        staticClass = prop.value?.content || ''
      } else {
        attrs.push(`${prop.name}="${prop.value?.content || ''}"`)
      }
      return
    }

    if (prop.type === 7) {
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
      return `${arg}="{{${exp}}}"`

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
