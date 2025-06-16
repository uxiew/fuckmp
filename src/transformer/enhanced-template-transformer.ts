/**
 * 增强的模板转换器 - 基于 node-html-parser
 * 提供更精确的 HTML/XML 解析和转换能力
 */

import { parse, HTMLElement, TextNode } from 'node-html-parser'
import { logger } from '@/utils/index.js'
import type { TemplateParseResult, TemplateTransformResult, TransformContext } from '@/types/index.js'

/**
 * 增强的模板转换器类
 */
export class EnhancedTemplateTransformer {
  /**
   * 转换模板
   */
  async transformTemplate(
    parseResult: TemplateParseResult,
    context: TransformContext
  ): Promise<TemplateTransformResult> {
    try {
      logger.debug(`增强模板转换: ${context.filename}`)

      const result: TemplateTransformResult = {
        wxml: '',
        components: new Set(),
        eventHandlers: new Map()
      }

      // 使用 node-html-parser 解析模板
      const root = parse(parseResult.source, {
        lowerCaseTagName: false,
        comment: false,
        blockTextElements: {
          script: false,
          noscript: false,
          style: false,
          pre: false
        }
      })

      // 转换根节点
      result.wxml = this.transformNode(root, result, context)

      // 收集组件信息
      parseResult.components.forEach(component => {
        result.components.add(component)
        context.components.set(component, `./${component}`)
      })

      logger.debug(`增强模板转换完成: ${context.filename}`)
      return result

    } catch (error) {
      logger.error(`增强模板转换失败: ${context.filename}`, error as Error)
      throw error
    }
  }

  /**
   * 转换节点
   */
  private transformNode(node: any, result: TemplateTransformResult, context: TransformContext): string {
    if (!node) return ''

    // 处理文本节点
    if (node instanceof TextNode) {
      return this.transformTextNode(node)
    }

    // 处理元素节点
    if (node instanceof HTMLElement) {
      return this.transformElementNode(node, result, context)
    }

    // 处理子节点
    if (node.childNodes && node.childNodes.length > 0) {
      return node.childNodes
        .map((child: any) => this.transformNode(child, result, context))
        .join('')
    }

    return ''
  }

  /**
   * 转换文本节点
   */
  private transformTextNode(node: TextNode): string {
    let text = node.text

    // 转换 Vue 插值表达式 {{ }} 保持不变，因为小程序也使用相同语法
    // 但需要处理一些特殊情况，如三重花括号
    text = text.replace(/\{\{\{([^}]+)\}\}\}/g, '{{$1}}')

    return text
  }

  /**
   * 转换元素节点
   */
  private transformElementNode(node: HTMLElement, result: TemplateTransformResult, context: TransformContext): string {
    // 转换标签名
    const tagName = this.transformTagName(node.tagName)

    // 转换属性
    const attributes = this.transformAttributes(node, result, context)

    // 转换子节点
    const children = node.childNodes
      .map((child: any) => this.transformNode(child, result, context))
      .join('')

    // 检查是否为自闭合标签
    const selfClosingTags = ['input', 'image', 'icon', 'progress', 'slider', 'switch', 'audio', 'video', 'camera', 'live-player', 'live-pusher', 'map', 'canvas', 'open-data', 'web-view']
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
    // HTML 标签到小程序标签的映射
    const tagMap: Record<string, string> = {
      'div': 'view',
      'span': 'text',
      'img': 'image',
      'p': 'text',
      'a': 'navigator',
      'input': 'input',
      'textarea': 'textarea',
      'button': 'button',
      'form': 'form'
    }

    // 处理 Vue 组件（大写开头）转换为 kebab-case
    if (/^[A-Z]/.test(tagName)) {
      return this.toKebabCase(tagName)
    }

    return tagMap[tagName.toLowerCase()] || tagName
  }

  /**
   * 转换属性
   */
  private transformAttributes(node: HTMLElement, result: TemplateTransformResult, context: TransformContext): string {
    const attrs: string[] = []
    let staticClass = ''
    let dynamicClass = ''

    // 获取所有属性
    const attributes = node.attributes || {}

    // 处理每个属性
    Object.entries(attributes).forEach(([name, value]) => {
      if (name === 'class') {
        staticClass = value
      } else if (name === ':class') {
        dynamicClass = value
      } else if (name.startsWith(':')) {
        // 动态属性绑定 :prop="value" -> prop="{{value}}"
        const propName = name.substring(1)
        attrs.push(`${propName}="{{${value}}}"`)
      } else if (name.startsWith('@')) {
        // 事件绑定 @event="handler" -> bind:event="handler"
        const eventName = name.substring(1)
        const mappedEvent = this.mapEventName(eventName)
        attrs.push(`bind:${mappedEvent}="${value}"`)
      } else if (name.startsWith('v-')) {
        // Vue 指令处理
        const transformed = this.transformDirective(name, value)
        if (transformed) {
          attrs.push(transformed)
        }
      } else {
        // 普通属性
        attrs.push(`${name}="${value}"`)
      }
    })

    // 处理 class 绑定（静态 + 动态）
    if (staticClass || dynamicClass) {
      const classAttr = this.transformClassBinding(staticClass, dynamicClass)
      if (classAttr) {
        attrs.push(classAttr)
      }
    }

    return attrs.length > 0 ? ' ' + attrs.join(' ') : ''
  }

  /**
   * 转换 class 绑定
   */
  private transformClassBinding(staticClass: string, dynamicClass: string): string {
    if (!staticClass && !dynamicClass) return ''

    let classExpression = ''

    if (dynamicClass) {
      // 处理动态 class 表达式
      let dynamicExpression = ''

      // 处理对象语法：{ online: isOnline, active: isActive }
      if (dynamicClass.trim().startsWith('{') && dynamicClass.trim().endsWith('}')) {
        const objectContent = dynamicClass.trim().slice(1, -1)
        const classConditions = objectContent.split(',').map((condition: string) => {
          const [className, expression] = condition.split(':').map((s: string) => s.trim())
          const cleanClassName = (className || '').replace(/['"]/g, '')
          const cleanExpression = (expression || '').trim()
          return `${cleanExpression} ? '${cleanClassName}' : ''`
        }).filter((condition: string) => !condition.includes("'' ? '' : ''"))

        if (classConditions.length === 1) {
          dynamicExpression = classConditions[0] || ''
        } else if (classConditions.length > 1) {
          dynamicExpression = `(${classConditions.join(' + " " + ')})`
        } else {
          dynamicExpression = ''
        }
      } else {
        // 处理数组语法或简单表达式
        dynamicExpression = dynamicClass
      }

      // 合并静态和动态 class
      if (staticClass && dynamicExpression) {
        classExpression = `'${staticClass}' + ' ' + (${dynamicExpression})`
      } else if (dynamicExpression) {
        classExpression = dynamicExpression
      } else {
        classExpression = `'${staticClass}'`
      }
    } else {
      classExpression = `'${staticClass}'`
    }

    return `class="{{${classExpression}}}"`
  }

  /**
   * 映射事件名
   */
  private mapEventName(eventName: string): string {
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

    return eventMap[eventName] || eventName
  }

  /**
   * 转换 Vue 指令
   */
  private transformDirective(name: string, value: string): string | null {
    switch (name) {
      case 'v-if':
        return `wx:if="{{${value}}}"`
      case 'v-else-if':
        return `wx:elif="{{${value}}}"`
      case 'v-else':
        return 'wx:else'
      case 'v-for':
        return this.transformVFor(value)
      case 'v-show':
        return `hidden="{{!(${value})}}"`
      case 'v-model':
        return this.transformVModel(value)
      default:
        return null
    }
  }

  /**
   * 转换 v-for 指令
   */
  private transformVFor(expression: string): string {
    const match = expression.match(/(\w+)(?:\s*,\s*(\w+))?\s+in\s+(.+)/)
    if (match) {
      const [, item, index, list] = match
      return `wx:for="{{${list}}}" wx:for-item="${item}" wx:for-index="${index || 'index'}" wx:key="${item}"`
    }
    return ''
  }

  /**
   * 转换 v-model 指令
   */
  private transformVModel(expression: string): string {
    return `value="{{${expression}}}" bindinput="_handleInput_${expression.replace(/\./g, '_')}"`
  }

  /**
   * 转换为 kebab-case
   */
  private toKebabCase(str: string): string {
    return str.replace(/([A-Z])/g, '-$1').toLowerCase().replace(/^-/, '')
  }
}
