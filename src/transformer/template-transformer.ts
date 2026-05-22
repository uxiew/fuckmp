/**
 * Template 转换器
 */

import { VUE_DIRECTIVE_MAP } from '@/types/index.js'
import type { TemplateParseResult } from '@/parser/index.js'
import type { TransformContext, DirectiveTransformer } from '@/types/index.js'
import { logger } from '@/utils/index.js'
import { EnhancedTemplateTransformer } from './enhanced-template-transformer.js'
import {
  buildClassBindingExpression,
  toKebabCase,
  transformBasicTemplateSyntax
} from './template-string-utils.js'
import { VueTemplateTransformer } from './vue-template-transformer.js'

/**
 * 模板转换结果
 */
export interface TemplateTransformResult {
  /** 生成的 WXML 代码 */
  wxml: string
  /** 使用的组件列表 */
  components: Set<string>
  /** 生成的事件处理方法 */
  eventHandlers: Map<string, string>
}

/**
 * Template 转换器类
 */
export class TemplateTransformer {
  private directiveTransformers: Map<string, DirectiveTransformer>
  private enhancedTransformer: EnhancedTemplateTransformer
  private vueTransformer: VueTemplateTransformer
  private useEnhancedParser: boolean
  private useASTParser: boolean

  constructor(options?: { useEnhancedParser?: boolean; useASTParser?: boolean }) {
    this.directiveTransformers = new Map()
    this.enhancedTransformer = new EnhancedTemplateTransformer()
    this.vueTransformer = new VueTemplateTransformer()
    this.useEnhancedParser = options?.useEnhancedParser ?? false
    this.useASTParser = options?.useASTParser ?? true // 默认使用 AST 解析器
    this.initDirectiveTransformers()
  }

  /**
   * 初始化指令转换器
   */
  private initDirectiveTransformers(): void {
    // v-model 双向绑定
    this.directiveTransformers.set('v-model', (node: any, directive: any) => {
      return this.transformVModel(node, directive)
    })

    // v-for 列表渲染
    this.directiveTransformers.set('v-for', (node: any, directive: any) => {
      return this.transformVFor(node, directive)
    })

    // v-if 条件渲染
    this.directiveTransformers.set('v-if', (node: any, directive: any) => {
      return { 'wx:if': `{{${directive.expression}}}` }
    })

    // v-else-if 条件渲染
    this.directiveTransformers.set('v-else-if', (node: any, directive: any) => {
      return { 'wx:elif': `{{${directive.expression}}}` }
    })

    // v-else 条件渲染
    this.directiveTransformers.set('v-else', (node: any, directive: any) => {
      return { 'wx:else': true }
    })

    // v-show 显示隐藏
    this.directiveTransformers.set('v-show', (node: any, directive: any) => {
      return { 'hidden': `{{!(${directive.expression})}}` }
    })

    // 事件处理
    this.directiveTransformers.set('v-on', (node: any, directive: any) => {
      return this.transformVOn(node, directive)
    })
  }

  /**
   * 转换模板
   */
  async transformTemplate(
    parseResult: TemplateParseResult,
    context: TransformContext
  ): Promise<TemplateTransformResult> {
    try {
      logger.debug(`转换模板: ${context.filename}`)

      // 优先使用 AST 转换器
      if (this.useASTParser) {
        logger.debug(`使用 Vue AST 模板转换器: ${context.filename}`)
        try {
          return await this.vueTransformer.transformTemplate(parseResult, context)
        } catch (error) {
          logger.warn(`AST 转换器失败，回退到增强转换器: ${context.filename}`, error as Error)
        }
      }

      // 如果启用了增强解析器，优先使用
      if (this.useEnhancedParser) {
        logger.debug(`使用增强模板转换器: ${context.filename}`)
        try {
          return await this.enhancedTransformer.transformTemplate(parseResult, context)
        } catch (error) {
          logger.warn(`增强转换器失败，回退到标准转换器: ${context.filename}`, error as Error)
        }
      }

      const result: TemplateTransformResult = {
        wxml: '',
        components: new Set(),
        eventHandlers: new Map()
      }

      // 如果有 AST，转换 AST
      if (parseResult.ast) {
        result.wxml = this.transformAST(parseResult.ast, result, context)
      } else {
        // 如果没有 AST，使用简单的字符串替换
        // 使用原始模板内容进行转换
        result.wxml = this.transformByStringReplacement(parseResult.source, result, context)
      }

      // 如果转换结果为空，尝试备用方案
      if (!result.wxml.trim()) {
        logger.warn(`模板转换结果为空，使用备用方案: ${context.filename}`)
        logger.debug(`原始模板内容: ${parseResult.source}`)
        result.wxml = this.transformByStringReplacement(parseResult.source, result, context)
        logger.debug(`备用方案转换结果: ${result.wxml}`)
      }

      // 如果仍然为空，生成默认的页面容器
      if (!result.wxml.trim()) {
        logger.warn(`模板转换仍为空，生成默认容器: ${context.filename}`)
        result.wxml = '<view class="page-container"></view>'
      }

      // 收集组件信息
      parseResult.components.forEach(component => {
        result.components.add(component)
        context.components.set(component, `./${component}`)
      })

      logger.debug(`模板转换完成: ${context.filename}`)
      return result

    } catch (error) {
      logger.error(`模板转换失败: ${context.filename}`, error as Error)
      throw error
    }
  }

  /**
   * 转换 AST
   */
  private transformAST(ast: any, result: TemplateTransformResult, context: TransformContext): string {
    return this.transformNode(ast, result, context)
  }

  /**
   * 转换节点
   */
  private transformNode(node: any, result: TemplateTransformResult, context: TransformContext): string {
    if (!node) return ''

    switch (node.type) {
      case 1: // ELEMENT
        return this.transformElement(node, result, context)
      case 2: // TEXT
        return this.transformText(node)
      case 5: // INTERPOLATION
        return this.transformInterpolation(node)
      case 9: // IF
        return this.transformIf(node, result, context)
      case 11: // FOR
        return this.transformFor(node, result, context)
      default:
        return ''
    }
  }

  /**
   * 转换元素节点
   */
  private transformElement(node: any, result: TemplateTransformResult, context: TransformContext): string {
    const tag = this.transformTag(node.tag)
    const attrs = this.transformAttributes(node.props || [], result, context)
    const children = this.transformChildren(node.children || [], result, context)

    // 检查是否为自闭合标签
    const selfClosingTags = ['input', 'image', 'icon', 'progress', 'slider', 'switch', 'audio', 'video', 'camera', 'live-player', 'live-pusher', 'map', 'canvas', 'open-data', 'web-view']
    const isSelfClosing = selfClosingTags.includes(tag)

    if (isSelfClosing) {
      return `<${tag}${attrs} />`
    } else {
      return `<${tag}${attrs}>${children}</${tag}>`
    }
  }

  /**
   * 转换标签名
   */
  private transformTag(tag: string): string {
    // Vue 标签到小程序标签的映射
    const tagMap: Record<string, string> = {
      'div': 'view',
      'span': 'text',
      'p': 'text',
      'img': 'image',
      'a': 'navigator',
      'ul': 'view',
      'li': 'view',
      'button': 'button',
      'input': 'input',
      'textarea': 'textarea',
      'select': 'picker',
      'option': 'picker-view-column'
    }

    return tagMap[tag] || tag
  }

  /**
   * 转换属性
   */
  private transformAttributes(props: any[], result: TemplateTransformResult, context: TransformContext): string {
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
          const transformed = this.transformDirective(prop, result, context)
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
   * 转换指令
   */
  private transformDirective(directive: any, result: TemplateTransformResult, context: TransformContext): Record<string, any> {
    const directiveName = directive.name === 'on' ? 'v-on' : `v-${directive.name}`
    const transformer = this.directiveTransformers.get(directiveName)

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

  /**
   * 转换 v-model
   */
  private transformVModel(node: any, directive: any): Record<string, any> {
    const expression = directive.expression || 'modelValue'
    const modifiers = directive.modifiers || []

    // 根据修饰符生成不同的处理
    let inputHandler = '_handleInput'
    if (modifiers.includes('number')) {
      inputHandler = '_handleNumberInput'
    } else if (modifiers.includes('trim')) {
      inputHandler = '_handleTrimInput'
    }

    return {
      'value': `{{${expression}}}`,
      'bindinput': `${inputHandler}_${expression.replace(/\./g, '_')}`
    }
  }

  /**
   * 转换 v-for
   */
  private transformVFor(node: any, directive: any): Record<string, any> {
    const expression = directive.expression
    const match = expression.match(/(\w+)(?:\s*,\s*(\w+))?\s+in\s+(.+)/)

    if (match) {
      const [, item, index, list] = match
      return {
        'wx:for': `{{${list}}}`,
        'wx:for-item': item,
        'wx:for-index': index || 'index',
        'wx:key': item
      }
    }

    return {}
  }

  /**
   * 转换 v-on
   */
  private transformVOn(node: any, directive: any): Record<string, any> {
    const eventName = directive.arg
    const handler = directive.expression
    const modifiers = directive.modifiers || []

    // 事件名映射
    const eventMap: Record<string, string> = {
      'click': 'tap',
      'input': 'input',
      'change': 'change',
      'focus': 'focus',
      'blur': 'blur',
      'submit': 'submit',
      'touchstart': 'touchstart',
      'touchmove': 'touchmove',
      'touchend': 'touchend'
    }

    const mappedEvent = eventMap[eventName] || eventName
    const bindType = modifiers.includes('capture') ? 'capture-bind:' : 'bind:'

    return {
      [`${bindType}${mappedEvent}`]: handler
    }
  }

  /**
   * 转换文本节点
   */
  private transformText(node: any): string {
    return node.content || ''
  }

  /**
   * 转换插值表达式
   */
  private transformInterpolation(node: any): string {
    return `{{${node.content?.content || ''}}}`
  }

  /**
   * 转换 if 节点
   */
  private transformIf(node: any, result: TemplateTransformResult, context: TransformContext): string {
    const branches = node.branches || []
    let output = ''

    branches.forEach((branch: any, index: number) => {
      if (index === 0) {
        // v-if
        output += `<block wx:if="{{${branch.condition?.content}}}">
          ${this.transformChildren(branch.children, result, context)}
        </block>`
      } else if (branch.condition) {
        // v-else-if
        output += `<block wx:elif="{{${branch.condition.content}}}">
          ${this.transformChildren(branch.children, result, context)}
        </block>`
      } else {
        // v-else
        output += `<block wx:else>
          ${this.transformChildren(branch.children, result, context)}
        </block>`
      }
    })

    return output
  }

  /**
   * 转换 for 节点
   */
  private transformFor(node: any, result: TemplateTransformResult, context: TransformContext): string {
    const source = node.source?.content || ''
    const valueAlias = node.valueAlias?.content || 'item'
    const keyAlias = node.keyAlias?.content || 'index'

    return `<block wx:for="{{${source}}}" wx:for-item="${valueAlias}" wx:for-index="${keyAlias}" wx:key="${keyAlias}">
      ${this.transformChildren(node.children, result, context)}
    </block>`
  }

  /**
   * 转换子节点
   */
  private transformChildren(children: any[], result: TemplateTransformResult, context: TransformContext): string {
    return children.map(child => this.transformNode(child, result, context)).join('')
  }

  /**
   * 通过字符串替换转换（备用方案）
   */
  private transformByStringReplacement(
    template: string,
    result: TemplateTransformResult,
    context: TransformContext
  ): string {
    let wxml = template

    logger.debug(`开始字符串替换转换，原始模板长度: ${template.length}`)

    // 1. 处理 Vue 组件标签（转换为 kebab-case）
    wxml = this.transformVueComponents(wxml, result, context)

    logger.debug(`事件转换前: ${wxml.substring(0, 200)}...`)
    wxml = transformBasicTemplateSyntax(wxml)
    logger.debug(`事件转换后: ${wxml.substring(0, 200)}...`)

    logger.debug(`字符串替换转换完成，转换后模板长度: ${wxml.length}`)
    return wxml
  }

  /**
   * 转换 Vue 组件标签
   */
  private transformVueComponents(wxml: string, result: TemplateTransformResult, context: TransformContext): string {
    // 查找所有的 Vue 组件标签（大写开头的标签）
    const componentRegex = /<([A-Z][a-zA-Z0-9]*)((?:\s+[^>]*)?)(\/?)>/g
    const closeTagRegex = /<\/([A-Z][a-zA-Z0-9]*)>/g

    // 转换开始标签
    wxml = wxml.replace(componentRegex, (match, tagName, attributes, selfClosing) => {
      const kebabName = toKebabCase(tagName)

      // 记录组件使用
      result.components.add(tagName)
      context.components.set(tagName, `@/components/${tagName}.vue`)

      logger.debug(`转换 Vue 组件: ${tagName} -> ${kebabName}`)

      return `<${kebabName}${attributes}${selfClosing}>`
    })

    // 转换结束标签
    wxml = wxml.replace(closeTagRegex, (match, tagName) => {
      const kebabName = toKebabCase(tagName)
      return `</${kebabName}>`
    })

    return wxml
  }

  /**
   * 生成事件处理方法
   */
  generateEventHandlers(result: TemplateTransformResult): string {
    const handlers: string[] = []

    result.eventHandlers.forEach((code, name) => {
      handlers.push(`  ${name}(event) {
    ${code}
  }`)
    })

    return handlers.join(',\n\n')
  }

  /**
   * 验证模板转换结果
   */
  validateTransformResult(result: TemplateTransformResult): { valid: boolean; errors: string[] } {
    const errors: string[] = []

    // 检查 WXML 语法
    if (!result.wxml.trim()) {
      errors.push('生成的 WXML 为空')
    }

    // 检查未闭合的标签
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
}
