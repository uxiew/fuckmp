/**
 * 页面输出的 Thin Runtime 边界测试。
 */

import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { join } from 'path'
import { parse } from '@babel/parser'
import { Vue3MiniprogramCompiler } from '@/compiler/compiler.js'
import { createTestFile, getTestDir, readTestFile, removeTestFile } from '../setup.js'

describe('页面输出 Thin Runtime 边界', () => {
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

  it('不使用响应式 API 的页面不应内联旧响应式运行时', async () => {
    const pageContent = `<template>
  <view class="static-page">
    <text>{{ title }}</text>
  </view>
</template>

<script setup lang="ts">
const title = 'Native First'

function noop() {
  console.log(title)
}
</script>`

    const pagePath = await createTestFile('pages/StaticPage.vue', pageContent)
    testFiles.push('pages/StaticPage.vue')

    await compiler.compileFile(pagePath)

    const pageJs = await readTestFile('output/pages/StaticPage.js')

    expect(() => parse(pageJs, { sourceType: 'script' })).not.toThrow()
    expect(pageJs).toContain('Page({')

    expect(pageJs).not.toContain('Vue3 微信小程序响应式运行时库')
    expect(pageJs).not.toContain('const { ref, reactive, computed, watch')
    expect(pageJs).not.toContain('setDataContext')
    expect(pageJs).not.toContain('function watch(source, callback)')
    expect(pageJs).not.toContain('setInterval(checkChanges, 100)')
  })
})
