/**
 * slots / provide / inject 在原生微信小程序目标下的边界测试。
 */

import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { join } from 'path'
import { runInNewContext } from 'node:vm'
import { parse } from '@babel/parser'
import { Vue3MiniprogramCompiler } from '@/compiler/compiler.js'
import { createTestFile, getTestDir, readTestFile, removeTestFile } from '../setup.js'

describe('slots / provide / inject 原生目标边界', () => {
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

  it.each([
    ['带 script setup', '<script setup lang="ts">\ndefineProps<{ title?: string }>()\n</script>'],
    ['不带脚本', '']
  ])('应该把基础 slot 输出为微信原生多插槽组件配置（%s）', async (_, script) => {
    const componentContent = `<template>
  <view class="panel">
    <slot name="header" />
    <slot name="footer" />
    <slot />
  </view>
</template>

${script}`

    const componentPath = await createTestFile('components/NativeSlotPanel.vue', componentContent)
    testFiles.push('components/NativeSlotPanel.vue')

    await compiler.compileFile(componentPath)
    await compiler.refreshProjectOutputs()

    const wxmlContent = await readTestFile('output/components/NativeSlotPanel.wxml')
    const jsonContent = await readTestFile('output/components/NativeSlotPanel.json')
    const jsContent = await readTestFile('output/components/NativeSlotPanel.js')
    const runtime = await readTestFile('output/runtime-injection.js')
    const json = JSON.parse(jsonContent)
    const runtimeModule = { exports: {} }
    let options: unknown
    runInNewContext(runtime, { module: runtimeModule })
    runInNewContext(jsContent, {
      require: () => runtimeModule.exports,
      Component: (config: { options?: unknown }) => { options = config.options }
    })

    expect(wxmlContent).toContain('<slot name="header"></slot>')
    expect(wxmlContent).toContain('<slot name="footer"></slot>')
    expect(wxmlContent).toContain('<slot></slot>')
    expect(options).toEqual({ multipleSlots: true })
    expect(json.styleIsolation).toBe('apply-shared')
    expect(json.options).toBeUndefined()
  })

  it('应该擦除 provide/inject 调用并输出可解释降级记录', async () => {
    const componentContent = `<template>
  <view>{{ theme }}</view>
</template>

<script setup lang="ts">
import { provide, inject } from 'vue'

provide('theme', 'dark')
const theme = inject('theme', 'light')
</script>`

    const componentPath = await createTestFile('components/ProvideInjectCard.vue', componentContent)
    testFiles.push('components/ProvideInjectCard.vue')

    await compiler.compileFile(componentPath)

    const jsContent = await readTestFile('output/components/ProvideInjectCard.js')

    expect(() => parse(jsContent, { sourceType: 'script' })).not.toThrow()

    expect(jsContent).toContain('provide/inject 降级')
    expect(jsContent).toContain('Vue dependency injection')
    expect(jsContent).toContain('provide/inject keys: theme')

    expect(jsContent).not.toContain('provide(')
    expect(jsContent).not.toContain('inject(')
    expect(jsContent).not.toContain('"theme": "inject')
    expect(jsContent).not.toContain('__provide')
    expect(jsContent).not.toContain('__inject')
  })
})
