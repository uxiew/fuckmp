/**
 * defineModel + v-model 原生微信小程序闭环缺口测试。
 */

import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { join } from 'path'
import { parse } from '@babel/parser'
import { Vue3MiniprogramCompiler } from '@/compiler/compiler.js'
import { createTestFile, getTestDir, readTestFile, removeTestFile } from '../setup.js'

describe('defineModel + v-model 原生闭环', () => {
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

  it('应该把 defineModel 与组件 v-model 编译为 properties、update 事件和原生 handler', async () => {
    const childContent = `<template>
  <view class="model-input">
    <input v-model="modelValue" />
    <input v-model="title" />
  </view>
</template>

<script setup lang="ts">
const modelValue = defineModel<string>({ default: '' })
const title = defineModel<string>('title', { default: 'Untitled' })
</script>`

    const pageContent = `<template>
  <view class="model-page">
    <ModelInput v-model="content" v-model:title="title" />
  </view>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import ModelInput from '@/components/ModelInput.vue'

const content = ref('hello')
const title = ref('initial title')
</script>`

    const childPath = await createTestFile('components/ModelInput.vue', childContent)
    const pagePath = await createTestFile('pages/ModelPage.vue', pageContent)
    testFiles.push('components/ModelInput.vue', 'pages/ModelPage.vue')

    await compiler.compileFile(childPath)
    await compiler.compileFile(pagePath)

    const childJs = await readTestFile('output/components/ModelInput.js')
    const childWxml = await readTestFile('output/components/ModelInput.wxml')
    const pageJs = await readTestFile('output/pages/ModelPage.js')
    const pageWxml = await readTestFile('output/pages/ModelPage.wxml')

    expect(() => parse(childJs, { sourceType: 'script' })).not.toThrow()
    expect(() => parse(pageJs, { sourceType: 'script' })).not.toThrow()

    // 子组件 defineModel 应生成原生 properties，而不是落入 data 或伪 runtime。
    expect(childJs).toContain('modelValue: {')
    expect(childJs).toContain('title: {')

    // 子组件内部 input v-model 应使用原生 input handler，并向父组件发出 update:* 事件。
    expect(childWxml).toContain('value="{{modelValue}}"')
    expect(childWxml).toContain('bindinput="_handleInput_modelValue"')
    expect(childJs).toContain("this.triggerEvent('update:modelValue', value)")
    expect(childWxml).toContain('value="{{title}}"')
    expect(childWxml).toContain('bindinput="_handleInput_title"')
    expect(childJs).toContain("this.triggerEvent('update:title', value)")

    // 父组件自定义组件 v-model 应转换为属性绑定 + update:* 事件监听。
    expect(pageWxml).toContain('<model-input')
    expect(pageWxml).toContain('model-value="{{content}}"')
    expect(pageWxml).toContain('bind:update:modelValue="_handleUpdate_content"')
    expect(pageWxml).toContain('title="{{title}}"')
    expect(pageWxml).toContain('bind:update:title="_handleUpdate_title"')

    // 父页面 update handler 应从 event.detail 回写 setData。
    expect(pageJs).toContain('_handleUpdate_content(event)')
    expect(pageJs).toContain('_handleUpdate_title(event)')
    expect(pageJs).toContain('content: event.detail')
    expect(pageJs).toContain('title: event.detail')
  })
})
