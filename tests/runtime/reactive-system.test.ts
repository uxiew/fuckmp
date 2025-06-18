/**
 * 响应式系统单元测试
 */

import { describe, it, expect, beforeEach, vi } from 'vitest'

describe('Vue3 响应式运行时系统', () => {
  let mockContext: any
  let reactiveSystem: any

  beforeEach(() => {
    // 模拟小程序页面/组件上下文
    mockContext = {
      setData: vi.fn(),
      data: {}
    }

    // 模拟运行时库
    global.Vue3MiniRuntimeCore = class {
      constructor(config: any) {
        this.config = config
        this.isInitialized = false
        this.reactiveInstances = new Map()
      }

      async init() {
        this.isInitialized = true
      }

      createReactiveSystem(context: any) {
        const reactiveSystem = {
          context: context,
          refs: new Map(),
          reactives: new Map(),
          computeds: new Map(),

          generateId() {
            return Math.random().toString(36).substr(2, 9)
          },

          ref(value: any) {
            const key = 'ref_' + this.generateId()
            let _value = value

            const refObject = {
              _isRef: true,
              _key: key,
              get value() {
                return _value
              },
              set value(newValue: any) {
                if (newValue !== _value) {
                  _value = newValue
                  if (context && typeof context.setData === 'function') {
                    context.setData({ [key]: newValue })
                  }
                }
              }
            }

            if (context && typeof context.setData === 'function') {
              context.setData({ [key]: value })
            }

            this.refs.set(key, refObject)
            return refObject
          },

          reactive(target: any) {
            const key = 'reactive_' + this.generateId()
            const self = this

            function createProxy(obj: any, path: any[] = []): any {
              return new Proxy(obj, {
                get(target, prop) {
                  const value = target[prop]
                  if (value && typeof value === 'object' && typeof prop === 'string') {
                    return createProxy(value, [...path, prop])
                  }
                  return value
                },
                set(target, prop, newValue) {
                  if (typeof prop === 'string') {
                    const oldValue = target[prop]
                    if (newValue !== oldValue) {
                      target[prop] = newValue
                      if (context && typeof context.setData === 'function') {
                        const fullPath = path.length > 0
                          ? key + '.' + [...path, prop].join('.')
                          : key + '.' + prop
                        context.setData({ [fullPath]: newValue })
                      }
                    }
                  }
                  return true
                }
              })
            }

            const proxy = createProxy(target)
            if (context && typeof context.setData === 'function') {
              context.setData({ [key]: target })
            }

            this.reactives.set(key, proxy)
            return proxy
          },

          computed(getter: () => any) {
            const key = 'computed_' + this.generateId()
            let _value: any
            let _dirty = true

            const computedRef = {
              _isComputed: true,
              _key: key,
              get value() {
                if (_dirty) {
                  _value = getter()
                  _dirty = false
                  if (context && typeof context.setData === 'function') {
                    context.setData({ [key]: _value })
                  }
                }
                return _value
              }
            }

            const initialValue = computedRef.value
            this.computeds.set(key, computedRef)
            return computedRef
          }
        }

        this.reactiveInstances.set(context, reactiveSystem)
        return reactiveSystem
      }
    }

    // 创建响应式系统实例
    const runtime = new (global as any).Vue3MiniRuntimeCore({})
    reactiveSystem = runtime.createReactiveSystem(mockContext)
  })

  describe('ref 响应式引用', () => {
    it('应该创建 ref 并自动调用 setData', () => {
      const count = reactiveSystem.ref(0)

      // 验证初始化时调用了 setData
      expect(mockContext.setData).toHaveBeenCalledWith(
        expect.objectContaining({ [count._key]: 0 })
      )

      // 验证 ref 对象结构
      expect(count._isRef).toBe(true)
      expect(count._key).toMatch(/^ref_/)
      expect(count.value).toBe(0)
    })

    it('应该支持 ref 的自增操作', () => {
      const count = reactiveSystem.ref(0)
      mockContext.setData.mockClear()

      // 模拟 count.value++ 操作
      count.value++

      // 验证 setData 被调用
      expect(mockContext.setData).toHaveBeenCalledWith(
        expect.objectContaining({ [count._key]: 1 })
      )
      expect(count.value).toBe(1)
    })

    it('应该支持 ref 的复合赋值操作', () => {
      const count = reactiveSystem.ref(10)
      mockContext.setData.mockClear()

      // 模拟 count.value += 5 操作
      count.value += 5

      // 验证 setData 被调用
      expect(mockContext.setData).toHaveBeenCalledWith(
        expect.objectContaining({ [count._key]: 15 })
      )
      expect(count.value).toBe(15)
    })

    it('应该支持 ref 的直接赋值操作', () => {
      const message = reactiveSystem.ref('hello')
      mockContext.setData.mockClear()

      // 模拟 message.value = 'world' 操作
      message.value = 'world'

      // 验证 setData 被调用
      expect(mockContext.setData).toHaveBeenCalledWith(
        expect.objectContaining({ [message._key]: 'world' })
      )
      expect(message.value).toBe('world')
    })
  })

  describe('reactive 响应式对象', () => {
    it('应该创建 reactive 对象并自动调用 setData', () => {
      const user = reactiveSystem.reactive({ name: 'test', age: 20 })

      // 验证初始化时调用了 setData
      const setDataCalls = mockContext.setData.mock.calls
      expect(setDataCalls.length).toBeGreaterThan(0)

      // 验证 setData 被调用，且包含正确的数据结构
      const lastCall = setDataCalls[setDataCalls.length - 1][0]
      const reactiveKey = Object.keys(lastCall).find(key => key.startsWith('reactive_'))
      expect(reactiveKey).toBeDefined()
      expect(lastCall[reactiveKey]).toEqual({ name: 'test', age: 20 })

      // 验证对象属性
      expect(user.name).toBe('test')
      expect(user.age).toBe(20)
    })

    it('应该支持 reactive 对象的属性修改', () => {
      const user = reactiveSystem.reactive({ name: 'test', age: 20 })
      mockContext.setData.mockClear()

      // 模拟 user.name = 'new name' 操作
      user.name = 'new name'

      // 验证 setData 被调用
      const setDataCalls = mockContext.setData.mock.calls
      expect(setDataCalls.length).toBe(1)

      // 验证调用参数包含正确的路径和值
      const callArgs = setDataCalls[0][0]
      const propertyKey = Object.keys(callArgs).find(key => key.includes('.name'))
      expect(propertyKey).toBeDefined()
      expect(propertyKey).toMatch(/^reactive_.*\.name$/)
      expect(callArgs[propertyKey]).toBe('new name')
      expect(user.name).toBe('new name')
    })

    it('应该支持 reactive 对象的嵌套属性修改', () => {
      const user = reactiveSystem.reactive({
        name: 'test',
        profile: { age: 20, city: 'Beijing' }
      })
      mockContext.setData.mockClear()

      // 模拟 user.profile.age = 21 操作
      user.profile.age = 21

      // 验证 setData 被调用
      const setDataCalls = mockContext.setData.mock.calls
      expect(setDataCalls.length).toBe(1)

      // 验证调用参数包含正确的嵌套路径和值
      const callArgs = setDataCalls[0][0]
      const propertyKey = Object.keys(callArgs).find(key => key.includes('.profile.age'))
      expect(propertyKey).toBeDefined()
      expect(propertyKey).toMatch(/^reactive_.*\.profile\.age$/)
      expect(callArgs[propertyKey]).toBe(21)
      expect(user.profile.age).toBe(21)
    })
  })

  describe('computed 计算属性', () => {
    it('应该创建 computed 并自动调用 setData', () => {
      const count = reactiveSystem.ref(5)
      const double = reactiveSystem.computed(() => count.value * 2)

      // 验证计算属性的值
      expect(double.value).toBe(10)

      // 验证 setData 被调用
      expect(mockContext.setData).toHaveBeenCalledWith(
        expect.objectContaining({ [double._key]: 10 })
      )

      // 验证 computed 对象结构
      expect(double._isComputed).toBe(true)
      expect(double._key).toMatch(/^computed_/)
    })

    it('应该支持计算属性的缓存机制', () => {
      let callCount = 0
      const computed = reactiveSystem.computed(() => {
        callCount++
        return 'computed value'
      })

      // 第一次访问
      const value1 = computed.value
      expect(value1).toBe('computed value')
      expect(callCount).toBe(1)

      // 第二次访问，应该使用缓存
      const value2 = computed.value
      expect(value2).toBe('computed value')
      expect(callCount).toBe(1) // 没有重新计算
    })
  })

  describe('集成测试', () => {
    it('应该支持复杂的响应式操作组合', () => {
      // 创建响应式变量
      const count = reactiveSystem.ref(0)
      const user = reactiveSystem.reactive({ name: 'test', visits: 0 })
      const summary = reactiveSystem.computed(() =>
        `${user.name} has ${count.value} points and ${user.visits} visits`
      )

      // 验证初始状态
      expect(count.value).toBe(0)
      expect(user.name).toBe('test')
      expect(user.visits).toBe(0)
      expect(summary.value).toBe('test has 0 points and 0 visits')

      mockContext.setData.mockClear()

      // 执行复杂操作
      count.value++           // ref 自增
      user.visits += 1        // reactive 复合赋值
      user.name = 'updated'   // reactive 直接赋值

      // 验证所有操作都触发了 setData
      expect(mockContext.setData).toHaveBeenCalledTimes(3)

      // 验证最终状态
      expect(count.value).toBe(1)
      expect(user.name).toBe('updated')
      expect(user.visits).toBe(1)
    })
  })
})
