import { describe, expect, it } from 'vitest'
import {
  generateEmitMethodsCode,
  generateEventDocs,
  generateEventHandlersCode,
  generateInputHandlersCode,
  generateVModelUpdateCode,
  getVModelProps,
  hasVModelEvents,
  validateEventName
} from '@/transformer/macro-handlers/define-emits-codegen-utils.js'
import {
  generateEmitMethodsCode as publicGenerateEmitMethodsCode,
  validateEventName as publicValidateEventName
} from '@/transformer/macro-handlers/define-emits-utils.js'
import type { EmitInfo } from '@/transformer/macro-handlers/define-emits-utils.js'

describe('define emits codegen utils', () => {
  const emitInfos: EmitInfo[] = [
    { name: 'save', payload: undefined, validator: undefined },
    { name: 'update:modelValue', payload: undefined, validator: undefined },
    { name: 'update:user.name', payload: undefined, validator: undefined }
  ]

  it('继续通过 define-emits-utils 旧入口导出代码生成 helper', () => {
    expect(publicGenerateEmitMethodsCode).toBe(generateEmitMethodsCode)
    expect(publicValidateEventName).toBe(validateEventName)
  })

  it('生成 emit 方法和事件 handler 代码', () => {
    expect(generateEmitMethodsCode(emitInfos)).toContain("_emitSave(payload)")
    expect(generateEmitMethodsCode(emitInfos)).toContain("this.triggerEvent('save', payload)")
    expect(generateEventHandlersCode(emitInfos)).toContain('_handleSave(event)')
    expect(generateEventHandlersCode(emitInfos)).toContain('this._emitSave(payload)')
  })

  it('生成 v-model 更新和输入处理代码并保留旧命名语义', () => {
    const vModelCode = generateVModelUpdateCode(emitInfos)
    const inputCode = generateInputHandlersCode(emitInfos)

    expect(vModelCode).toContain('_handleUpdate_modelValue(event)')
    expect(vModelCode).toContain("this.triggerEvent('update:modelValue', value)")
    expect(vModelCode).toContain('_handleUpdate_user_name(event)')
    expect(vModelCode).toContain("this.triggerEvent('update:user.name', value)")
    expect(inputCode).toContain('_handleInput_modelValue(event)')
    expect(inputCode).toContain('_handleNumberInput_modelValue(event)')
    expect(inputCode).toContain('_handleTrimInput_modelValue(event)')
    expect(inputCode).toContain('user.name: value')
  })

  it('识别 v-model 事件、校验事件名并生成事件文档', () => {
    expect(hasVModelEvents(emitInfos)).toBe(true)
    expect(getVModelProps(emitInfos)).toEqual(['modelValue', 'user.name'])
    expect(validateEventName('custom-event')).toEqual({ valid: true })
    expect(validateEventName('1invalid')).toMatchObject({ valid: false })
    expect(validateEventName('tap')).toMatchObject({ valid: false })
    expect(generateEventDocs(emitInfos)).toContain('* save 事件')
    expect(generateEventDocs(emitInfos)).toContain('* update:modelValue 事件')
  })
})
