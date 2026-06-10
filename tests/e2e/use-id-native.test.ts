/**
 * useId 在原生微信小程序目标下的原生稳定 ID 映射测试。
 */

import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { join } from 'path'
import { parse } from '@babel/parser'
import { Vue3MiniprogramCompiler } from '@/compiler/compiler.js'
import { createTestFile, getTestDir, readTestFile, removeTestFile } from '../setup.js'

describe('useId 原生目标映射', () => {
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

  it('应该把 useId 编译为原生 data 字段并绑定到 WXML 属性', async () => {
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
    const wxmlContent = await readTestFile('output/components/UseIdCard.wxml')

    expect(() => parse(jsContent, { sourceType: 'script' })).not.toThrow()

    expect(jsContent).toContain('useId 原生映射')
    expect(jsContent).toContain('let __vue3wxUseIdCounter = 0')
    expect(jsContent).toContain('fieldId: `vue3wx-')
    expect(jsContent).toContain('${++__vue3wxUseIdCounter}`')
    expect(jsContent).toMatch(/"fieldId": "vue3wx-[a-z0-9]+-fieldId"/)

    expect(wxmlContent).toContain('for="{{fieldId}}"')
    expect(wxmlContent).toContain('id="{{fieldId}}"')

    expect(jsContent).not.toContain('useId(')
    expect(jsContent).not.toContain('useId 降级')
    expect(jsContent).not.toContain('__useId')
    expect(jsContent).not.toContain('app.config.idPrefix')
  })

  it('页面 useId 应使用稳定 data id 且不生成组件实例计数器', async () => {
    const pageContent = `<template>
  <view>
    <label :for="fieldId">Email</label>
    <input :id="fieldId" />
  </view>
</template>

<script setup lang="ts">
import { useId } from 'vue'

const fieldId = useId()
</script>`

    const pagePath = await createTestFile('pages/UseIdPage.vue', pageContent)
    testFiles.push('pages/UseIdPage.vue')

    await compiler.compileFile(pagePath)

    const jsContent = await readTestFile('output/pages/UseIdPage.js')
    const wxmlContent = await readTestFile('output/pages/UseIdPage.wxml')

    expect(() => parse(jsContent, { sourceType: 'script' })).not.toThrow()

    expect(jsContent).toContain('useId 原生映射')
    expect(jsContent).toMatch(/"fieldId": "vue3wx-[a-z0-9]+-fieldId"/)
    expect(jsContent).not.toContain('__vue3wxUseIdCounter')
    expect(jsContent).not.toContain('attached')

    expect(wxmlContent).toContain('for="{{fieldId}}"')
    expect(wxmlContent).toContain('id="{{fieldId}}"')

    expect(jsContent).not.toContain('useId(')
    expect(jsContent).not.toContain('__useId')
    expect(jsContent).not.toContain('app.config.idPrefix')
  })
})
