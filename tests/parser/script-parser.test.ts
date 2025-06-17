/**
 * 脚本解析器测试
 */

import { describe, it, expect } from 'vitest'
import { ScriptParser } from '@/parser/script-parser'
import { readFixture, parseVueScript } from '../utils/test-helpers'

describe('ScriptParser', () => {
  const parser = new ScriptParser()

  describe('基础解析功能', () => {
    it('应该正确解析简单的变量声明', async () => {
      const script = `
        import { ref } from 'vue'
        const count = ref(0)
        const message = 'hello'
      `

      const result = await parser.parseScript(script, 'test.vue')

      expect(result.variables.size).toBe(2)
      expect(result.variables.has('count')).toBe(true)
      expect(result.variables.has('message')).toBe(true)

      const countVar = result.variables.get('count')!
      expect(countVar.isReactive).toBe(true)
      expect(countVar.macroType).toBe('ref')

      const messageVar = result.variables.get('message')!
      expect(messageVar.isReactive).toBe(false)
      expect(messageVar.init).toBe('hello')
    })

    it('应该正确解析reactive对象', async () => {
      const script = `
        import { reactive } from 'vue'
        const state = reactive({
          name: '张三',
          age: 25,
          items: [1, 2, 3]
        })
      `

      const result = await parser.parseScript(script, 'test.vue')

      expect(result.variables.size).toBe(1)
      expect(result.variables.has('state')).toBe(true)

      const stateVar = result.variables.get('state')!
      expect(stateVar.isReactive).toBe(true)
      expect(stateVar.macroType).toBe('reactive')

      // 检查reactive对象的内容
      const initValue = stateVar.init
      expect(typeof initValue).toBe('object')
      expect(initValue).toHaveProperty('name', '张三')
      expect(initValue).toHaveProperty('age', 25)
      expect(initValue).toHaveProperty('items')
    })

    it('应该正确解析箭头函数', async () => {
      const script = `
        const simpleFunc = () => {
          console.log('hello')
        }

        const paramFunc = (name: string) => {
          return \`Hello \${name}\`
        }

        const expressionFunc = (x: number) => x * 2
      `

      const result = await parser.parseScript(script, 'test.vue')

      expect(result.variables.size).toBe(3)

      const simpleFunc = result.variables.get('simpleFunc')!
      expect(simpleFunc.isReactive).toBe(false)
      expect(typeof simpleFunc.init).toBe('string')
      expect(simpleFunc.init).toContain('=>')
      expect(simpleFunc.init).toContain('console.log')

      const paramFunc = result.variables.get('paramFunc')!
      expect(paramFunc.init).toContain('name')
      expect(paramFunc.init).toContain('return')

      const expressionFunc = result.variables.get('expressionFunc')!
      expect(expressionFunc.init).toContain('x * 2')
    })

    it('应该正确解析computed属性', async () => {
      const script = `
        import { ref, computed } from 'vue'
        const count = ref(0)
        const doubleCount = computed(() => count.value * 2)
      `

      const result = await parser.parseScript(script, 'test.vue')

      expect(result.variables.size).toBe(2)

      const doubleCountVar = result.variables.get('doubleCount')!
      expect(doubleCountVar.isReactive).toBe(true)
      expect(doubleCountVar.macroType).toBe('computed')
      expect(doubleCountVar.init).toContain('count.value * 2')
    })
  })

  describe('复杂场景解析', () => {
    it('应该正确解析profile.vue文件', async () => {
      const vueContent = readFixture('profile.vue')
      const result = await parseVueScript(vueContent)

      // 检查变量数量
      expect(result.variables.size).toBe(3)

      // 检查userInfo响应式对象
      expect(result.variables.has('userInfo')).toBe(true)
      const userInfoVar = result.variables.get('userInfo')!
      expect(userInfoVar.isReactive).toBe(true)
      expect(userInfoVar.macroType).toBe('reactive')

      // 检查函数
      expect(result.variables.has('formatDate')).toBe(true)
      expect(result.variables.has('handleMenuClick')).toBe(true)

      const formatDateVar = result.variables.get('formatDate')!
      expect(formatDateVar.isReactive).toBe(false)
      expect(formatDateVar.init).toContain('=>')
      expect(formatDateVar.init).toContain('toLocaleDateString')

      const handleMenuClickVar = result.variables.get('handleMenuClick')!
      expect(handleMenuClickVar.isReactive).toBe(false)
      expect(handleMenuClickVar.init).toContain('=>')
      expect(handleMenuClickVar.init).toContain('switch')
    })

    it('应该正确解析复杂的对象结构', async () => {
      const script = `
        import { reactive } from 'vue'
        const complexState = reactive({
          user: {
            id: 1001,
            profile: {
              name: '张三',
              settings: {
                theme: 'dark',
                notifications: true
              }
            }
          },
          data: [
            { id: 1, name: 'item1' },
            { id: 2, name: 'item2' }
          ],
          timestamp: new Date(),
          callback: () => console.log('test')
        })
      `

      const result = await parser.parseScript(script, 'test.vue')

      expect(result.variables.size).toBe(1)
      const complexStateVar = result.variables.get('complexState')!
      expect(complexStateVar.isReactive).toBe(true)

      const initValue = complexStateVar.init
      expect(typeof initValue).toBe('object')
      expect(initValue).toHaveProperty('user')
      expect(initValue.user).toHaveProperty('id', 1001)
      expect(initValue.user.profile).toHaveProperty('name', '张三')
      expect(initValue.data).toBeInstanceOf(Array)
      expect(initValue.data).toHaveLength(2)
    })
  })
})
