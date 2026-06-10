/**
 * defineOptions 在原生微信小程序目标下的明确降级测试。
 */

import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { join } from 'path'
import { parse } from '@babel/parser'
import { Vue3MiniprogramCompiler } from '@/compiler/compiler.js'
import { createTestFile, getTestDir, readTestFile, removeTestFile } from '../setup.js'

describe('defineOptions 原生目标降级', () => {
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

  it('应该为 defineOptions 输出可解释降级记录而不是静默忽略', async () => {
    const componentContent = `<template>
  <view class="options-card">
    <text>Options</text>
  </view>
</template>

<script setup lang="ts">
defineOptions({
  name: 'OptionsCard',
  inheritAttrs: false,
  customOptions: {
    feature: 'native-first'
  }
})
</script>`

    const componentPath = await createTestFile('components/OptionsCard.vue', componentContent)
    testFiles.push('components/OptionsCard.vue')

    await compiler.compileFile(componentPath)

    const jsContent = await readTestFile('output/components/OptionsCard.js')

    expect(() => parse(jsContent, { sourceType: 'script' })).not.toThrow()

    expect(jsContent).toContain('defineOptions 降级')
    expect(jsContent).toContain('option keys: name, inheritAttrs, customOptions')

    expect(jsContent).not.toContain('defineOptions(')
    expect(jsContent).not.toContain('__defineOptions')
    expect(jsContent).not.toContain('"customOptions":')
  })
})
