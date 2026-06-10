/**
 * v-model 指令转换插件的纯工具函数。
 */

import type { ASTNode } from '../../types/ast.js'

/**
 * v-model 绑定生成结果。
 */
export interface VModelBindingResult {
  code: string
  methodName: string
  methodBody: string
}

/**
 * 提取 v-model 表达式对应的变量路径。
 */
export function extractVModelVariableName(expression: ASTNode): string | null {
  if (expression.type === 'Identifier') {
    return expression.name
  }

  if (expression.type === 'MemberExpression') {
    const object = extractVModelVariableName(expression.object)
    const property = expression.computed ?
      `[${extractVModelVariableName(expression.property)}]` :
      `.${expression.property.name}`
    return object ? `${object}${property}` : null
  }

  return null
}

/**
 * 生成 input/textarea v-model 绑定和事件处理方法。
 */
export function generateInputVModelBinding(
  varName: string,
  modifiers: string[]
): VModelBindingResult {
  const hasLazyModifier = modifiers.includes('lazy')
  const hasNumberModifier = modifiers.includes('number')
  const hasTrimModifier = modifiers.includes('trim')

  const bindingCode = `value="{{${varName}}}"`
  const eventCode = hasLazyModifier ?
    `bindchange="_handleInput_${varName}"` :
    `bindinput="_handleInput_${varName}"`
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

  methodBody += `
this._updateComputed()`

  return {
    code: `${bindingCode} ${eventCode}`,
    methodName,
    methodBody
  }
}

/**
 * 生成 picker v-model 绑定和事件处理方法。
 */
export function generatePickerVModelBinding(varName: string): VModelBindingResult {
  const methodName = `_handlePicker_${varName}`

  return {
    code: `value="{{${varName}}}" bindchange="${methodName}"`,
    methodName,
    methodBody: `
const value = event.detail.value
this.setData({ ${varName}: value })
this._updateComputed()`
  }
}

/**
 * 生成 switch v-model 绑定和事件处理方法。
 */
export function generateSwitchVModelBinding(varName: string): VModelBindingResult {
  const methodName = `_handleSwitch_${varName}`

  return {
    code: `checked="{{${varName}}}" bindchange="${methodName}"`,
    methodName,
    methodBody: `
const checked = event.detail.value
this.setData({ ${varName}: checked })
this._updateComputed()`
  }
}

/**
 * 生成 slider v-model 绑定和事件处理方法。
 */
export function generateSliderVModelBinding(varName: string): VModelBindingResult {
  const methodName = `_handleSlider_${varName}`

  return {
    code: `value="{{${varName}}}" bindchange="${methodName}"`,
    methodName,
    methodBody: `
const value = event.detail.value
this.setData({ ${varName}: value })
this._updateComputed()`
  }
}

/**
 * 生成 v-model fallback 绑定。
 */
export function generateVModelFallbackBinding(expression: ASTNode): string {
  const varName = extractVModelVariableName(expression)
  return varName ? `value="{{${varName}}}"` : 'value=""'
}

/**
 * 生成包含 v-model 事件方法的上下文更新。
 */
export function createVModelContextUpdates(
  methods: Record<string, any>,
  methodName: string,
  methodBody: string
): { methods: Record<string, any> } {
  return {
    methods: {
      ...methods,
      [methodName]: {
        name: methodName,
        params: ['event'],
        body: methodBody,
        isGenerated: true
      }
    }
  }
}
