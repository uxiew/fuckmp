/**
 * v-model 指令转换插件
 * 将 Vue 的 v-model 双向绑定转换为小程序的双向绑定语法
 */

import { BaseTransformPlugin } from '../base/transform-plugin'
import type { TransformResult } from '../base/transform-plugin'
import type { ASTNode } from '../../types/ast'
import type { TransformContext } from '../../types/compiler'
import {
  createVModelContextUpdates,
  extractVModelVariableName,
  generateInputVModelBinding,
  generatePickerVModelBinding,
  generateSliderVModelBinding,
  generateSwitchVModelBinding,
  generateVModelFallbackBinding
} from './v-model-plugin-utils.js'

export class VModelPlugin extends BaseTransformPlugin {
  readonly name = 'v-model-plugin'
  readonly version = '1.0.0'
  readonly priority = 80
  override readonly dependencies = ['reactive-plugin'] // 依赖响应式插件

  supports(node: ASTNode, context: TransformContext): boolean {
    // 检查是否为 v-model 指令
    return node.type === 'VueDirective' && node.name === 'model'
  }

  async transform(node: ASTNode, context: TransformContext): Promise<TransformResult> {
    try {
      if (!this.supports(node, context)) {
        return this.createUnhandledResult()
      }

      const modelExpression = node.expression
      const modifiers = node.modifiers || []

      // 根据不同的表单元素类型生成不同的绑定代码
      const elementType = this.getElementType(node, context)

      switch (elementType) {
        case 'input':
          return this.transformInputModel(modelExpression, modifiers, context)
        case 'textarea':
          return this.transformTextareaModel(modelExpression, modifiers, context)
        case 'picker':
          return this.transformPickerModel(modelExpression, modifiers, context)
        case 'switch':
          return this.transformSwitchModel(modelExpression, modifiers, context)
        case 'slider':
          return this.transformSliderModel(modelExpression, modifiers, context)
        default:
          return this.createWarningResult(
            `不支持的 v-model 元素类型: ${elementType}`,
            generateVModelFallbackBinding(modelExpression)
          )
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error)
      return this.createErrorResult(`v-model 转换失败: ${message}`)
    }
  }

  /**
   * 获取元素类型
   */
  private getElementType(node: ASTNode, context: TransformContext): string {
    // 从上下文或节点中推断元素类型
    // 这里需要根据实际的模板解析结果来确定
    return context.currentElement?.tagName || 'input'
  }

  /**
   * 转换 input 的 v-model
   */
  private transformInputModel(
    expression: ASTNode,
    modifiers: string[],
    context: TransformContext
  ): TransformResult {
    const varName = extractVModelVariableName(expression)
    if (!varName) {
      return this.createErrorResult('v-model 表达式必须是一个变量')
    }

    const binding = generateInputVModelBinding(varName, modifiers)
    const contextUpdates = createVModelContextUpdates(
      context.methods,
      binding.methodName,
      binding.methodBody
    )

    this.debug('转换 input v-model', {
      varName,
      modifiers,
      bindingCode: binding.code.split(' ')[0],
      eventCode: binding.code.split(' ')[1]
    })

    return this.createSuccessResult(
      binding.code,
      contextUpdates
    )
  }

  /**
   * 转换 textarea 的 v-model
   */
  private transformTextareaModel(
    expression: ASTNode,
    modifiers: string[],
    context: TransformContext
  ): TransformResult {
    // textarea 的处理逻辑与 input 类似
    return this.transformInputModel(expression, modifiers, context)
  }

  /**
   * 转换 picker 的 v-model
   */
  private transformPickerModel(
    expression: ASTNode,
    modifiers: string[],
    context: TransformContext
  ): TransformResult {
    const varName = extractVModelVariableName(expression)
    if (!varName) {
      return this.createErrorResult('v-model 表达式必须是一个变量')
    }

    const binding = generatePickerVModelBinding(varName)
    const contextUpdates = createVModelContextUpdates(
      context.methods,
      binding.methodName,
      binding.methodBody
    )

    return this.createSuccessResult(
      binding.code,
      contextUpdates
    )
  }

  /**
   * 转换 switch 的 v-model
   */
  private transformSwitchModel(
    expression: ASTNode,
    modifiers: string[],
    context: TransformContext
  ): TransformResult {
    const varName = extractVModelVariableName(expression)
    if (!varName) {
      return this.createErrorResult('v-model 表达式必须是一个变量')
    }

    const binding = generateSwitchVModelBinding(varName)
    const contextUpdates = createVModelContextUpdates(
      context.methods,
      binding.methodName,
      binding.methodBody
    )

    return this.createSuccessResult(
      binding.code,
      contextUpdates
    )
  }

  /**
   * 转换 slider 的 v-model
   */
  private transformSliderModel(
    expression: ASTNode,
    modifiers: string[],
    context: TransformContext
  ): TransformResult {
    const varName = extractVModelVariableName(expression)
    if (!varName) {
      return this.createErrorResult('v-model 表达式必须是一个变量')
    }

    const binding = generateSliderVModelBinding(varName)
    const contextUpdates = createVModelContextUpdates(
      context.methods,
      binding.methodName,
      binding.methodBody
    )

    return this.createSuccessResult(
      binding.code,
      contextUpdates
    )
  }
}
