/**
 * defineSlots 在原生微信小程序目标下的类型宏擦除/明确降级测试。
 */

import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { join } from 'path'
import { parse } from '@babel/parser'
import { Vue3MiniprogramCompiler } from '@/compiler/compiler.js'
import { createTestFile, getTestDir, readTestFile, removeTestFile } from '../setup.js'

describe('defineSlots 原生目标降级', () => {
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

  it('应该擦除 defineSlots 类型宏并输出可解释降级记录', async () => {
    const componentContent = `<template>
  <view class="slot-card">
    <slot name="header" />
    <slot />
  </view>
</template>

<script setup lang="ts">
const slots = defineSlots<{
  header(props: { title: string }): any
  default(props: {}): any
}>()
</script>`

    const componentPath = await createTestFile('components/SlotCard.vue', componentContent)
    testFiles.push('components/SlotCard.vue')

    await compiler.compileFile(componentPath)

    const jsContent = await readTestFile('output/components/SlotCard.js')

    expect(() => parse(jsContent, { sourceType: 'script' })).not.toThrow()

    expect(jsContent).toContain('defineSlots 降级')
    expect(jsContent).toContain('type-only slots macro erased')

    expect(jsContent).not.toContain('defineSlots(')
    expect(jsContent).not.toContain('__slots')
    expect(jsContent).not.toContain('"slots": "defineSlots')
  })
})
