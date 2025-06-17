/**
 * 响应式数据转换插件
 * 处理 ref、reactive、computed 等响应式API
 */

import { BaseTransformPlugin } from '../base/transform-plugin'
import type { TransformResult } from '../base/transform-plugin'
import type { ASTNode } from '../../types/ast'
import type { TransformContext } from '../../types/compiler'

export class ReactivePlugin extends BaseTransformPlugin {
  readonly name = 'reactive-plugin'
  readonly version = '1.0.0'
  readonly priority = 100

  supports(node: ASTNode, _context: TransformContext): boolean {
    // 支持 ref、reactive、computed 调用
    return this.isReactiveAPI(node, 'any') ||
      this.isVueMacro(node, 'ref') ||
      this.isVueMacro(node, 'reactive') ||
      this.isVueMacro(node, 'computed')
  }

  async transform(node: ASTNode, context: TransformContext): Promise<TransformResult> {
    try {
      if (!this.supports(node, context)) {
        return this.createUnhandledResult()
      }

      const calleeName = node.callee?.name

      switch (calleeName) {
        case 'ref':
          return this.transformRef(node, context)
        case 'reactive':
          return this.transformReactive(node, context)
        case 'computed':
          return this.transformComputed(node, context)
        default:
          return this.createUnhandledResult()
      }
    } catch (error) {
      return this.createErrorResult(`响应式转换失败: ${(error as Error).message}`)
    }
  }

  /**
   * 转换 ref 调用
   */
  private transformRef(node: ASTNode, context: TransformContext): TransformResult {
    const args = node.arguments || []

    if (args.length === 0) {
      // ref() 无参数，默认值为 null
      return this.createSuccessResult('null', {
        data: { ...context.data }
      })
    }

    const initialValue = this.extractValue(args[0])

    this.debug('转换 ref', { initialValue })

    return this.createSuccessResult(JSON.stringify(initialValue), {
      data: { ...context.data }
    })
  }

  /**
   * 转换 reactive 调用
   */
  private transformReactive(node: ASTNode, context: TransformContext): TransformResult {
    const args = node.arguments || []

    if (args.length === 0) {
      return this.createErrorResult('reactive() 需要一个参数')
    }

    const initialValue = this.extractValue(args[0])

    if (typeof initialValue !== 'object' || initialValue === null) {
      return this.createWarningResult(
        'reactive() 参数应该是一个对象',
        JSON.stringify(initialValue)
      )
    }

    this.debug('转换 reactive', { initialValue })

    return this.createSuccessResult(JSON.stringify(initialValue), {
      data: { ...context.data }
    })
  }

  /**
   * 转换 computed 调用
   */
  private transformComputed(node: ASTNode, context: TransformContext): TransformResult {
    const args = node.arguments || []

    if (args.length === 0) {
      return this.createErrorResult('computed() 需要一个getter函数')
    }

    const getter = args[0]
    let getterCode = ''

    if (getter.type === 'ArrowFunctionExpression') {
      getterCode = this.transformArrowFunction(getter)
    } else if (getter.type === 'FunctionExpression') {
      getterCode = this.transformFunction(getter)
    } else {
      return this.createErrorResult('computed() 参数必须是一个函数')
    }

    this.debug('转换 computed', { getterCode })

    return this.createSuccessResult(getterCode, {
      computed: { ...context.computed }
    })
  }

  /**
   * 提取节点值
   */
  private extractValue(node: ASTNode): any {
    switch (node.type) {
      case 'Literal':
        return node.value
      case 'StringLiteral':
        return node.value
      case 'NumericLiteral':
        return node.value
      case 'BooleanLiteral':
        return node.value
      case 'NullLiteral':
        return null
      case 'ObjectExpression':
        return this.extractObjectValue(node)
      case 'ArrayExpression':
        return this.extractArrayValue(node)
      case 'NewExpression':
        return this.extractNewExpression(node)
      default:
        this.warn('未知的节点类型', { type: node.type })
        return null
    }
  }

  /**
   * 提取对象表达式的值
   */
  private extractObjectValue(node: ASTNode): Record<string, any> {
    const result: Record<string, any> = {}

    if (node.properties) {
      for (const prop of node.properties) {
        if (prop.type === 'ObjectProperty' || prop.type === 'Property') {
          const key = this.extractPropertyKey(prop.key)
          const value = this.extractValue(prop.value)
          if (key !== null) {
            result[key] = value
          }
        }
      }
    }

    return result
  }

  /**
   * 提取数组表达式的值
   */
  private extractArrayValue(node: ASTNode): any[] {
    const result: any[] = []

    if (node.elements) {
      for (const element of node.elements) {
        if (element) {
          result.push(this.extractValue(element))
        } else {
          result.push(null) // 稀疏数组
        }
      }
    }

    return result
  }

  /**
   * 提取 new 表达式
   */
  private extractNewExpression(node: ASTNode): string {
    const calleeName = node.callee?.name || 'Unknown'
    const args = node.arguments || []
    const argStrings = args.map((arg: any) => {
      if (arg.type === 'Literal' || arg.type === 'StringLiteral') {
        return JSON.stringify(arg.value)
      }
      return 'undefined'
    })

    return `new ${calleeName}(${argStrings.join(', ')})`
  }

  /**
   * 提取属性键
   */
  private extractPropertyKey(keyNode: ASTNode): string | null {
    if (keyNode.type === 'Identifier') {
      return keyNode.name
    }
    if (keyNode.type === 'Literal' || keyNode.type === 'StringLiteral') {
      return String(keyNode.value)
    }
    return null
  }

  /**
   * 转换箭头函数
   */
  private transformArrowFunction(node: ASTNode): string {
    const params = node.params?.map((p: any) => p.name).join(', ') || ''
    const body = this.transformFunctionBody(node.body)

    if (node.body?.type === 'BlockStatement') {
      return `function(${params}) ${body}`
    } else {
      return `function(${params}) { return ${body} }`
    }
  }

  /**
   * 转换普通函数
   */
  private transformFunction(node: ASTNode): string {
    const params = node.params?.map((p: any) => p.name).join(', ') || ''
    const body = this.transformFunctionBody(node.body)

    return `function(${params}) ${body}`
  }

  /**
   * 转换函数体
   */
  private transformFunctionBody(bodyNode: ASTNode): string {
    if (!bodyNode) return '{}'

    if (bodyNode.type === 'BlockStatement') {
      // 这里需要更复杂的AST转换逻辑
      // 暂时返回占位符，后续可以扩展
      return '{ /* 函数体转换 */ }'
    } else {
      // 表达式体
      return this.transformExpression(bodyNode)
    }
  }

  /**
   * 转换表达式
   */
  private transformExpression(node: ASTNode): string {
    switch (node.type) {
      case 'BinaryExpression':
        const left = this.transformExpression(node.left)
        const right = this.transformExpression(node.right)
        return `${left} ${node.operator} ${right}`
      case 'MemberExpression':
        const object = this.transformExpression(node.object)
        const property = node.computed ?
          `[${this.transformExpression(node.property)}]` :
          `.${node.property.name}`
        return `${object}${property}`
      case 'Identifier':
        return node.name
      case 'Literal':
      case 'StringLiteral':
      case 'NumericLiteral':
        return JSON.stringify(node.value)
      default:
        return '/* 未知表达式 */'
    }
  }
}
