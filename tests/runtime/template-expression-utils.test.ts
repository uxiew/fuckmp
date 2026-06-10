import { describe, expect, it } from 'vitest'
import {
  evaluateTemplateCondition,
  evaluateTemplateExpression,
  evaluateTemplateItems,
  interpolateTemplate,
  processRuntimeTemplate
} from '@/runtime/core/template-expression-utils.js'
import { evaluateTemplateExpression as LegacyEvaluateTemplateExpression } from '@/runtime/core/template-utils.js'

describe('template expression utils', () => {
  it('使用实例数据和上下文评估表达式并保持旧替换语义', () => {
    expect(evaluateTemplateExpression('count + offset', { count: 2 }, { offset: 3 })).toBe(5)
    expect(evaluateTemplateExpression('user.name', { user: { name: 'Ada' } })).toBe('Ada')
  })

  it('表达式失败时调用错误处理器并返回 null', () => {
    const errors: string[] = []

    expect(evaluateTemplateExpression('count +', { count: 1 }, undefined, message => {
      errors.push(message)
    })).toBeNull()
    expect(errors).toEqual(['表达式评估失败: count +'])
  })

  it('插值字符串并在表达式失败时保留旧 null 字符串行为', () => {
    expect(interpolateTemplate('Hello {{ name }} #{{ count + 1 }}', { name: 'Ada', count: 1 })).toBe('Hello Ada #2')
    expect(interpolateTemplate('Hello {{ missing + }}', {})).toBe('Hello null')
  })

  it('处理字符串、函数和静态模板值', () => {
    expect(processRuntimeTemplate('Hi {{ name }}', { name: 'Ada' })).toBe('Hi Ada')
    expect(processRuntimeTemplate((ctx: any) => ctx.name.toUpperCase(), { name: 'ada' })).toBe('ADA')
    expect(processRuntimeTemplate({ static: true }, { name: 'Ada' })).toEqual({ static: true })
  })

  it('评估条件和列表数据并保持 template-utils 旧入口兼容', () => {
    expect(evaluateTemplateCondition('enabled && count > 1', { enabled: true, count: 2 })).toBe(true)
    expect(evaluateTemplateCondition(() => false, {})).toBe(false)
    expect(evaluateTemplateItems('items', { items: [{ id: 1 }, { id: 2 }] })).toEqual([{ id: 1 }, { id: 2 }])
    expect(evaluateTemplateItems(() => ['a', 'b'], {})).toEqual(['a', 'b'])
    expect(LegacyEvaluateTemplateExpression).toBe(evaluateTemplateExpression)
  })
})
