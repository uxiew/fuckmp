/**
 * defineProps<T>() 类型声明与 props 命名空间原生映射测试。
 */

import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { parse } from '@babel/parser'
import { join } from 'path'
import { Vue3MiniprogramCompiler } from '@/compiler/compiler.js'
import { createTestFile, getTestDir, readTestFile, removeTestFile } from '../setup.js'

describe('defineProps type-based 原生 properties 映射', () => {
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

  it('应该把 defineProps<T>() 的 props.xxx 访问编译为原生 property 访问', async () => {
    const source = `<template>
  <view class="props-card" @tap="handleTap">
    <text>{{ props.title }}</text>
    <text>{{ props.count + 1 }}</text>
    <text>{{ props.tags.length }}</text>
    <text>{{ summary }}</text>
  </view>
</template>

<script setup lang="ts">
import { computed } from 'vue'

const props = defineProps<{
  title: string
  count?: number
  tags?: string[]
}>()

const summary = computed(() => props.title + ':' + props.count)

const handleTap = () => {
  console.log(props.title, props.tags.length)
}
</script>`

    const filePath = await createTestFile('components/TypePropsCard.vue', source)
    testFiles.push('components/TypePropsCard.vue')

    await compiler.compileFile(filePath)

    const jsContent = await readTestFile('output/components/TypePropsCard.js')
    const wxmlContent = await readTestFile('output/components/TypePropsCard.wxml')
    expect(() => parse(jsContent, { sourceType: 'script' })).not.toThrow()

    expect(jsContent).toContain('title: {')
    expect(jsContent).toContain('type: String')
    expect(jsContent).toContain('count: {')
    expect(jsContent).toContain('type: Number')
    expect(jsContent).toContain('tags: {')
    expect(jsContent).toContain('type: Array')

    expect(wxmlContent).toContain('{{title}}')
    expect(wxmlContent).toContain('{{count + 1}}')
    expect(wxmlContent).toContain('{{tags.length}}')
    expect(wxmlContent).not.toContain('props.')

    expect(jsContent).toContain("return this.properties.title + ':' + this.properties.count")
    expect(jsContent).toContain('console.log(this.properties.title, this.properties.tags.length)')
    expect(jsContent).not.toContain('props.title')
    expect(jsContent).not.toContain('"props"')
  })
})
