/**
 * withDefaults(defineProps()) 原生 properties 默认值映射测试。
 */

import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { parse } from '@babel/parser'
import { join } from 'path'
import { Vue3MiniprogramCompiler } from '@/compiler/compiler.js'
import { createTestFile, getTestDir, readTestFile, removeTestFile } from '../setup.js'

describe('withDefaults defineProps 原生默认值映射', () => {
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

  it('应该把 withDefaults(defineProps<T>(), defaults) 编译为 Component.properties 默认值', async () => {
    const source = `<template>
  <view class="props-card">
    <text>{{ props.title }}</text>
    <text>{{ props.count }}</text>
    <text>{{ props.active }}</text>
    <text>{{ props.tags.length }}</text>
  </view>
</template>

<script setup lang="ts">
const props = withDefaults(defineProps<{
  title?: string
  count?: number
  active?: boolean
  tags?: string[]
}>(), {
  title: 'Untitled',
  count: 3,
  active: true,
  tags: () => ['vue', 'wx']
})
</script>`

    const filePath = await createTestFile('components/DefaultsCard.vue', source)
    testFiles.push('components/DefaultsCard.vue')

    await compiler.compileFile(filePath)

    const jsContent = await readTestFile('output/components/DefaultsCard.js')
    expect(() => parse(jsContent, { sourceType: 'script' })).not.toThrow()

    expect(jsContent).toContain('title: {')
    expect(jsContent).toContain('type: String')
    expect(jsContent).toContain('value: "Untitled"')

    expect(jsContent).toContain('count: {')
    expect(jsContent).toContain('type: Number')
    expect(jsContent).toContain('value: 3')

    expect(jsContent).toContain('active: {')
    expect(jsContent).toContain('type: Boolean')
    expect(jsContent).toContain('value: true')

    expect(jsContent).toContain('tags: {')
    expect(jsContent).toContain('type: Array')
    expect(jsContent).toContain('value: ["vue","wx"]')
    expect(jsContent).not.toContain('"props": "withDefaults')
  })
})
