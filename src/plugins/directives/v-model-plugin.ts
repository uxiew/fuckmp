/**
 * v-model 指令转换插件
 * 将 Vue 的 v-model 双向绑定转换为小程序的双向绑定语法
 */

import { BaseTransformPlugin } from '../base/transform-plugin'
import type { TransformResult } from '../base/transform-plugin'
import type { ASTNode } from '../../types/ast'
import type { TransformContext } from '../../types/compiler'

export class VModelPlugin extends BaseTransformPlugin {
  readonly name = 'v-model-plugin'
  readonly version = '1.0.0'
  readonly priority = 80
  readonly dependencies = ['reactive-plugin'] // 依赖响应式插件

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
            this.generateFallbackBinding(modelExpression)
          )
      }
    } catch (error) {
      return this.createErrorResult(`v-model 转换失败: ${error.message}`)
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
    const varName = this.extractVariableName(expression)
    if (!varName) {
      return this.createErrorResult('v-model 表达式必须是一个变量')
    }

    const hasLazyModifier = modifiers.includes('lazy')
    const hasNumberModifier = modifiers.includes('number')
    const hasTrimModifier = modifiers.includes('trim')

    // 生成小程序的双向绑定代码
    let bindingCode = `value="{{${varName}}}"`
    let eventCode = ''

    if (hasLazyModifier) {
      // lazy 修饰符：在 change 事件时更新
      eventCode = `bindchange="_handleInput_${varName}"`
    } else {
      // 默认：在 input 事件时更新
      eventCode = `bindinput="_handleInput_${varName}"`
    }

    // 生成事件处理方法
    const methodName = `_handleInput_${varName}`
    let methodBody = 'const value = event.detail.value'

    if (hasTrimModifier) {
      methodBody += '.trim()'
    }

    if (hasNumberModifier) {
      methodBody += `
const numValue = Number(value)
const finalValue = isNaN(numValue) ? value : numValue`
      methodBody += `
this.setData({ ${varName}: finalValue })`
    } else {
      methodBody += `
this.setData({ ${varName}: value })`
    }

    // 更新计算属性
    methodBody += `
this._updateComputed()`

    const contextUpdates = {
      methods: {
        ...context.methods,
        [methodName]: {
          name: methodName,
          params: ['event'],
          body: methodBody,
          isGenerated: true
        }
      }
    }

    this.debug('转换 input v-model', {
      varName,
      modifiers,
      bindingCode,
      eventCode
    })

    return this.createSuccessResult(
      `${bindingCode} ${eventCode}`,
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
    const varName = this.extractVariableName(expression)
    if (!varName) {
      return this.createErrorResult('v-model 表达式必须是一个变量')
    }

    const bindingCode = `value="{{${varName}}}"`
    const eventCode = `bindchange="_handlePicker_${varName}"`

    const methodName = `_handlePicker_${varName}`
    const methodBody = `
const value = event.detail.value
this.setData({ ${varName}: value })
this._updateComputed()`

    const contextUpdates = {
      methods: {
        ...context.methods,
        [methodName]: {
          name: methodName,
          params: ['event'],
          body: methodBody,
          isGenerated: true
        }
      }
    }

    return this.createSuccessResult(
      `${bindingCode} ${eventCode}`,
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
    const varName = this.extractVariableName(expression)
    if (!varName) {
      return this.createErrorResult('v-model 表达式必须是一个变量')
    }

    const bindingCode = `checked="{{${varName}}}"`
    const eventCode = `bindchange="_handleSwitch_${varName}"`

    const methodName = `_handleSwitch_${varName}`
    const methodBody = `
const checked = event.detail.value
this.setData({ ${varName}: checked })
this._updateComputed()`

    const contextUpdates = {
      methods: {
        ...context.methods,
        [methodName]: {
          name: methodName,
          params: ['event'],
          body: methodBody,
          isGenerated: true
        }
      }
    }

    return this.createSuccessResult(
      `${bindingCode} ${eventCode}`,
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
    const varName = this.extractVariableName(expression)
    if (!varName) {
      return this.createErrorResult('v-model 表达式必须是一个变量')
    }

    const bindingCode = `value="{{${varName}}}"`
    const eventCode = `bindchange="_handleSlider_${varName}"`

    const methodName = `_handleSlider_${varName}`
    const methodBody = `
const value = event.detail.value
this.setData({ ${varName}: value })
this._updateComputed()`

    const contextUpdates = {
      methods: {
        ...context.methods,
        [methodName]: {
          name: methodName,
          params: ['event'],
          body: methodBody,
          isGenerated: true
        }
      }
    }

    return this.createSuccessResult(
      `${bindingCode} ${eventCode}`,
      contextUpdates
    )
  }

  /**
   * 提取变量名
   */
  private extractVariableName(expression: ASTNode): string | null {
    if (expression.type === 'Identifier') {
      return expression.name
    }

    if (expression.type === 'MemberExpression') {
      // 处理 obj.prop 形式
      const object = this.extractVariableName(expression.object)
      const property = expression.computed ?
        `[${this.extractVariableName(expression.property)}]` :
        `.${expression.property.name}`
      return object ? `${object}${property}` : null
    }

    return null
  }

  /**
   * 生成回退绑定
   */
  private generateFallbackBinding(expression: ASTNode): string {
    const varName = this.extractVariableName(expression)
    return varName ? `value="{{${varName}}}"` : 'value=""'
  }
}
