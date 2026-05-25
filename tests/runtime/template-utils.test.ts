import { describe, expect, it } from 'vitest'
import {
  createListItemRenderContext,
  createTemplateConfig,
  evaluateTemplateCondition,
  evaluateTemplateExpression,
  evaluateTemplateItems,
  interpolateTemplate,
  mergeSlotRenderProps,
  processRuntimeTemplate,
  registerTemplateDefinitions,
  resolveSlotRenderTemplate
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

  it('合并模板配置并保持旧默认值', () => {
    expect(createTemplateConfig()).toEqual({
      debug: false,
      enableSlots: true,
      enableConditional: true,
      enableList: true
    })
    expect(createTemplateConfig({ debug: true, enableList: false })).toEqual({
      debug: true,
      enableSlots: true,
      enableConditional: true,
      enableList: false
    })
  })

  it('按对象插入顺序注册模板定义', () => {
    const target = new Map<string, { value: number }>()

    registerTemplateDefinitions(target, {
      first: { value: 1 },
      second: { value: 2 }
    })
    registerTemplateDefinitions(target, undefined)

    expect([...target.entries()]).toEqual([
      ['first', { value: 1 }],
      ['second', { value: 2 }]
    ])
  })

  it('合并 slot props 并按旧 truthy 规则选择渲染模板', () => {
    expect(mergeSlotRenderProps({ fromSlot: 1, override: 'slot' }, { override: 'caller' })).toEqual({
      fromSlot: 1,
      override: 'caller'
    })
    expect(mergeSlotRenderProps(undefined, { name: 'Ada' })).toEqual({ name: 'Ada' })

    expect(resolveSlotRenderTemplate({ content: 'content', fallback: 'fallback' })).toBe('content')
    expect(resolveSlotRenderTemplate({ content: '', fallback: 'fallback' })).toBe('fallback')
    expect(resolveSlotRenderTemplate({})).toBeNull()
  })

  it('构造列表项渲染上下文并保持 keyField 旧语义', () => {
    expect(createListItemRenderContext('item', undefined, undefined, 'a', 0)).toEqual({
      item: 'a',
      index: 0
    })
    expect(createListItemRenderContext('user', 'idx', 'id', { id: 'u1', name: 'Ada' }, 2)).toEqual({
      user: { id: 'u1', name: 'Ada' },
      idx: 2,
      key: 'u1'
    })
    expect(createListItemRenderContext('user', undefined, 'missing', { id: 'u1' }, 0)).toEqual({
      user: { id: 'u1' },
      index: 0
    })
  })
})
