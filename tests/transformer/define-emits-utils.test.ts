import { parse } from '@babel/parser'
import { describe, expect, it } from 'vitest'
import {
  extractEmitsDefinition,
  extractTypeScriptEmits,
  generateEmitMethodsCode,
  generateEventHandlersCode,
  generateInputHandlersCode,
  generateVModelUpdateCode,
  getVModelProps,
  hasVModelEvents,
  transformToEmitInfos,
  validateEventName
} from '@/transformer/macro-handlers/define-emits-utils.js'

function expressionOf(source: string): any {
  return parse(source, { sourceType: 'module', plugins: ['typescript'] }).program.body[0]
}

function typeAliasRightOf(source: string): any {
  const statement = parse(source, {
    sourceType: 'module',
    plugins: ['typescript']
  }).program.body[0] as any

  return statement.typeAnnotation
}

describe('define emits utils', () => {
  it('从 runtime 数组和对象参数提取 emits 定义并转换 EmitInfo', () => {
    const arrayStatement = expressionOf(`defineEmits(['save', 'cancel'])`) as any
    const objectStatement = expressionOf(`defineEmits({ submit: null, close: (payload) => true })`) as any

    const arrayEmits = extractEmitsDefinition(arrayStatement.expression.arguments[0])
    const objectEmits = extractEmitsDefinition(objectStatement.expression.arguments[0])

    expect(transformToEmitInfos(arrayEmits)).toEqual([
      { name: 'save', payload: undefined, validator: undefined },
      { name: 'cancel', payload: undefined, validator: undefined }
    ])
    expect(transformToEmitInfos(objectEmits)).toEqual([
      { name: 'submit', payload: undefined, validator: undefined },
      { name: 'close', payload: undefined, validator: 'function' }
    ])
  })

  it('从 TypeScript call signature 和 named tuple 属性中提取事件名', () => {
    const emits = extractTypeScriptEmits(typeAliasRightOf(`type Emits = {
      (event: 'save' | 'cancel', id?: number): void
      submit: [payload: string]
    }`))

    expect(emits).toEqual({
      save: null,
      cancel: null,
      submit: null
    })
  })

  it('生成 emit 方法、事件 handler 和 v-model 输入方法代码', () => {
    const emitInfos = transformToEmitInfos(['save', 'update:modelValue'])

    expect(generateEmitMethodsCode(emitInfos)).toContain("this.triggerEvent('save', payload)")
    expect(generateEventHandlersCode(emitInfos)).toContain('this._emitSave(payload)')
    expect(generateVModelUpdateCode(emitInfos)).toContain('_handleUpdate_modelValue(event)')
    expect(generateInputHandlersCode(emitInfos)).toContain('_handleTrimInput_modelValue(event)')
    expect(generateInputHandlersCode(emitInfos)).toContain("this.triggerEvent('update:modelValue', value)")
    expect(hasVModelEvents(emitInfos)).toBe(true)
    expect(getVModelProps(emitInfos)).toEqual(['modelValue'])
  })

  it('校验事件名格式与保留事件名', () => {
    expect(validateEventName('custom-event').valid).toBe(true)
    expect(validateEventName('1invalid')).toMatchObject({ valid: false })
    expect(validateEventName('tap')).toMatchObject({ valid: false })
  })
})
