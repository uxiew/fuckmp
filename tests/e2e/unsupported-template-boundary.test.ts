/**
 * 仍不宣称支持的 Vue 模板能力在原生目标下的边界测试。
 */

import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { join } from 'path'
import { parse } from '@babel/parser'
import { Vue3MiniprogramCompiler } from '@/compiler/compiler.js'
import { createTestFile, getTestDir, readTestFile, removeTestFile } from '../setup.js'

describe('unsupported Vue template capabilities 原生目标边界', () => {
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

  it('应该为 scoped slots / dynamic slots 输出明确边界而不是伪 runtime', async () => {
    const componentContent = `<template>
  <slot name="item" :row="row" />
</template>

<script setup lang="ts">
defineProps<{ row: { title: string } }>()
</script>`
    const pageContent = `<template>
  <ScopedSlotCard :row="row">
    <template #[activeSlot]="slotProps">
      <view>{{ slotProps.row.title }}</view>
    </template>
  </ScopedSlotCard>
</template>

<script setup lang="ts">
import ScopedSlotCard from '@/components/ScopedSlotCard.vue'

const activeSlot = 'item'
const row = { title: 'Native boundary' }
</script>`

    const componentPath = await createTestFile('components/ScopedSlotCard.vue', componentContent)
    const pagePath = await createTestFile('pages/ScopedSlotPage.vue', pageContent)
    testFiles.push('components/ScopedSlotCard.vue', 'pages/ScopedSlotPage.vue')

    await compiler.compileFile(componentPath)
    await compiler.compileFile(pagePath)

    const componentJs = await readTestFile('output/components/ScopedSlotCard.js')
    const pageJs = await readTestFile('output/pages/ScopedSlotPage.js')

    expect(() => parse(componentJs, { sourceType: 'script' })).not.toThrow()
    expect(() => parse(pageJs, { sourceType: 'script' })).not.toThrow()

    expect(componentJs).toContain('scoped slots / dynamic slots 降级')
    expect(pageJs).toContain('scoped slots / dynamic slots 降级')
    expect(componentJs).toContain('不生成 scoped/dynamic slots runtime')
    expect(pageJs).toContain('不生成 scoped/dynamic slots runtime')

    for (const content of [componentJs, pageJs]) {
      expect(content).not.toContain('__scopedSlot')
      expect(content).not.toContain('__dynamicSlot')
      expect(content).not.toContain('__slotsRuntime')
      expect(content).not.toContain('template runtime')
    }
  })

  it('应该为 transition / keep-alive 输出明确边界而不是伪 runtime', async () => {
    const componentContent = `<template>
  <view class="shell">
    <Transition name="fade">
      <view v-if="visible">Visible</view>
    </Transition>
    <KeepAlive>
      <UserCard />
    </KeepAlive>
  </view>
</template>

<script setup lang="ts">
import UserCard from '@/components/UserCard.vue'

const visible = true
</script>`

    const componentPath = await createTestFile('components/TransitionKeepAliveCard.vue', componentContent)
    testFiles.push('components/TransitionKeepAliveCard.vue')

    await compiler.compileFile(componentPath)

    const jsContent = await readTestFile('output/components/TransitionKeepAliveCard.js')

    expect(() => parse(jsContent, { sourceType: 'script' })).not.toThrow()

    expect(jsContent).toContain('transition / keep-alive 降级')
    expect(jsContent).toContain('不生成 transition/keep-alive runtime')
    expect(jsContent).not.toContain('__transition')
    expect(jsContent).not.toContain('__keepAlive')
    expect(jsContent).not.toContain('transition runtime')
  })
})
