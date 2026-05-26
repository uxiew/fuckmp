import { describe, expect, it, vi } from 'vitest'
import {
  resolveComputedProxyValue,
  syncReactiveProxyContextData
} from '@/runtime/core/reactivity-proxy-internals.js'

describe('reactivity proxy internals', () => {
  it('解析 dirty computed 值并同步到小程序上下文', () => {
    const context = { setData: vi.fn() }
    const target = {
      _key: 'computed_total',
      _getter: vi.fn(() => 42),
      _context: context,
      _dirty: true,
      _computing: false
    }
    let currentValue = 0

    const first = resolveComputedProxyValue(target, value => {
      currentValue = value
    }, () => currentValue)
    const second = resolveComputedProxyValue(target, value => {
      currentValue = value
    }, () => currentValue)

    expect(first).toBe(42)
    expect(second).toBe(42)
    expect(target._getter).toHaveBeenCalledTimes(1)
    expect(target._dirty).toBe(false)
    expect(context.setData).toHaveBeenCalledWith({ computed_total: 42 })
  })

  it('检测 computed 循环计算时返回 undefined 且不调用 getter', () => {
    const target = {
      _key: 'computed_loop',
      _getter: vi.fn(() => 1),
      _context: undefined,
      _dirty: true,
      _computing: true
    }

    expect(resolveComputedProxyValue(target, vi.fn(), () => 0)).toBeUndefined()
    expect(target._getter).not.toHaveBeenCalled()
  })

  it('同步 reactive proxy 嵌套路径，缺少 setData 时保持 no-op', () => {
    const context = { setData: vi.fn() }

    syncReactiveProxyContextData(context, 'reactive_user', ['profile'], 'name', 'Ada')
    syncReactiveProxyContextData(undefined, 'reactive_user', [], 'age', 18)
    syncReactiveProxyContextData({}, 'reactive_user', [], 'age', 18)

    expect(context.setData).toHaveBeenCalledTimes(1)
    expect(context.setData).toHaveBeenCalledWith({
      'reactive_user.profile.name': 'Ada'
    })
  })
})
