/**
 * v-if 指令转换插件
 * 将 Vue 的条件渲染转换为小程序的条件渲染语法
 */

import { BaseTransformPlugin } from '../base/transform-plugin'
import type { TransformResult } from '../base/transform-plugin'
import type { ASTNode } from '../../types/ast'
import type { TransformContext } from '../../types/compiler'

export class VIfPlugin extends BaseTransformPlugin {
  readonly name = 'v-if-plugin'
  readonly version = '1.0.0'
  readonly priority = 85

  supports(node: ASTNode, _context: TransformContext): boolean {
    // 检查是否为 v-if、v-else-if、v-else 指令
    return node.type === 'VueDirective' &&
      ['if', 'else-if', 'else'].includes(node.name)
  }

  async transform(node: ASTNode, _context: TransformContext): Promise<TransformResult> {
    try {
      if (!this.supports(node, _context)) {
        return this.createUnhandledResult()
      }

      const directiveName = node.name
      const expression = node.expression

      switch (directiveName) {
        case 'if':
          return this.transformVIf(expression)
        case 'else-if':
          return this.transformVElseIf(expression)
        case 'else':
          return this.transformVElse()
        default:
          return this.createUnhandledResult()
      }
    } catch (error) {
      return this.createErrorResult(`v-${node.name} 转换失败: ${error.message}`)
    }
  }

  /**
   * 转换 v-if 指令
   */
  private transformVIf(expression: ASTNode): TransformResult {
    const condition = this.extractCondition(expression)
    if (!condition) {
      return this.createErrorResult('v-if 指令需要一个条件表达式')
    }

    // 生成小程序的条件渲染代码
    const conditionCode = `wx:if="{{${condition}}}"`

    this.debug('转换 v-if', { condition })

    return this.createSuccessResult(conditionCode)
  }

  /**
   * 转换 v-else-if 指令
   */
  private transformVElseIf(expression: ASTNode): TransformResult {
    const condition = this.extractCondition(expression)
    if (!condition) {
      return this.createErrorResult('v-else-if 指令需要一个条件表达式')
    }

    // 生成小程序的条件渲染代码
    const conditionCode = `wx:elif="{{${condition}}}"`

    this.debug('转换 v-else-if', { condition })

    return this.createSuccessResult(conditionCode)
  }

  /**
   * 转换 v-else 指令
   */
  private transformVElse(): TransformResult {
    this.debug('转换 v-else')
    return this.createSuccessResult('wx:else')
  }

  /**
   * 提取条件表达式
   */
  private extractCondition(expression: ASTNode): string | null {
    if (!expression) return null

    switch (expression.type) {
      case 'Identifier':
        return expression.name
      case 'BinaryExpression':
        return this.extractBinaryExpression(expression)
      case 'UnaryExpression':
        return this.extractUnaryExpression(expression)
      case 'MemberExpression':
        return this.extractMemberExpression(expression)
      case 'CallExpression':
        return this.extractCallExpression(expression)
      case 'Literal':
      case 'StringLiteral':
      case 'NumericLiteral':
      case 'BooleanLiteral':
        return JSON.stringify(expression.value)
      default:
        this.warn('不支持的条件表达式类型', { type: expression.type })
        return null
    }
  }

  /**
   * 提取二元表达式
   */
  private extractBinaryExpression(node: ASTNode): string {
    const left = this.extractCondition(node.left)
    const right = this.extractCondition(node.right)
    const operator = node.operator

    // 转换操作符
    const miniProgramOperator = this.convertOperator(operator)

    return `${left} ${miniProgramOperator} ${right}`
  }

  /**
   * 提取一元表达式
   */
  private extractUnaryExpression(node: ASTNode): string {
    const argument = this.extractCondition(node.argument)
    const operator = node.operator

    return `${operator}${argument}`
  }

  /**
   * 提取成员表达式
   */
  private extractMemberExpression(node: ASTNode): string {
    const object = this.extractCondition(node.object)
    const property = node.computed ?
      `[${this.extractCondition(node.property)}]` :
      `.${node.property.name}`

    return `${object}${property}`
  }

  /**
   * 提取函数调用表达式
   */
  private extractCallExpression(node: ASTNode): string {
    const callee = this.extractCondition(node.callee)
    const args = node.arguments?.map((arg: any) => this.extractCondition(arg)).join(', ') || ''

    return `${callee}(${args})`
  }

  /**
   * 转换操作符
   */
  private convertOperator(operator: string): string {
    const operatorMap: Record<string, string> = {
      '===': '==',
      '!==': '!=',
      '&&': '&&',
      '||': '||',
      '!': '!',
      '>': '>',
      '<': '<',
      '>=': '>=',
      '<=': '<=',
      '+': '+',
      '-': '-',
      '*': '*',
      '/': '/',
      '%': '%'
    }

    return operatorMap[operator] || operator
  }

  /**
   * 生成条件渲染的运行时配置
   */
  generateRuntimeConfig(conditions: Record<string, any>): any {
    return {
      type: 'conditional',
      conditions: Object.entries(conditions).map(([key, config]) => ({
        key,
        type: config.type,
        condition: config.condition,
        template: config.template
      }))
    }
  }
}
