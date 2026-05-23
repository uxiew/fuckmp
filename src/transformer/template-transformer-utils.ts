/**
 * TemplateTransformer 轻量工具。
 */

import type { DirectiveTransformer, TransformContext } from '@/types/index.js'
import { logger } from '@/utils/index.js'
import type { TemplateTransformResult } from './template-transformer.js'
import {
  toKebabCase,
  transformVForDirective,
  transformVModelDirective,
  transformVOnDirective
} from './template-string-utils.js'

/**
 * 创建标准 AST 指令转换器集合。
 */
export function createDefaultDirectiveTransformers(): Map<string, DirectiveTransformer> {
  const directiveTransformers = new Map<string, DirectiveTransformer>()

  directiveTransformers.set('v-model', (_node: any, directive: any) => {
    return transformVModelDirective(directive)
  })

  directiveTransformers.set('v-for', (_node: any, directive: any) => {
    return transformVForDirective(directive)
  })

  directiveTransformers.set('v-if', (_node: any, directive: any) => {
    return { 'wx:if': `{{${directive.expression}}}` }
  })

  directiveTransformers.set('v-else-if', (_node: any, directive: any) => {
    return { 'wx:elif': `{{${directive.expression}}}` }
  })

  directiveTransformers.set('v-else', (_node: any, _directive: any) => {
    return { 'wx:else': true }
  })

  directiveTransformers.set('v-show', (_node: any, directive: any) => {
    return { hidden: `{{!(${directive.expression})}}` }
  })

  directiveTransformers.set('v-on', (_node: any, directive: any) => {
    return transformVOnDirective(directive)
  })

  return directiveTransformers
}

/**
 * 转换 fallback 字符串中的 Vue 组件标签，并记录组件使用。
 */
export function transformVueComponentTagsInTemplate(
  wxml: string,
  result: TemplateTransformResult,
  context: TransformContext
): string {
  const componentRegex = /<([A-Z][a-zA-Z0-9]*)((?:\s+[^>]*)?)(\/?)>/g
  const closeTagRegex = /<\/([A-Z][a-zA-Z0-9]*)>/g

  const transformedOpenTags = wxml.replace(componentRegex, (_match, tagName, attributes, selfClosing) => {
    const kebabName = toKebabCase(tagName)

    result.components.add(tagName)
    context.components.set(tagName, `@/components/${tagName}.vue`)

    logger.debug(`转换 Vue 组件: ${tagName} -> ${kebabName}`)

    return `<${kebabName}${attributes}${selfClosing}>`
  })

  return transformedOpenTags.replace(closeTagRegex, (_match, tagName) => {
    const kebabName = toKebabCase(tagName)
    return `</${kebabName}>`
  })
}
