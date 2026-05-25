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
  transformBasicTemplateSyntax,
  transformTemplateTag,
  validateWxmlTransformResult
} from './template-string-utils.js'
import {
  collectTemplateComponents,
  createDefaultDirectiveTransformers,
  createTemplateTransformResult,
  renderTemplateElement,
  renderTemplateForBlock,
  renderTemplateIfBranches,
  transformTemplateInterpolationNode,
  transformTemplateTextNode,
  transformVueComponentTagsInTemplate
} from './template-transformer-utils.js'
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
    this.directiveTransformers = createDefaultDirectiveTransformers()
    this.enhancedTransformer = new EnhancedTemplateTransformer()
    this.vueTransformer = new VueTemplateTransformer()
    this.useEnhancedParser = options?.useEnhancedParser ?? false
    this.useASTParser = options?.useASTParser ?? true // 默认使用 AST 解析器
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

      const result = createTemplateTransformResult()

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
      collectTemplateComponents(parseResult.components, result, context)

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
    const tag = transformTemplateTag(node.tag)
    const attrs = this.transformAttributes(node.props || [], result, context)
    const children = this.transformChildren(node.children || [], result, context)

    return renderTemplateElement(tag, attrs, children)
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
   * 转换文本节点
   */
  private transformText(node: any): string {
    return transformTemplateTextNode(node)
  }

  /**
   * 转换插值表达式
   */
  private transformInterpolation(node: any): string {
    return transformTemplateInterpolationNode(node)
  }

  /**
   * 转换 if 节点
   */
  private transformIf(node: any, result: TemplateTransformResult, context: TransformContext): string {
    const branches = node.branches || []
    return renderTemplateIfBranches(
      branches,
      children => this.transformChildren(children, result, context)
    )
  }

  /**
   * 转换 for 节点
   */
  private transformFor(node: any, result: TemplateTransformResult, context: TransformContext): string {
    const source = node.source?.content || ''
    const valueAlias = node.valueAlias?.content || 'item'
    const keyAlias = node.keyAlias?.content || 'index'

    return renderTemplateForBlock(
      source,
      valueAlias,
      keyAlias,
      this.transformChildren(node.children, result, context)
    )
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
    wxml = transformVueComponentTagsInTemplate(wxml, result, context)

    logger.debug(`事件转换前: ${wxml.substring(0, 200)}...`)
    wxml = transformBasicTemplateSyntax(wxml)
    logger.debug(`事件转换后: ${wxml.substring(0, 200)}...`)

    logger.debug(`字符串替换转换完成，转换后模板长度: ${wxml.length}`)
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
    return validateWxmlTransformResult(result)
  }
}
