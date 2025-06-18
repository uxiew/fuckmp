/**
 * 脚本转换器测试
 */

import { describe, it, expect } from 'vitest'
import { ScriptTransformer } from '@/transformer/script-transformer'
import { readFixture, parseVueScript, transformScript, assertObjectContains, assertFunctionBodyContains } from '../utils/test-helpers'

describe('ScriptTransformer', () => {
  const transformer = new ScriptTransformer()

  describe('响应式数据转换', () => {
    it('应该正确转换ref变量', async () => {
      const script = `
        import { ref } from 'vue'
        const count = ref(0)
        const message = ref('hello')
      `

      const parseResult = await parseVueScript(`<template><view></view></template>
<script setup lang="ts">${script}</script>`)

      const result = await transformer.transformScript(parseResult, 'test.vue', false)

      expect(result.context.data).toHaveProperty('count', 0)
      expect(result.context.data).toHaveProperty('message', 'hello')
    })

    it('应该正确转换reactive对象', async () => {
      const script = `
        import { reactive } from 'vue'
        const userInfo = reactive({
          id: 1001,
          name: '张三',
          email: 'test@example.com'
        })
      `

      const parseResult = await parseVueScript(`<template><view></view></template>
<script setup lang="ts">${script}</script>`)

      const result = await transformer.transformScript(parseResult, 'test.vue', false)

      expect(result.context.data).toHaveProperty('userInfo')
      const userInfo = result.context.data.userInfo

      // reactive 对象应该被解析为实际的对象
      expect(typeof userInfo).toBe('object')
      expect(userInfo.id).toBe(1001)
      expect(userInfo.name).toBe('张三')
      expect(userInfo.email).toBe('test@example.com')
    })

    it('应该正确转换computed属性', async () => {
      const script = `
        import { ref, computed } from 'vue'
        const count = ref(0)
        const doubleCount = computed(() => count.value * 2)
      `

      const parseResult = await parseVueScript(`<template><view></view></template>
<script setup lang="ts">${script}</script>`)

      const result = await transformer.transformScript(parseResult, 'test.vue', false)

      expect(result.context.data).toHaveProperty('count', 0)
      expect(result.context.computed).toHaveProperty('doubleCount')

      const doubleCountComputed = result.context.computed.doubleCount
      expect(doubleCountComputed).toHaveProperty('getter')
      // computed 属性中的 count.value 应该被转换为 this.data.count
      expect(doubleCountComputed.getter).toContain('this.data.count * 2')
    })
  })

  describe('函数转换', () => {
    it('应该正确转换简单箭头函数', async () => {
      const script = `
        const increment = () => {
          console.log('increment called')
        }
      `

      const parseResult = await parseVueScript(`<template><view></view></template>
<script setup lang="ts">${script}</script>`)

      const result = await transformer.transformScript(parseResult, 'test.vue', false)

      expect(result.context.methods).toHaveProperty('increment')
      const incrementMethod = result.context.methods.increment
      expect(incrementMethod).toHaveProperty('name', 'increment')
      expect(incrementMethod).toHaveProperty('isArrow', true)
      expect(incrementMethod).toHaveProperty('body')
      expect(incrementMethod.body).toContain('console.log')
    })

    it('应该正确转换带参数的箭头函数', async () => {
      const script = `
        const handleClick = (action: string) => {
          console.log('Action:', action)
          return action.toUpperCase()
        }
      `

      const parseResult = await parseVueScript(`<template><view></view></template>
<script setup lang="ts">${script}</script>`)

      const result = await transformer.transformScript(parseResult, 'test.vue', false)

      expect(result.context.methods).toHaveProperty('handleClick')
      const handleClickMethod = result.context.methods.handleClick
      expect(handleClickMethod.body).toContain('action')
      expect(handleClickMethod.body).toContain('console.log')
      expect(handleClickMethod.body).toContain('toUpperCase')
    })

    it('应该正确转换复杂函数体', async () => {
      const script = `
        const complexFunction = (param: string) => {
          if (param === 'test') {
            console.log('Test mode')
            return { success: true, data: 'test' }
          } else {
            console.log('Normal mode')
            return { success: false, error: 'Invalid param' }
          }
        }
      `

      const parseResult = await parseVueScript(`<template><view></view></template>
<script setup lang="ts">${script}</script>`)

      const result = await transformer.transformScript(parseResult, 'test.vue', false)

      expect(result.context.methods).toHaveProperty('complexFunction')
      const complexMethod = result.context.methods.complexFunction

      assertFunctionBodyContains(complexMethod.body, [
        'if',
        'param === \'test\'',
        'console.log',
        'return',
        'success',
        'data'
      ])
    })
  })

  describe('完整文件转换', () => {
    it('应该正确转换profile.vue文件', async () => {
      const vueContent = readFixture('profile.vue')
      const result = await transformScript(vueContent, true) // 作为页面处理

      // 检查响应式数据
      expect(result.context.data).toHaveProperty('userInfo')
      const userInfo = result.context.data.userInfo
      expect(userInfo).toHaveProperty('id', 1001)
      expect(userInfo).toHaveProperty('name', '张三')
      expect(userInfo).toHaveProperty('email', 'zhangsan@example.com')
      expect(userInfo).toHaveProperty('avatar', '../assets/images/avatar.png')

      // 检查方法
      expect(result.context.methods).toHaveProperty('formatDate')
      expect(result.context.methods).toHaveProperty('handleMenuClick')

      const formatDateMethod = result.context.methods.formatDate
      expect(formatDateMethod.body).toContain('toLocaleDateString')
      expect(formatDateMethod.body).toContain('zh-CN')

      const handleMenuClickMethod = result.context.methods.handleMenuClick
      expect(handleMenuClickMethod.body).toContain('switch')
      expect(handleMenuClickMethod.body).toContain('action')
      expect(handleMenuClickMethod.body).toContain('wx.showToast')
      expect(handleMenuClickMethod.body).toContain('wx.showModal')
    })

    it('应该正确转换simple-reactive.vue文件', async () => {
      const vueContent = readFixture('simple-reactive.vue')
      const result = await transformScript(vueContent, false) // 作为组件处理

      // 检查数据
      expect(result.context.data).toHaveProperty('count', 0)
      expect(result.context.data).toHaveProperty('state')

      const state = result.context.data.state
      expect(state).toHaveProperty('message', 'Hello Vue3')
      expect(state).toHaveProperty('items')
      expect(state.items).toEqual(['item1', 'item2', 'item3'])

      // 检查计算属性
      expect(result.context.computed).toHaveProperty('doubleCount')
      const doubleCountComputed = result.context.computed.doubleCount
      expect(doubleCountComputed.getter).toContain('count.value * 2')

      // 检查方法
      expect(result.context.methods).toHaveProperty('increment')
      expect(result.context.methods).toHaveProperty('handleComplexAction')

      const incrementMethod = result.context.methods.increment
      expect(incrementMethod.body).toContain('count.value++')

      const complexActionMethod = result.context.methods.handleComplexAction
      expect(complexActionMethod.body).toContain('param')
      expect(complexActionMethod.body).toContain('console.log')
      expect(complexActionMethod.body).toContain('if')
      expect(complexActionMethod.body).toContain('reset')
    })
  })

  describe('边界情况', () => {
    it('应该处理空的script内容', async () => {
      const script = `
        // 空的script
      `

      const parseResult = await parseVueScript(`<template><view></view></template>
<script setup lang="ts">${script}</script>`)

      const result = await transformer.transformScript(parseResult, 'test.vue', false)

      expect(Object.keys(result.context.data)).toHaveLength(0)
      expect(Object.keys(result.context.methods)).toHaveLength(0)
      expect(Object.keys(result.context.computed)).toHaveLength(0)
    })

    it('应该处理只有导入的script', async () => {
      const script = `
        import { ref, reactive } from 'vue'
        import SomeComponent from './SomeComponent.vue'
      `

      const parseResult = await parseVueScript(`<template><view></view></template>
<script setup lang="ts">${script}</script>`)

      const result = await transformer.transformScript(parseResult, 'test.vue', false)

      expect(Object.keys(result.context.data)).toHaveLength(0)
      expect(Object.keys(result.context.methods)).toHaveLength(0)
      expect(result.context.imports.has('ref')).toBe(true)
      expect(result.context.imports.has('reactive')).toBe(true)
      expect(result.context.components.has('SomeComponent')).toBe(true)
    })
  })
})
