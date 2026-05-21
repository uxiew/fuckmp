/**
 * defineExpose 在原生微信小程序目标下的明确降级测试。
 */

import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { parse } from '@babel/parser'
import { join } from 'path'
import { RuntimeBundler } from '@/compiler/runtime-bundler.js'
import { RuntimeInjector } from '@/compiler/runtime-injector.js'
import { Vue3MiniprogramCompiler } from '@/compiler/compiler.js'
import { createTestFile, getTestDir, readTestFile, removeTestFile } from '../setup.js'
import type { Vue3FeatureUsage } from '@/compiler/runtime-injector.js'

describe('defineExpose 原生目标降级', () => {
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

  it('应该为 defineExpose 输出可解释的降级记录而不是静默误支持', async () => {
    const source = `<template>
  <view class="expose-card">
    <button @tap="focus">Focus</button>
  </view>
</template>

<script setup lang="ts">
import { ref } from 'vue'

const count = ref(0)

function focus() {
  count.value++
}

defineExpose({
  focus,
  count
})
</script>`

    const filePath = await createTestFile('components/ExposeCard.vue', source)
    testFiles.push('components/ExposeCard.vue')

    await compiler.compileFile(filePath)

    const jsContent = await readTestFile('output/components/ExposeCard.js')
    expect(() => parse(jsContent, { sourceType: 'script' })).not.toThrow()

    expect(jsContent).toContain('defineExpose 降级')
    expect(jsContent).toContain('exposed keys: focus, count')
    expect(jsContent).not.toContain('__expose')
    expect(jsContent).not.toContain('defineExpose(')
  })

  it('defineExpose 不应该要求额外伪 runtime 模块', () => {
    const injector = new RuntimeInjector({
      target: 'miniprogram',
      version: '3.0.0',
      features: {
        compositionApi: true,
        reactivity: true,
        lifecycle: true,
        directives: true,
        provideInject: true,
        slots: true
      },
      optimization: {
        treeShaking: true,
        minify: false,
        splitChunks: false
      }
    })
    const bundler = new RuntimeBundler(injector.getConfig())
    const featureUsage: Vue3FeatureUsage = {
      reactivity: { ref: false, reactive: false, computed: false, watch: false, watchEffect: false },
      composition: { setup: true, defineProps: false, defineEmits: false, defineExpose: true, provide: false, inject: false },
      directives: { vIf: false, vFor: false, vModel: false, vShow: false, vOn: false, vBind: false },
      lifecycle: { onMounted: false, onUnmounted: false, onUpdated: false, onBeforeMount: false, onBeforeUnmount: false, onBeforeUpdate: false },
      advanced: { slots: false, teleport: false, suspense: false, keepAlive: false, transition: false }
    }

    expect(bundler.getRequiredModules(featureUsage)).toEqual(['core'])
  })
})
