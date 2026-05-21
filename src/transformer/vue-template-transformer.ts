/**
 * 基于 @vue/compiler-sfc AST 的 Vue 模板转换器
 * 提供精确的 Vue 模板到小程序模板的转换
 */

import { compileTemplate } from '@vue/compiler-sfc'
import { recordUnsupportedTemplateCapabilities, logger } from '@/utils/index.js'
import type { TransformContext } from '@/types/index.js'
import type { TemplateParseResult } from '@/parser/index.js'
import { applyPropAccessMappingsToTemplate } from './prop-access-mapping.js'
import {
  mapVueTemplateEventName,
  transformVueTemplateClassBinding,
  transformVueTemplateEventHandler,
  transformVueTemplateFallbackString,
  transformVueTemplateTagName,
  transformVueTemplateVModel
} from './vue-template-node-utils.js'

// 导入标准的转换结果类型
import type { TemplateTransformResult } from './template-transformer.js'

/**
 * Vue 模板转换器 - 基于 AST 精确操作
 */
export class VueTemplateTransformer {
  /**
   * 转换模板
   */
  async transformTemplate(
    parseResult: TemplateParseResult,
    context: TransformContext
  ): Promise<TemplateTransformResult> {
    try {
      logger.debug(`Vue AST 模板转换: ${context.filename}`)

      const result: TemplateTransformResult = {
        wxml: '',
        components: new Set(),
        eventHandlers: new Map()
      }

      recordUnsupportedTemplateCapabilities(parseResult.source, context)

      // 使用 @vue/compiler-sfc 编译模板获取 AST
      const compiledTemplate = compileTemplate({
        source: parseResult.source,
        filename: context.filename,
        id: context.filename,
        compilerOptions: {
          mode: 'module',
          prefixIdentifiers: false,
          hoistStatic: false,
          cacheHandlers: false
        }
      })

      if (compiledTemplate.errors.length > 0) {
        logger.warn(`Vue 模板编译警告: ${compiledTemplate.errors.join(', ')}`)
      }

      // 从编译结果中提取 AST
      if (compiledTemplate.ast) {
        result.wxml = this.transformASTNode(compiledTemplate.ast, result, context)
      } else {
        // 如果没有 AST，回退到字符串处理
        logger.warn(`无法获取 AST，使用字符串处理: ${context.filename}`)
        result.wxml = transformVueTemplateFallbackString(parseResult.source)
      }

      // 收集组件信息
      parseResult.components.forEach((component: string) => {
        result.components.add(component)
        context.components.set(component, `./${component}`)
      })

      logger.debug(`Vue AST 模板转换完成: ${context.filename}`)
      return result

    } catch (error) {
      logger.error(`Vue AST 模板转换失败: ${context.filename}`, error as Error)
      // 回退到字符串处理
      return this.fallbackTransform(parseResult, context)
    }
  }

  /**
   * 转换 AST 节点
   */
  private transformASTNode(node: any, result: TemplateTransformResult, context: TransformContext): string {
    if (!node) return ''
    switch (node.type) {
      case 1: // ELEMENT
        return this.transformElementNode(node, result, context)
      case 2: // TEXT
        return this.transformTextNode(node)
      case 5: // INTERPOLATION (插值表达式)
        return this.transformInterpolationNode(node, context)
      case 9: // IF
        return this.transformIfNode(node, result, context)
      case 11: // FOR
        return this.transformForNode(node, result, context)
      case 3: // COMMENT
        return '' // 忽略注释
      default:
        // 处理子节点
        if (node.children && Array.isArray(node.children)) {
          return node.children
            .map((child: any) => this.transformASTNode(child, result, context))
            .join('')
        }
        return ''
    }
  }

  /**
   * 转换文本节点
   */
  private transformTextNode(node: any): string {
    return node.content || ''
  }

  /**
   * 转换插值表达式节点
   */
  private transformInterpolationNode(node: any, context: TransformContext): string {
    if (!node.content) return ''

    // 处理简单表达式 (type: 4)
    if (node.content.type === 4 && node.content.content) {
      let expression = node.content.content
      if (expression.startsWith('_ctx.')) {
        expression = expression.substring(5) // 移除 '_ctx.' 前缀
      }
      expression = this.applyPropAliases(expression, context)
      return `{{${expression}}}`
    }

    // 处理复合表达式 (type: 8)
    if (node.content.type === 8) {
      // 优先使用 loc.source，这是原始的表达式内容
      if (node.content.loc && node.content.loc.source) {
        return `{{${this.applyPropAliases(node.content.loc.source, context)}}}`
      }

      // 如果没有 loc.source，从子节点中提取表达式
      if (node.content.children) {
        const expressions = node.content.children
          .filter((child: any) => child.type === 4)
          .map((child: any) => child.content)
          .join('')

        if (expressions) {
          return `{{${this.applyPropAliases(expressions, context)}}}`
        }
      }
    }

    // 如果有 loc.source，直接使用原始源码
    if (node.content.loc && node.content.loc.source) {
      return `{{${this.applyPropAliases(node.content.loc.source, context)}}}`
    }

    return ''
  }

  /**
   * 转换 v-if 节点
   */
  private transformIfNode(node: any, result: TemplateTransformResult, context: TransformContext): string {
    let output = ''

    // 处理 v-if 分支
    if (node.branches) {
      node.branches.forEach((branch: any, index: number) => {
        if (branch.condition) {
          const condition = this.extractExpression(branch.condition, context)
          if (index === 0) {
            // v-if
            output += `<view wx:if="{{${condition}}}">`
          } else {
            // v-else-if
            output += `<view wx:elif="{{${condition}}}">`
          }
        } else {
          // v-else
          output += `<view wx:else>`
        }

        // 转换分支内容
        if (branch.children) {
          output += branch.children
            .map((child: any) => this.transformASTNode(child, result, context))
            .join('')
        }

        output += '</view>'
      })
    }

    return output
  }

  /**
   * 转换 v-for 节点
   */
  private transformForNode(node: any, result: TemplateTransformResult, context: TransformContext): string {
    const source = this.extractExpression(node.source, context)
    const valueAlias = node.valueAlias?.content || 'item'
    const keyAlias = node.keyAlias?.content || 'index'

    // 查找原始元素的 :key 属性
    let keyExpression = valueAlias // 默认使用 item 变量
    if (node.children && node.children.length > 0) {
      const firstChild = node.children[0]
      if (firstChild && firstChild.props) {
        const keyProp = firstChild.props.find((prop: any) =>
          prop.type === 7 && prop.name === 'bind' && prop.arg?.content === 'key'
        )
        if (keyProp && keyProp.exp) {
          const fullKeyExpression = this.extractExpression(keyProp.exp, context)
          // 智能提取 key 属性名
          // 如果是 item.id 形式，提取 id 部分
          if (fullKeyExpression.includes('.')) {
            const parts = fullKeyExpression.split('.')
            if (parts.length === 2 && parts[0] === valueAlias) {
              keyExpression = parts[1]
            } else {
              keyExpression = fullKeyExpression
            }
          } else {
            keyExpression = fullKeyExpression
          }
        }
      }
    }

    let output = `<view wx:for="{{${source}}}" wx:for-item="${valueAlias}" wx:for-index="${keyAlias}" wx:key="${keyExpression}">`

    // 转换子节点
    if (node.children) {
      output += node.children
        .map((child: any) => this.transformASTNode(child, result, context))
        .join('')
    }

    output += '</view>'
    return output
  }

  /**
   * 转换元素节点
   */
  private transformElementNode(node: any, result: TemplateTransformResult, context: TransformContext): string {
    // 转换标签名
    const tagName = this.transformTagName(node.tag)

    // 转换属性
    const attributes = this.transformElementProps(node.props || [], result, context, node.tag)

    // 转换子节点
    const children = (node.children || [])
      .map((child: any) => this.transformASTNode(child, result, context))
      .join('')

    // 检查是否为自闭合标签
    const selfClosingTags = ['input', 'image', 'icon', 'progress', 'slider', 'switch']
    const isSelfClosing = selfClosingTags.includes(tagName) && !children.trim()

    if (isSelfClosing) {
      return `<${tagName}${attributes} />`
    } else {
      return `<${tagName}${attributes}>${children}</${tagName}>`
    }
  }

  /**
   * 转换标签名
   */
  private transformTagName(tagName: string): string {
    return transformVueTemplateTagName(tagName)
  }

  /**
   * 转换元素属性
   */
  private transformElementProps(props: any[], result: TemplateTransformResult, context: TransformContext, tagName?: string): string {
    const attrs: string[] = []
    let staticClass = ''
    let dynamicClass = ''

    props.forEach(prop => {
      switch (prop.type) {
        case 6: // ATTRIBUTE (静态属性)
          if (prop.name === 'class') {
            staticClass = prop.value?.content || ''
          } else {
            attrs.push(`${prop.name}="${prop.value?.content || ''}"`)
          }
          break

        case 7: // DIRECTIVE (指令)
          // 特殊处理 :class 指令
          if (prop.name === 'bind' && prop.arg?.content === 'class') {
            dynamicClass = this.extractExpression(prop.exp, context)
          } else {
            const transformed = this.transformDirective(prop, result, context, tagName)
            if (transformed) {
              if (Array.isArray(transformed)) {
                attrs.push(...transformed)
              } else {
                attrs.push(transformed)
              }
            }
          }
          break
      }
    })

    // 处理 class 绑定
    if (staticClass || dynamicClass) {
      const classAttr = transformVueTemplateClassBinding(staticClass, dynamicClass)
      if (classAttr) {
        attrs.push(classAttr)
      }
    }

    return attrs.length > 0 ? ' ' + attrs.join(' ') : ''
  }

  /**
   * 转换指令
   */
  private transformDirective(directive: any, result: TemplateTransformResult, context: TransformContext, tagName?: string): string | string[] | null {
    const name = directive.name
    const arg = directive.arg?.content
    const exp = directive.exp ? this.extractExpression(directive.exp, context) : ''

    switch (name) {
      case 'bind':
        if (arg === 'class') {
          // 动态 class 绑定，稍后处理
          return null
        }
        return `${arg}="{{${exp}}}"`

      case 'on':
        const eventName = mapVueTemplateEventName(arg)
        return transformVueTemplateEventHandler(eventName, exp, result)

      case 'if':
        return `wx:if="{{${exp}}}"`

      case 'else-if':
        return `wx:elif="{{${exp}}}"`

      case 'else':
        return 'wx:else'

      case 'show':
        return `hidden="{{!(${exp})}}"`

      case 'for':
        // v-for 在 transformForNode 中处理
        return null

      case 'model':
        // 提取修饰符的 content 属性
        const modifiers = (directive.modifiers || []).map((mod: any) =>
          typeof mod === 'string' ? mod : mod.content || mod
        )
        return transformVueTemplateVModel(exp, result, modifiers, tagName, arg)

      default:
        logger.warn(`未处理的指令: v-${name}`)
        return null
    }
  }

  /**
   * 提取表达式内容并移除 _ctx 前缀
   */
  private extractExpression(exp: any, context?: TransformContext): string {
    let expression = ''

    if (typeof exp === 'string') {
      expression = exp
    } else if (exp && exp.content) {
      expression = exp.content
    } else if (exp && exp.loc && exp.loc.source) {
      expression = exp.loc.source
    }

    // 移除 _ctx. 前缀
    if (expression.startsWith('_ctx.')) {
      expression = expression.substring(5)
    }

    return this.applyPropAliases(expression, context)
  }

  /**
   * 将 Vue 3.5 props 解构局部别名还原为原生小程序 property 名。
   */
  private applyPropAliases(expression: string, context?: TransformContext): string {
    return applyPropAccessMappingsToTemplate(expression, context)
  }

  /**
   * 完全回退的转换方法
   */
  private async fallbackTransform(parseResult: TemplateParseResult, context: TransformContext): Promise<TemplateTransformResult> {
    logger.warn(`使用完全回退处理: ${context.filename}`)

    const result: TemplateTransformResult = {
      wxml: transformVueTemplateFallbackString(parseResult.source),
      components: new Set(),
      eventHandlers: new Map()
    }

    return result
  }
}
