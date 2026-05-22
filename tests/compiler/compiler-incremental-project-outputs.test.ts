import { describe, expect, it } from 'vitest'
import { promises as fs } from 'fs'
import { join } from 'path'
import { Vue3MiniprogramCompiler } from '@/compiler/compiler.js'
import { createTestFile, getTestDir, readTestFile, removeTestFile } from '../setup.js'

describe('compiler incremental project outputs', () => {
  it('新增页面单文件编译后可刷新 app.json 页面列表', async () => {
    const compiler = createCompiler()
    const appPath = await createTestFile('app.vue', createAppVue())
    const pagePath = await createTestFile('pages/home/index.vue', createStaticPage('Home'))

    try {
      await compiler.compileFile(appPath)
      await compiler.compileFile(pagePath)
      await (compiler as any).refreshProjectOutputs()

      const appJson = JSON.parse(await readTestFile('output/app.json'))

      expect(appJson.pages).toContain('pages/home/index')
    } finally {
      await removeTestFile('app.vue')
      await removeTestFile('pages/home/index.vue')
    }
  })

  it('删除页面后可刷新 app.json 与 runtime injection 状态', async () => {
    const compiler = createCompiler()
    const appPath = await createTestFile('app.vue', createAppVue())
    const reactivePagePath = await createTestFile('pages/reactive/index.vue', createReactivePage())
    const staticPagePath = await createTestFile('pages/static/index.vue', createStaticPage('Static'))

    try {
      await compiler.compile()
      await fs.unlink(reactivePagePath)
      await (compiler as any).removeSourceFile(reactivePagePath)

      const appJson = JSON.parse(await readTestFile('output/app.json'))
      const runtimeInjection = await readTestFile('output/runtime-injection.js')

      expect(appJson.pages).not.toContain('pages/reactive/index')
      expect(appJson.pages).toContain('pages/static/index')
      expect(runtimeInjection).not.toContain('function ref(value, context)')
    } finally {
      await removeTestFile('app.vue')
      await removeTestFile('pages/reactive/index.vue')
      await removeTestFile('pages/static/index.vue')
    }
  })
})

function createCompiler(): Vue3MiniprogramCompiler {
  return new Vue3MiniprogramCompiler({
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
}

function createAppVue(): string {
  return `<template>
  <view><slot /></view>
</template>

<script setup lang="ts">
const appName = 'Incremental Project Outputs'
</script>`
}

function createStaticPage(title: string): string {
  return `<template>
  <view><text>{{ title }}</text></view>
</template>

<script setup lang="ts">
const title = '${title}'
</script>`
}

function createReactivePage(): string {
  return `<template>
  <view><text>{{ count }}</text></view>
</template>

<script setup lang="ts">
import { ref } from 'vue'

const count = ref(0)
</script>`
}
