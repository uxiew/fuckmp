/**
 * Vue 3.5 响应式 props 解构到原生 properties 的映射测试。
 */

import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { parse } from '@babel/parser'
import { join } from 'path'
import { Vue3MiniprogramCompiler } from '@/compiler/compiler.js'
import { createTestFile, getTestDir, readTestFile, removeTestFile } from '../setup.js'

describe('Vue 3.5 响应式 props 解构原生映射', () => {
  let compiler: Vue3MiniprogramCompiler
  let testFiles: string[] = []

  beforeEach(() => {
    compiler = new Vue3MiniprogramCompiler({
      input: getTestDir(),
      output: join(getTestDir(), 'output'),
      appId: 'test-app-id',
      features: {
        scriptSetup: true,
        typescript: true,
        scss: true,
        compositionApi: true,
        emits: true,
        slots: true,
        provide: false
      }
    })
  })

  afterEach(async () => {
    for (const file of testFiles) {
      await removeTestFile(file)
    }
    testFiles = []
  })

  it('应该把 defineProps 解构默认值和别名编译为原生 properties 与模板属性访问', async () => {
    const source = `<template>
  <view class="props-card">
    <text>{{ displayTitle }}</text>
    <text>{{ count }}</text>
    <text>{{ active }}</text>
    <text>{{ labels.length }}</text>
  </view>
</template>

<script setup lang="ts">
const {
  title: displayTitle = 'Hello Native',
  count = 7,
  active = true,
  labels = ['one', 'two']
} = defineProps<{
  title?: string
  count?: number
  active?: boolean
  labels?: string[]
}>()
</script>`

    const filePath = await createTestFile('components/ReactivePropsCard.vue', source)
    testFiles.push('components/ReactivePropsCard.vue')

    await compiler.compileFile(filePath)

    const jsContent = await readTestFile('output/components/ReactivePropsCard.js')
    const wxmlContent = await readTestFile('output/components/ReactivePropsCard.wxml')
    expect(() => parse(jsContent, { sourceType: 'script' })).not.toThrow()

    expect(jsContent).toContain('title: {')
    expect(jsContent).toContain('type: String')
    expect(jsContent).toContain('value: "Hello Native"')

    expect(jsContent).toContain('count: {')
    expect(jsContent).toContain('type: Number')
    expect(jsContent).toContain('value: 7')

    expect(jsContent).toContain('active: {')
    expect(jsContent).toContain('type: Boolean')
    expect(jsContent).toContain('value: true')

    expect(jsContent).toContain('labels: {')
    expect(jsContent).toContain('type: Array')
    expect(jsContent).toContain('value: ["one","two"]')

    expect(jsContent).not.toContain('"displayTitle"')
    expect(jsContent).not.toContain('"count": 7')
    expect(wxmlContent).toContain('{{title}}')
    expect(wxmlContent).not.toContain('{{displayTitle}}')
  })

  it('应该把 computed getter 中的 props 解构别名改写为原生 property 访问', async () => {
    const source = `<template>
  <view class="props-card">
    <text>{{ summary }}</text>
  </view>
</template>

<script setup lang="ts">
import { computed } from 'vue'

const {
  title: displayTitle = 'Hello Native',
  count = 7
} = defineProps<{
  title?: string
  count?: number
}>()

const summary = computed(() => displayTitle + ':' + count)
</script>`

    const filePath = await createTestFile('components/ReactivePropsComputed.vue', source)
    testFiles.push('components/ReactivePropsComputed.vue')

    await compiler.compileFile(filePath)

    const jsContent = await readTestFile('output/components/ReactivePropsComputed.js')
    const wxmlContent = await readTestFile('output/components/ReactivePropsComputed.wxml')
    expect(() => parse(jsContent, { sourceType: 'script' })).not.toThrow()

    expect(jsContent).toContain('title: {')
    expect(jsContent).toContain('value: "Hello Native"')
    expect(jsContent).toContain('count: {')
    expect(jsContent).toContain('value: 7')

    expect(jsContent).toContain('return this.data.title + \':\' + this.data.count')
    expect(jsContent).not.toContain('this.data.displayTitle')
    expect(jsContent).not.toContain('"displayTitle"')
    expect(wxmlContent).toContain('{{summary}}')
  })

  it('应该把生命周期回调中的 props 解构别名改写为原生 property 访问', async () => {
    const source = `<template>
  <view class="props-card">
    <text>{{ title }}</text>
  </view>
</template>

<script setup lang="ts">
import { onMounted } from 'vue'

const {
  title: displayTitle = 'Hello Native'
} = defineProps<{
  title?: string
}>()

onMounted(() => {
  console.log(displayTitle)
})
</script>`

    const filePath = await createTestFile('components/ReactivePropsLifecycle.vue', source)
    testFiles.push('components/ReactivePropsLifecycle.vue')

    await compiler.compileFile(filePath)

    const jsContent = await readTestFile('output/components/ReactivePropsLifecycle.js')
    expect(() => parse(jsContent, { sourceType: 'script' })).not.toThrow()

    expect(jsContent).toContain('title: {')
    expect(jsContent).toContain('value: "Hello Native"')
    expect(jsContent).toContain('attached()')
    expect(jsContent).toContain('console.log(this.data.title)')
    expect(jsContent).not.toContain('console.log(displayTitle)')
  })

  it('应该把 setup 方法中的 props 解构别名改写为原生 property 访问', async () => {
    const source = `<template>
  <view class="props-card" @tap="handleTap">
    <text>{{ title }}</text>
  </view>
</template>

<script setup lang="ts">
const {
  title: displayTitle = 'Hello Native'
} = defineProps<{
  title?: string
}>()

const handleTap = () => {
  console.log(displayTitle)
}
</script>`

    const filePath = await createTestFile('components/ReactivePropsMethod.vue', source)
    testFiles.push('components/ReactivePropsMethod.vue')

    await compiler.compileFile(filePath)

    const jsContent = await readTestFile('output/components/ReactivePropsMethod.js')
    const wxmlContent = await readTestFile('output/components/ReactivePropsMethod.wxml')
    expect(() => parse(jsContent, { sourceType: 'script' })).not.toThrow()

    expect(wxmlContent).toContain('bind:tap="handleTap"')
    expect(jsContent).toContain('handleTap()')
    expect(jsContent).toContain('console.log(this.data.title)')
    expect(jsContent).not.toContain('console.log(displayTitle)')
  })
})
