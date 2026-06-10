import { describe, expect, it, vi } from 'vitest'
import { createReactiveProxy } from '@/runtime/core/reactivity-proxy-helpers'

describe('reactivity proxy helpers', () => {
  it('创建 reactive proxy 时初始化上下文数据并同步嵌套更新', () => {
    const context = {
      setData: vi.fn()
    }
    const user = createReactiveProxy({
      name: 'Ada',
      profile: {
        age: 18
      }
    }, context)

    expect(context.setData).toHaveBeenCalledTimes(1)
    const initData = context.setData.mock.calls[0][0]
    const reactiveKey = Object.keys(initData).find(key => key.startsWith('reactive_'))
    expect(reactiveKey).toBeDefined()
    expect(initData[reactiveKey!]).toEqual({
      name: 'Ada',
      profile: {
        age: 18
      }
    })

    user.profile.age = 19

    expect(context.setData).toHaveBeenLastCalledWith({
      [`${reactiveKey}.profile.age`]: 19
    })
  })

  it('删除 reactive proxy 属性时同步 undefined 并复用嵌套代理', () => {
    const context = {
      setData: vi.fn()
    }
    const user = createReactiveProxy({
      profile: {
        age: 18,
        name: 'Ada'
      }
    }, context)
    const initData = context.setData.mock.calls[0][0]
    const reactiveKey = Object.keys(initData).find(key => key.startsWith('reactive_'))!

    expect(user.profile).toBe(user.profile)

    delete user.profile.name

    expect(context.setData).toHaveBeenLastCalledWith({
      [`${reactiveKey}.profile.name`]: undefined
    })
  })
})
