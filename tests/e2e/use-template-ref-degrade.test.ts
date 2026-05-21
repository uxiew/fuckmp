/**
 * Vue 3.5 useTemplateRef 在原生微信小程序目标下的明确降级测试。
 */

import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { join } from 'path'
import { parse } from '@babel/parser'
import { Vue3MiniprogramCompiler } from '@/compiler/compiler.js'
import { createTestFile, getTestDir, readTestFile, removeTestFile } from '../setup.js'

describe('useTemplateRef 原生目标降级', () => {
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

  it('应该为 useTemplateRef 输出可解释的降级记录而不是落入 data 或伪 runtime', async () => {
    const componentContent = `<template>
  <view class="ref-card" ref="panel">
    <text>Template Ref</text>
  </view>
</template>

<script setup lang="ts">
import { useTemplateRef } from 'vue'

const panel = useTemplateRef<unknown>('panel')
</script>`

    const componentPath = await createTestFile('components/RefCard.vue', componentContent)
    testFiles.push('components/RefCard.vue')

    await compiler.compileFile(componentPath)

    const jsContent = await readTestFile('output/components/RefCard.js')
    const wxmlContent = await readTestFile('output/components/RefCard.wxml')

    expect(() => parse(jsContent, { sourceType: 'script' })).not.toThrow()

    expect(jsContent).toContain('useTemplateRef 降级')
    expect(jsContent).toContain('template refs: panel')

    expect(jsContent).not.toContain('useTemplateRef(')
    expect(jsContent).not.toContain('"panel": "useTemplateRef')
    expect(jsContent).not.toContain('__templateRef')

    // WXML ref attribute 暂不伪造运行时桥接；保留原生模板输出路径。
    expect(wxmlContent).toContain('ref="panel"')
  })
})
