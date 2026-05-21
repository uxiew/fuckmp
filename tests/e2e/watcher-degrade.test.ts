/**
 * watch/watchEffect/onWatcherCleanup 在原生微信小程序目标下的明确降级测试。
 */

import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { join } from 'path'
import { parse } from '@babel/parser'
import { Vue3MiniprogramCompiler } from '@/compiler/compiler.js'
import { createTestFile, getTestDir, readTestFile, removeTestFile } from '../setup.js'

describe('watch/watchEffect/onWatcherCleanup 原生目标降级', () => {
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

  it('应该擦除 watcher 调用并输出可解释降级记录', async () => {
    const componentContent = `<template>
  <view>{{ count }}</view>
</template>

<script setup lang="ts">
import { ref, watch, watchEffect, onWatcherCleanup } from 'vue'

const count = ref(0)

watch(count, () => {
  onWatcherCleanup(() => {})
})

watchEffect((onCleanup) => {
  onCleanup(() => {})
})
</script>`

    const componentPath = await createTestFile('components/WatcherCard.vue', componentContent)
    testFiles.push('components/WatcherCard.vue')

    await compiler.compileFile(componentPath)

    const jsContent = await readTestFile('output/components/WatcherCard.js')

    expect(() => parse(jsContent, { sourceType: 'script' })).not.toThrow()

    expect(jsContent).toContain('watch/watchEffect 降级')
    expect(jsContent).toContain('onWatcherCleanup')
    expect(jsContent).toContain('Vue 3.5 watcher cleanup')

    expect(jsContent).not.toContain('watch(count')
    expect(jsContent).not.toContain('watchEffect(')
    expect(jsContent).not.toContain('function watch(source, callback)')
    expect(jsContent).not.toContain('__watchers')
  })
})
