import { describe, expect, it } from 'vitest'
import type { ASTNode } from '@/types/ast.js'
import {
  createVModelContextUpdates,
  extractVModelVariableName,
  generateInputVModelBinding,
  generatePickerVModelBinding,
  generateSliderVModelBinding,
  generateSwitchVModelBinding,
  generateVModelFallbackBinding
} from '@/plugins/directives/v-model-plugin-utils.js'

const identifier = (name: string): ASTNode => ({ type: 'Identifier', name })

const member = (object: ASTNode, property: ASTNode, computed = false): ASTNode => ({
  type: 'MemberExpression',
  object,
  property,
  computed
})

describe('v-model plugin utils', () => {
  it('提取 Identifier 和 MemberExpression 变量名并保持旧 computed 语义', () => {
    expect(extractVModelVariableName(identifier('username'))).toBe('username')
    expect(extractVModelVariableName(member(identifier('form'), identifier('name')))).toBe('form.name')
    expect(extractVModelVariableName(member(identifier('items'), identifier('index'), true))).toBe(
      'items[index]'
    )
    expect(extractVModelVariableName({ type: 'StringLiteral', value: 'name' })).toBeNull()
  })

  it('生成 input v-model 绑定和默认 input handler', () => {
    expect(generateInputVModelBinding('username', [])).toEqual({
      code: 'value="{{username}}" bindinput="_handleInput_username"',
      methodName: '_handleInput_username',
      methodBody: [
        'const value = event.detail.value',
        'this.setData({ username: value })',
        'this._updateComputed()'
      ].join('\n')
    })
  })

  it('生成 lazy/trim/number 修饰符对应的 input handler', () => {
    expect(generateInputVModelBinding('age', ['lazy', 'trim', 'number'])).toEqual({
      code: 'value="{{age}}" bindchange="_handleInput_age"',
      methodName: '_handleInput_age',
      methodBody: [
        'const value = event.detail.value.trim()',
        'const numValue = Number(value)',
        'const finalValue = isNaN(numValue) ? value : numValue',
        'this.setData({ age: finalValue })',
        'this._updateComputed()'
      ].join('\n')
    })
  })

  it('生成 picker、switch 和 slider 的绑定代码', () => {
    expect(generatePickerVModelBinding('city')).toEqual({
      code: 'value="{{city}}" bindchange="_handlePicker_city"',
      methodName: '_handlePicker_city',
      methodBody: [
        '',
        'const value = event.detail.value',
        'this.setData({ city: value })',
        'this._updateComputed()'
      ].join('\n')
    })
    expect(generateSwitchVModelBinding('enabled')).toEqual({
      code: 'checked="{{enabled}}" bindchange="_handleSwitch_enabled"',
      methodName: '_handleSwitch_enabled',
      methodBody: [
        '',
        'const checked = event.detail.value',
        'this.setData({ enabled: checked })',
        'this._updateComputed()'
      ].join('\n')
    })
    expect(generateSliderVModelBinding('volume')).toEqual({
      code: 'value="{{volume}}" bindchange="_handleSlider_volume"',
      methodName: '_handleSlider_volume',
      methodBody: [
        '',
        'const value = event.detail.value',
        'this.setData({ volume: value })',
        'this._updateComputed()'
      ].join('\n')
    })
  })

  it('生成 fallback binding 并合并 generated method 到上下文更新', () => {
    expect(generateVModelFallbackBinding(identifier('keyword'))).toBe('value="{{keyword}}"')
    expect(generateVModelFallbackBinding({ type: 'CallExpression' })).toBe('value=""')

    const existing = {
      submit: { name: 'submit', params: [], body: '', isGenerated: false }
    }

    expect(
      createVModelContextUpdates(existing, '_handleInput_keyword', 'const value = event.detail.value')
    ).toEqual({
      methods: {
        ...existing,
        _handleInput_keyword: {
          name: '_handleInput_keyword',
          params: ['event'],
          body: 'const value = event.detail.value',
          isGenerated: true
        }
      }
    })
  })
})
