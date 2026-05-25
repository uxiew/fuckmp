/**
 * TemplateTransformer AST 属性与指令转换工具。
 */

import { VUE_DIRECTIVE_MAP } from '@/types/index.js'
import type { DirectiveTransformer, TransformContext } from '@/types/index.js'
import { buildClassBindingExpression } from './template-string-utils.js'
import type { TemplateTransformResult } from './template-transformer.js'

/**
 * Vue AST 属性节点所需的最小字段。
 */
export interface TemplateAttributeNodeLike {
  type: number
  name: string
  value?: {
    content?: string
  }
  arg?: {
    content?: string
  }
  exp?: {
    content?: string
  }
  modifiers?: string[]
}

/**
 * 转换 Vue AST 属性列表为 WXML 属性字符串，保留旧 class 合并与属性输出顺序。
 */
export function transformTemplateAttributes(
  props: TemplateAttributeNodeLike[],
  directiveTransformers: Map<string, DirectiveTransformer>,
  result: TemplateTransformResult,
  context: TransformContext
): string {
  const attrs: string[] = []
  let staticClass = ''
  let dynamicClass = ''

  // 第一遍：收集静态和动态类
  props.forEach(prop => {
    if (prop.type === 6) { // ATTRIBUTE
      if (prop.name === 'class') {
        staticClass = prop.value?.content || ''
      } else {
        attrs.push(`${prop.name}="${prop.value?.content || ''}"`)
      }
    } else if (prop.type === 7) { // DIRECTIVE
      if (prop.name === 'bind' && prop.arg?.content === 'class') {
        dynamicClass = prop.exp?.content || ''
      } else {
        const transformed = transformTemplateDirective(prop, directiveTransformers, result, context)
        Object.entries(transformed).forEach(([key, value]) => {
          if (typeof value === 'boolean') {
            if (value) attrs.push(key)
          } else {
            attrs.push(`${key}="${value}"`)
          }
        })
      }
    }
  })

  // 处理类绑定
  if (staticClass || dynamicClass) {
    const classExpression = buildClassBindingExpression(staticClass, dynamicClass)
    attrs.push(`class="{{${classExpression}}}"`)
  }

  return attrs.length > 0 ? ' ' + attrs.join(' ') : ''
}

/**
 * 转换单个 Vue AST 指令为 WXML 属性映射。
 */
export function transformTemplateDirective(
  directive: TemplateAttributeNodeLike,
  directiveTransformers: Map<string, DirectiveTransformer>,
  _result: TemplateTransformResult,
  _context: TransformContext
): Record<string, any> {
  const directiveName = directive.name === 'on' ? 'v-on' : `v-${directive.name}`
  const transformer = directiveTransformers.get(directiveName)

  if (transformer) {
    return transformer({}, {
      name: directiveName,
      arg: directive.arg?.content,
      modifiers: directive.modifiers || [],
      expression: directive.exp?.content
    })
  }

  // 默认处理
  const mappedName = VUE_DIRECTIVE_MAP[directiveName as keyof typeof VUE_DIRECTIVE_MAP]
  if (mappedName) {
    return { [mappedName]: `{{${directive.exp?.content || ''}}}` }
  }

  return {}
}
