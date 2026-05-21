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
})
