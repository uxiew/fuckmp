/**
 * useId 在原生微信小程序目标下的明确降级测试。
 */

import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { join } from 'path'
import { parse } from '@babel/parser'
import { Vue3MiniprogramCompiler } from '@/compiler/compiler.js'
import { createTestFile, getTestDir, readTestFile, removeTestFile } from '../setup.js'

describe('useId 原生目标降级', () => {
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

  it('应该擦除 useId 调用并输出可解释降级记录', async () => {
    const componentContent = `<template>
  <view>
    <label :for="fieldId">Name</label>
    <input :id="fieldId" />
  </view>
</template>

<script setup lang="ts">
import { useId } from 'vue'

const fieldId = useId()
</script>`

    const componentPath = await createTestFile('components/UseIdCard.vue', componentContent)
    testFiles.push('components/UseIdCard.vue')

    await compiler.compileFile(componentPath)

    const jsContent = await readTestFile('output/components/UseIdCard.js')

    expect(() => parse(jsContent, { sourceType: 'script' })).not.toThrow()

    expect(jsContent).toContain('useId 降级')
    expect(jsContent).toContain('SSR-stable application-scoped ids')
    expect(jsContent).toContain('useId variables: fieldId')

    expect(jsContent).not.toContain('useId(')
    expect(jsContent).not.toContain('"fieldId": "useId()"')
    expect(jsContent).not.toContain('__useId')
    expect(jsContent).not.toContain('app.config.idPrefix')
  })
})
