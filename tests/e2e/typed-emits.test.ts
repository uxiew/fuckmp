/**
 * defineEmits 类型声明到原生 triggerEvent 的映射测试。
 */

import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { join } from 'path'
import { parse } from '@babel/parser'
import { Vue3MiniprogramCompiler } from '@/compiler/compiler.js'
import { createTestFile, getTestDir, readTestFile, removeTestFile } from '../setup.js'

describe('defineEmits 类型声明原生映射', () => {
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

  it('应该从 call signature 类型中提取事件并生成原生 triggerEvent', async () => {
    const source = `<template>
  <view class="emit-card">
    <button @tap="save">Save</button>
    <button @tap="cancel">Cancel</button>
  </view>
</template>

<script setup lang="ts">
const emit = defineEmits<{
  (event: 'save', id: number): void
  (event: 'cancel'): void
}>()

const save = () => {
  emit('save', 7)
}

const cancel = () => {
  emit('cancel')
}
</script>`

    const componentPath = await createTestFile('components/TypedEmitCard.vue', source)
    testFiles.push('components/TypedEmitCard.vue')

    await compiler.compileFile(componentPath)

    const jsContent = await readTestFile('output/components/TypedEmitCard.js')
    const wxmlContent = await readTestFile('output/components/TypedEmitCard.wxml')

    expect(() => parse(jsContent, { sourceType: 'script' })).not.toThrow()

    expect(wxmlContent).toContain('bind:tap="save"')
    expect(wxmlContent).toContain('bind:tap="cancel"')

    expect(jsContent).toContain("this.triggerEvent('save', 7)")
    expect(jsContent).toContain("this.triggerEvent('cancel')")
    expect(jsContent).toContain("_emitSave(detail)")
    expect(jsContent).toContain("this.triggerEvent('save', detail)")
    expect(jsContent).toContain("_emitCancel(detail)")
    expect(jsContent).toContain("this.triggerEvent('cancel', detail)")
    expect(jsContent).not.toContain('unknownEvent')
  })
})
