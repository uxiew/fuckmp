import { describe, expect, it, vi } from 'vitest'
import {
  applyReactiveDataToInstance,
  areReactiveValuesEqual,
  cloneReactiveValue,
  createReactivityConfig,
  getReactiveInstanceValue
} from '@/runtime/core/reactivity-utils.js'

describe('runtime reactivity utils', () => {
  it('合并响应式配置并保留默认开关旧语义', () => {
    expect(createReactivityConfig()).toEqual({
      debug: false,
      enableComputed: true,
      enableWatch: true
    })
    expect(createReactivityConfig({ debug: true, enableWatch: false })).toEqual({
      debug: true,
      enableComputed: true,
      enableWatch: false
    })
  })

  it('优先通过 setData 写入响应式数据', () => {
    const instance = { setData: vi.fn(), data: { count: 1 } }

    applyReactiveDataToInstance(instance, { count: 2, label: 'new' })

    expect(instance.setData).toHaveBeenCalledWith({ count: 2, label: 'new' })
    expect(instance.data).toEqual({ count: 1 })
  })

  it('缺少 setData 时写入已有 data 对象并保留旧实例结构语义', () => {
    const instance: any = { data: { count: 1 } }
    const withoutData: any = {}

    applyReactiveDataToInstance(instance, { count: 2, label: 'new' })
    applyReactiveDataToInstance(withoutData, { count: 3 })

    expect(instance.data).toEqual({ count: 2, label: 'new' })
    expect(withoutData).not.toHaveProperty('data')
  })

  it('从实例 data 中读取值，仅命中自有或原型链可见字段', () => {
    const inherited = Object.create({ inherited: 'from-prototype' })
    inherited.own = 'from-own'
    const instance = { data: inherited }

    expect(getReactiveInstanceValue(instance, 'own')).toBe('from-own')
    expect(getReactiveInstanceValue(instance, 'inherited')).toBe('from-prototype')
    expect(getReactiveInstanceValue(instance, 'missing')).toBeUndefined()
    expect(getReactiveInstanceValue({}, 'missing')).toBeUndefined()
  })

  it('深拷贝响应式旧值，覆盖 Date、数组和普通对象', () => {
    const input = {
      date: new Date('2026-05-24T00:00:00.000Z'),
      nested: [{ count: 1 }]
    }

    const cloned = cloneReactiveValue(input)

    expect(cloned).toEqual(input)
    expect(cloned).not.toBe(input)
    expect(cloned.date).not.toBe(input.date)
    expect(cloned.nested).not.toBe(input.nested)
    expect(cloned.nested[0]).not.toBe(input.nested[0])
    expect(cloneReactiveValue(null)).toBeNull()
    expect(cloneReactiveValue('text')).toBe('text')
  })

  it('按旧比较规则判断响应式值是否相等', () => {
    expect(areReactiveValuesEqual(1, 1)).toBe(true)
    expect(areReactiveValuesEqual(null, undefined)).toBe(false)
    expect(areReactiveValuesEqual(1, '1')).toBe(false)
    expect(areReactiveValuesEqual({ a: 1 }, { a: 1 })).toBe(true)
    expect(areReactiveValuesEqual({ a: 1 }, { a: 2 })).toBe(false)
    expect(areReactiveValuesEqual([1, 2], [1, 2])).toBe(true)
    expect(areReactiveValuesEqual('a', 'b')).toBe(false)
  })
})
