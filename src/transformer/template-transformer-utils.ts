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

const SELF_CLOSING_TEMPLATE_TAGS = [
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
] as const

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
 * 创建标准模板转换结果对象。
 */
export function createTemplateTransformResult(): TemplateTransformResult {
  return {
    wxml: '',
    components: new Set(),
    eventHandlers: new Map()
  }
}

/**
 * 按旧规则收集模板解析阶段识别出的组件依赖。
 */
export function collectTemplateComponents(
  components: Iterable<string>,
  result: TemplateTransformResult,
  context: TransformContext
): void {
  for (const component of components) {
    result.components.add(component)
    context.components.set(component, `./${component}`)
  }
}

/**
 * 渲染元素节点，保留旧自闭合标签列表与输出格式。
 */
export function renderTemplateElement(tag: string, attrs: string, children: string): string {
  if ((SELF_CLOSING_TEMPLATE_TAGS as readonly string[]).includes(tag)) {
    return `<${tag}${attrs} />`
  }

  return `<${tag}${attrs}>${children}</${tag}>`
}

/**
 * 转换文本节点。
 */
export function transformTemplateTextNode(node: any): string {
  return node.content || ''
}

/**
 * 转换插值节点。
 */
export function transformTemplateInterpolationNode(node: any): string {
  return `{{${node.content?.content || ''}}}`
}

/**
 * 渲染 v-for block，保留旧换行和缩进格式。
 */
export function renderTemplateForBlock(
  source: string,
  valueAlias: string,
  keyAlias: string,
  children: string
): string {
  return `<block wx:for="{{${source}}}" wx:for-item="${valueAlias}" wx:for-index="${keyAlias}" wx:key="${keyAlias}">
      ${children}
    </block>`
}

/**
 * 渲染 v-if / v-else-if / v-else 分支，保留旧换行和缩进格式。
 */
export function renderTemplateIfBranches(
  branches: any[],
  renderChildren: (children: any[]) => string
): string {
  let output = ''

  branches.forEach((branch: any, index: number) => {
    if (index === 0) {
      output += `<block wx:if="{{${branch.condition?.content}}}">
          ${renderChildren(branch.children)}
        </block>`
    } else if (branch.condition) {
      output += `<block wx:elif="{{${branch.condition.content}}}">
          ${renderChildren(branch.children)}
        </block>`
    } else {
      output += `<block wx:else>
          ${renderChildren(branch.children)}
        </block>`
    }
  })

  return output
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
