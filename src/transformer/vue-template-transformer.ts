/**
 * 基于 @vue/compiler-sfc AST 的 Vue 模板转换器
 * 提供精确的 Vue 模板到小程序模板的转换
 */

import { compileTemplate } from '@vue/compiler-sfc'
import { logger } from '@/utils/index.js'
import type { TransformContext } from '@/types/index.js'
import type { TemplateParseResult } from '@/parser/index.js'

// 导入标准的转换结果类型
import type { TemplateTransformResult } from './template-transformer.js'

/**
 * Vue 指令到小程序指令的映射
 */
const DIRECTIVE_MAP = {
  'v-if': 'wx:if',
  'v-else-if': 'wx:elif',
  'v-else': 'wx:else',
  'v-show': 'hidden',
  'v-for': 'wx:for',
  'v-model': 'model:value'
} as const

/**
 * HTML 标签到小程序标签的映射
 */
const TAG_MAP = {
  'div': 'view',
  'span': 'text',
  'p': 'text',
  'img': 'image',
  'a': 'navigator',
  'input': 'input',
  'textarea': 'textarea',
  'button': 'button',
  'form': 'form'
} as const

/**
 * 事件名映射
 */
const EVENT_MAP = {
  'click': 'tap',
  'input': 'input',
  'change': 'change',
  'focus': 'focus',
  'blur': 'blur',
  'submit': 'submit',
  'touchstart': 'touchstart',
  'touchmove': 'touchmove',
  'touchend': 'touchend'
} as const

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
        result.wxml = this.fallbackStringTransform(parseResult.source)
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
        return this.transformInterpolationNode(node)
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
  private transformInterpolationNode(node: any): string {
    if (!node.content) return ''

    // 处理简单表达式 (type: 4)
    if (node.content.type === 4 && node.content.content) {
      let expression = node.content.content
      if (expression.startsWith('_ctx.')) {
        expression = expression.substring(5) // 移除 '_ctx.' 前缀
      }
      return `{{ ${expression} }}`
    }

    // 处理复合表达式 (type: 8)
    if (node.content.type === 8) {
      // 优先使用 loc.source，这是原始的表达式内容
      if (node.content.loc && node.content.loc.source) {
        return `{{ ${node.content.loc.source} }}`
      }

      // 如果没有 loc.source，从子节点中提取表达式
      if (node.content.children) {
        const expressions = node.content.children
          .filter((child: any) => child.type === 4)
          .map((child: any) => child.content)
          .join('')

        if (expressions) {
          return `{{ ${expressions} }}`
        }
      }
    }

    // 如果有 loc.source，直接使用原始源码
    if (node.content.loc && node.content.loc.source) {
      return `{{ ${node.content.loc.source} }}`
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
          const condition = this.extractExpression(branch.condition)
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
    const source = this.extractExpression(node.source)
    const valueAlias = node.valueAlias?.content || 'item'
    const keyAlias = node.keyAlias?.content || 'index'

    let output = `<view wx:for="{{${source}}}" wx:for-item="${valueAlias}" wx:for-index="${keyAlias}" wx:key="${valueAlias}">`

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
    const attributes = this.transformElementProps(node.props || [], result, context)

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
    // 处理 Vue 组件（大写开头）转换为 kebab-case
    if (/^[A-Z]/.test(tagName)) {
      return this.toKebabCase(tagName)
    }

    // HTML 标签映射
    return TAG_MAP[tagName.toLowerCase() as keyof typeof TAG_MAP] || tagName
  }

  /**
   * 转换元素属性
   */
  private transformElementProps(props: any[], result: TemplateTransformResult, context: TransformContext): string {
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
            dynamicClass = this.extractExpression(prop.exp)
          } else {
            const transformed = this.transformDirective(prop, result, context)
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
      const classAttr = this.transformClassBinding(staticClass, dynamicClass)
      if (classAttr) {
        attrs.push(classAttr)
      }
    }

    return attrs.length > 0 ? ' ' + attrs.join(' ') : ''
  }

  /**
   * 转换指令
   */
  private transformDirective(directive: any, result: TemplateTransformResult, context: TransformContext): string | string[] | null {
    const name = directive.name
    const arg = directive.arg?.content
    const exp = directive.exp ? this.extractExpression(directive.exp) : ''

    switch (name) {
      case 'bind':
        if (arg === 'class') {
          // 动态 class 绑定，稍后处理
          return null
        }
        return `${arg}="{{${exp}}}"`

      case 'on':
        const eventName = this.mapEventName(arg)
        return this.transformEventHandler(eventName, exp, result)

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
        return this.transformVModel(exp, result)

      default:
        logger.warn(`未处理的指令: v-${name}`)
        return null
    }
  }

  /**
   * 提取表达式内容并移除 _ctx 前缀
   */
  private extractExpression(exp: any): string {
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

    return expression
  }

  /**
   * 转换 class 绑定
   */
  private transformClassBinding(staticClass: string, dynamicClass: string): string {
    if (!staticClass && !dynamicClass) return ''

    // 如果只有静态 class，直接返回静态值，不需要 {{}}
    if (staticClass && !dynamicClass) {
      return `class="${staticClass}"`
    }

    // 如果有动态 class，需要使用 {{}} 包裹表达式
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
      } else if (dynamicClass.trim().startsWith('[') && dynamicClass.trim().endsWith(']')) {
        // 处理数组语法：['class1', 'class2', condition ? 'class3' : '']
        dynamicExpression = dynamicClass.trim().slice(1, -1)
      } else {
        // 处理简单表达式
        dynamicExpression = dynamicClass
      }

      // 合并静态和动态 class
      if (staticClass && dynamicExpression) {
        classExpression = `'${staticClass}' + ' ' + (${dynamicExpression})`
      } else if (dynamicExpression) {
        classExpression = dynamicExpression
      } else {
        // 如果动态表达式为空，只返回静态 class
        classExpression = `'${staticClass}'`
      }
    }

    return `class="{{${classExpression}}}"`
  }

  /**
   * 映射事件名
   */
  private mapEventName(eventName: string): string {
    return EVENT_MAP[eventName as keyof typeof EVENT_MAP] || eventName
  }

  /**
   * 转换事件处理器，正确处理带参数的函数调用
   */
  private transformEventHandler(eventName: string, expression: string, result: TemplateTransformResult): string | string[] {
    // 检查是否为带参数的函数调用，如 handleMenuClick('about')
    const functionCallMatch = expression.match(/^(\w+)\s*\(\s*(.+)\s*\)$/)

    if (functionCallMatch) {
      const [, functionName, argsString] = functionCallMatch

      // 确保函数名和参数字符串存在
      if (!functionName || !argsString) {
        result.eventHandlers.set(expression, expression)
        return `bind:${eventName}="${expression}"`
      }

      // 解析参数
      const args = this.parseEventArguments(argsString)

      // 生成 data-* 属性和事件绑定
      const dataAttrs: string[] = []
      args.forEach((arg, index) => {
        // 移除引号并生成 data 属性
        const cleanArg = arg.replace(/^['"]|['"]$/g, '')
        dataAttrs.push(`data-arg${index}="${cleanArg}"`)
      })

      // 记录事件处理器
      result.eventHandlers.set(functionName, functionName)

      // 返回事件绑定和数据属性
      const eventBinding = `bind:${eventName}="${functionName}"`

      if (dataAttrs.length > 0) {
        return [eventBinding, ...dataAttrs]
      } else {
        return eventBinding
      }
    } else {
      // 简单的函数名，直接绑定
      result.eventHandlers.set(expression, expression)
      return `bind:${eventName}="${expression}"`
    }
  }

  /**
   * 解析事件参数
   */
  private parseEventArguments(argsString: string): string[] {
    const args: string[] = []
    let current = ''
    let inQuotes = false
    let quoteChar = ''
    let depth = 0

    for (let i = 0; i < argsString.length; i++) {
      const char = argsString[i]

      if (!inQuotes && (char === '"' || char === "'")) {
        inQuotes = true
        quoteChar = char
        current += char
      } else if (inQuotes && char === quoteChar) {
        inQuotes = false
        current += char
      } else if (!inQuotes && char === '(') {
        depth++
        current += char
      } else if (!inQuotes && char === ')') {
        depth--
        current += char
      } else if (!inQuotes && char === ',' && depth === 0) {
        args.push(current.trim())
        current = ''
      } else {
        current += char
      }
    }

    if (current.trim()) {
      args.push(current.trim())
    }

    return args
  }



  /**
   * 转换 v-for 指令
   */
  private transformVFor(expression: string): string[] {
    const match = expression.match(/(\w+)(?:\s*,\s*(\w+))?\s+in\s+(.+)/)
    if (match) {
      const [, item, index, list] = match
      return [
        `wx:for="{{${list}}}"`,
        `wx:for-item="${item}"`,
        `wx:for-index="${index || 'index'}"`,
        `wx:key="${item}"`
      ]
    }
    return [`wx:for="{{${expression}}}"`]
  }

  /**
   * 转换 v-model 指令
   */
  private transformVModel(expression: string, result: TemplateTransformResult): string[] {
    const inputHandler = `_handleInput_${expression.replace(/\./g, '_')}`

    // 记录事件处理器
    result.eventHandlers.set(inputHandler, inputHandler)

    return [
      `value="{{${expression}}}"`,
      `bindinput="${inputHandler}"`
    ]
  }

  /**
   * 转换为 kebab-case
   */
  private toKebabCase(str: string): string {
    return str.replace(/([A-Z])/g, '-$1').toLowerCase().replace(/^-/, '')
  }

  /**
   * 回退到字符串处理
   */
  private fallbackStringTransform(source: string): string {
    logger.warn(`使用字符串回退处理`)

    let wxml = source

    // 基本的标签替换
    const tagReplacements = [
      ['<div', '<view'],
      ['</div>', '</view>'],
      ['<span', '<text'],
      ['</span>', '</text>'],
      ['<img', '<image'],
      ['<p', '<text'],
      ['</p>', '</text>']
    ]

    tagReplacements.forEach(([from, to]) => {
      wxml = wxml.replace(new RegExp(from as string, 'g'), to as string)
    })

    // 基本的指令替换
    wxml = wxml.replace(/\sv-if=/g, ' wx:if=')
    wxml = wxml.replace(/\sv-else-if=/g, ' wx:elif=')
    wxml = wxml.replace(/\sv-else\b/g, ' wx:else')
    wxml = wxml.replace(/\sv-for=/g, ' wx:for=')
    wxml = wxml.replace(/\sv-show=/g, ' hidden=')

    // 事件绑定
    wxml = wxml.replace(/@(\w+)=/g, 'bind:$1=')

    // 属性绑定
    wxml = wxml.replace(/:(\w+)=/g, '$1=')

    return wxml
  }

  /**
   * 完全回退的转换方法
   */
  private async fallbackTransform(parseResult: TemplateParseResult, context: TransformContext): Promise<TemplateTransformResult> {
    logger.warn(`使用完全回退处理: ${context.filename}`)

    const result: TemplateTransformResult = {
      wxml: this.fallbackStringTransform(parseResult.source),
      components: new Set(),
      eventHandlers: new Map()
    }

    return result
  }
}
