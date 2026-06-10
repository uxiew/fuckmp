import { describe, expect, it, vi } from 'vitest'
import {
  applyEventModifiers,
  applyTwoWayBindingValueToInstance,
  createEventConfig,
  createBindingUpdate,
  extractTwoWayBindingValue,
  getBindingHandlerName,
  isKeyModifier,
  shouldSetupTwoWayBindings
} from '@/runtime/core/event-utils.js'

describe('runtime event utils', () => {
  it('合并事件配置并保留默认开关旧语义', () => {
    expect(createEventConfig()).toEqual({
      debug: false,
      enableTwoWayBinding: true,
      enableEventModifiers: true
    })
    expect(createEventConfig({ debug: true, enableTwoWayBinding: false })).toEqual({
      debug: true,
      enableTwoWayBinding: false,
      enableEventModifiers: true
    })
  })

  it('判断双向绑定启用条件并构造绑定 handler 名称', () => {
    expect(shouldSetupTwoWayBindings(undefined, { enableTwoWayBinding: true })).toBe(false)
    expect(shouldSetupTwoWayBindings({}, { enableTwoWayBinding: false })).toBe(false)
    expect(shouldSetupTwoWayBindings({ title: { property: 'title', eventName: 'input' } }, {
      enableTwoWayBinding: true
    })).toBe(true)
    expect(getBindingHandlerName('title')).toBe('_handle_title_binding')
  })

  it('按旧优先级提取和写入双向绑定值', () => {
    expect(extractTwoWayBindingValue({ detail: { value: 'typed', raw: true } })).toBe('typed')
    expect(extractTwoWayBindingValue({ detail: { raw: true } })).toEqual({ raw: true })

    expect(createBindingUpdate('title', 'hello')).toEqual({ title: 'hello' })

    const withSetData = { setData: vi.fn() }
    applyTwoWayBindingValueToInstance(withSetData, 'title', 'hello')
    expect(withSetData.setData).toHaveBeenCalledWith({ title: 'hello' })
    expect(withSetData).not.toHaveProperty('data')

    const withoutSetData: any = {}
    applyTwoWayBindingValueToInstance(withoutSetData, 'title', 'hello')
    applyTwoWayBindingValueToInstance(withoutSetData, 'count', 2)
    expect(withoutSetData.data).toEqual({ title: 'hello', count: 2 })
  })

  it('应用 stop/prevent/self 修饰符并保持复制事件对象旧语义', () => {
    const event = {
      target: 'child',
      currentTarget: 'child',
      stopPropagation: vi.fn(),
      preventDefault: vi.fn()
    }

    const modified = applyEventModifiers(event, ['stop', 'prevent'])

    expect(modified).not.toBe(event)
    expect(modified.target).toBe('child')
    expect(event.stopPropagation).toHaveBeenCalledTimes(1)
    expect(event.preventDefault).toHaveBeenCalledTimes(1)

    expect(applyEventModifiers({
      target: 'child',
      currentTarget: 'parent'
    }, ['self'])).toBeNull()
  })

  it('保留键盘修饰符阻止规则', () => {
    expect(isKeyModifier('enter', { key: 'Escape' })).toBe(true)
    expect(isKeyModifier('enter', { key: 'Enter' })).toBe(false)
    expect(isKeyModifier('a', { key: 'b' })).toBe(true)
    expect(isKeyModifier('a', { key: 'a' })).toBe(false)
    expect(isKeyModifier('enter', {})).toBe(false)

    expect(applyEventModifiers({ key: 'Escape' }, ['enter'])).toBeNull()
    expect(applyEventModifiers({ key: 'Enter' }, ['enter'])).toEqual({ key: 'Enter' })
  })
})
