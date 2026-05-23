import { describe, expect, it } from 'vitest'
import {
  evaluateTemplateCondition,
  evaluateTemplateExpression,
  evaluateTemplateItems,
  interpolateTemplate,
  processRuntimeTemplate
} from '@/runtime/core/template-utils.js'

describe('template runtime utils', () => {
  it('使用实例数据和上下文评估表达式', () => {
    expect(evaluateTemplateExpression('count + offset', { count: 2 }, { offset: 3 })).toBe(5)
    expect(evaluateTemplateExpression('user.name', { user: { name: 'Ada' } })).toBe('Ada')
  })

  it('插值模板并在表达式失败时保留原占位', () => {
    expect(interpolateTemplate('Hello {{ name }} #{{ count + 1 }}', { name: 'Ada', count: 1 })).toBe('Hello Ada #2')
    expect(interpolateTemplate('Hello {{ missing + }}', {})).toBe('Hello null')
  })

  it('处理字符串、函数和静态模板值', () => {
    expect(processRuntimeTemplate('Hi {{ name }}', { name: 'Ada' })).toBe('Hi Ada')
    expect(processRuntimeTemplate((ctx: any) => ctx.name.toUpperCase(), { name: 'ada' })).toBe('ADA')
    expect(processRuntimeTemplate({ static: true }, { name: 'Ada' })).toEqual({ static: true })
  })

  it('评估条件和列表数据', () => {
    expect(evaluateTemplateCondition('enabled && count > 1', { enabled: true, count: 2 })).toBe(true)
    expect(evaluateTemplateCondition(() => false, {})).toBe(false)
    expect(evaluateTemplateItems('items', { items: [{ id: 1 }, { id: 2 }] })).toEqual([{ id: 1 }, { id: 2 }])
    expect(evaluateTemplateItems(() => ['a', 'b'], {})).toEqual(['a', 'b'])
  })
})
