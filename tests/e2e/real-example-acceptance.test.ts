/**
 * 真实示例工程验收测试。
 */

import { beforeEach, describe, expect, it } from 'vitest'
import { parse } from '@babel/parser'
import { join } from 'path'
import { promises as fs } from 'fs'
import { Vue3MiniprogramCompiler } from '@/compiler/compiler.js'

describe('真实示例工程验收', () => {
  const exampleRoot = join(process.cwd(), 'examples/real-miniprogram')
  const outputRoot = join(process.cwd(), 'test-output/real-miniprogram')

  beforeEach(async () => {
    await fs.rm(outputRoot, { recursive: true, force: true })
  })

  it('编译真实示例并覆盖页面、组件、props/emits、v-model、v-if/v-for/v-show、slots、配置、样式与 runtime 注入', async () => {
    const compiler = new Vue3MiniprogramCompiler({
      input: exampleRoot,
      output: outputRoot,
      appId: 'touristappid',
      features: {
        scriptSetup: true,
        typescript: true,
        scss: true,
        compositionApi: true,
        emits: true,
        slots: true,
        provide: false
      },
      optimization: {
        minify: false,
        sourcemap: true,
        treeshaking: false,
        incremental: false
      }
    })

    const result = await compiler.compile()

    expect(result.errors).toEqual([])
    expect(result.stats.total).toBe(7)
    expect(result.stats.success).toBe(7)
    expect(result.stats.failed).toBe(0)

    await expectOutputFiles([
      'app.js',
      'app.json',
      'app.wxss',
      'runtime-injection.js',
      'project.config.json',
      'sitemap.json',
      'pages/index/index.js',
      'pages/index/index.json',
      'pages/index/index.wxml',
      'pages/index/index.wxss',
      'pages/profile.js',
      'pages/profile.json',
      'pages/profile.wxml',
      'pages/profile.wxss',
      'components/UserCard.js',
      'components/UserCard.json',
      'components/UserCard.wxml',
      'components/UserCard.wxss',
      'components/CounterInput.js',
      'components/CounterInput.json',
      'components/CounterInput.wxml',
      'components/CounterInput.wxss',
      'components/ActivityList.js',
      'components/ActivityList.json',
      'components/ActivityList.wxml',
      'components/ActivityList.wxss',
      'components/SlotPanel.js',
      'components/SlotPanel.json',
      'components/SlotPanel.wxml',
      'components/SlotPanel.wxss'
    ])

    const appJson = JSON.parse(await readOutputFile('app.json'))
    expect(appJson.pages).toEqual(expect.arrayContaining(['pages/index/index', 'pages/profile']))
    expect(appJson.window.navigationBarTitleText).toBe('真实示例')
    expect(appJson.tabBar.list).toEqual([
      { pagePath: 'pages/index/index', text: '首页' },
      { pagePath: 'pages/profile', text: '资料' }
    ])

    const projectConfig = JSON.parse(await readOutputFile('project.config.json'))
    expect(projectConfig.appid).toBe('touristappid')
    expect(projectConfig.projectname).toBe('vue3mp-real-miniprogram')

    const indexWxml = await readOutputFile('pages/index/index.wxml')
    const indexJs = await readOutputFile('pages/index/index.js')
    expect(indexWxml).toContain('<user-card')
    expect(indexWxml).toContain('user="{{currentUser}}"')
    expect(indexWxml).toContain('bind:user-click="handleUserClick"')
    expect(indexWxml).toContain('<counter-input')
    expect(indexWxml).toContain('model-value="{{displayName}}"')
    expect(indexWxml).toContain('bind:update:modelValue="_handleUpdate_displayName"')
    expect(indexWxml).toContain('count="{{visitCount}}"')
    expect(indexWxml).toContain('bind:update:count="_handleUpdate_visitCount"')
    expect(indexWxml).toContain('<activity-list')
    expect(indexWxml).toContain('items="{{activities}}"')
    expect(indexWxml).toContain('loading="{{activitiesLoading}}"')
    expect(indexWxml).toContain('bind:select-activity="handleSelectActivity"')
    expect(indexWxml).toContain('<slot-panel')
    expect(indexWxml).toContain('slot="header"')
    expect(indexWxml).toContain('原生 slot 验收')
    expect(indexWxml).toContain('默认 slot 内容会透传到微信原生组件')
    expect(indexWxml).toContain('hidden="{{!(showActivityHint)}}"')
    expect(indexWxml).toContain('v-show 会编译为微信原生 hidden 属性')
    expect(indexJs).toMatch(/_handleUpdate_displayName(?:: function)?\(event\)/)
    expect(indexJs).toMatch(/_handleUpdate_visitCount(?:: function)?\(event\)/)
    expect(indexJs).toContain('displayName: event.detail')
    expect(indexJs).toContain('visitCount: event.detail')
    expect(indexJs).not.toContain('this.this.data')

    const userCardJs = await readOutputFile('components/UserCard.js')
    const userCardWxml = await readOutputFile('components/UserCard.wxml')
    const userCardSource = await fs.readFile(join(exampleRoot, 'components/UserCard.vue'), 'utf8')
    expect(userCardSource).toContain('@click="handleClick"')
    expect(userCardSource).toContain('@click.stop="handleMessage"')
    expect(userCardJs).toContain('user: {')
    expect(userCardJs).toContain('active: {')
    expect(userCardJs).toContain("this.triggerEvent('userClick',")
    expect(userCardWxml).toContain('bind:tap="handleClick"')
    expect(userCardWxml).toContain('catch:tap="handleMessage"')
    expect(userCardWxml).not.toContain('bind:tap="handleMessage"')

    const counterInputJs = await readOutputFile('components/CounterInput.js')
    const counterInputWxml = await readOutputFile('components/CounterInput.wxml')
    expect(counterInputJs).toContain('modelValue: {')
    expect(counterInputJs).toContain('type: String')
    expect(counterInputJs).toContain('count: {')
    expect(counterInputJs).toContain('type: Number')
    expect(counterInputJs).not.toContain('__TYPE_PLACEHOLDER_')
    expect(counterInputJs).not.toContain('__EXPRESSION_PLACEHOLDER_')
    expect(counterInputJs).toContain("this.triggerEvent('update:modelValue', value)")
    expect(counterInputJs).toContain("this.triggerEvent('update:count', value)")
    expect(counterInputWxml).toContain('value="{{modelValue}}"')
    expect(counterInputWxml).toContain('bindinput="_handleTrimInput_modelValue"')
    expect(counterInputWxml).toContain('value="{{count}}"')
    expect(counterInputWxml).toContain('bindinput="_handleNumberInput_count"')

    const activityListJs = await readOutputFile('components/ActivityList.js')
    const activityListWxml = await readOutputFile('components/ActivityList.wxml')
    const activityListWxss = await readOutputFile('components/ActivityList.wxss')
    expect(activityListJs).toContain('items: {')
    expect(activityListJs).toContain('loading: {')
    expect(activityListJs).toContain("this.triggerEvent('selectActivity',")
    expect(activityListWxml).toContain('wx:if="{{loading}}"')
    expect(activityListWxml).toContain('wx:for="{{items}}"')
    expect(activityListWxml).toContain('wx:for-item="activity"')
    expect(activityListWxml).toContain('wx:key="id"')
    expect(activityListWxml).toContain('data-activity-id="{{activity.id}}"')
    expect(activityListWxml).toContain('bind:tap="handleSelect"')
    expect(activityListWxml).toContain("activity.done ? 'done' : ''")
    expect(activityListJs).toContain('event.currentTarget.dataset.activityId')
    expect(activityListJs).toContain('this.properties.items.find')
    expect(activityListJs).not.toContain('const event = event.currentTarget.dataset.arg0')
    expect(activityListWxss).toContain('.activity-list')
    expect(activityListWxss).toContain('.activity-row')

    const slotPanelJson = JSON.parse(await readOutputFile('components/SlotPanel.json'))
    const slotPanelWxml = await readOutputFile('components/SlotPanel.wxml')
    const slotPanelWxss = await readOutputFile('components/SlotPanel.wxss')
    expect(slotPanelJson.options).toEqual({ multipleSlots: true })
    expect(slotPanelWxml).toContain('<slot name="header"')
    expect(slotPanelWxml).toMatch(new RegExp('<slot(?:\\sdata-v-[^>]*)?></slot>'))
    expect(slotPanelWxss).toContain('.slot-panel')

    const indexWxss = await readOutputFile('pages/index/index.wxss')
    expect(indexWxss).toContain('.example-page')
    expect(indexWxss).toContain('.shared-card')
    expect(indexWxss).toContain('rpx')

    const runtimeInjection = await readOutputFile('runtime-injection.js')
    expect(runtimeInjection).toContain('Vue3MiniRuntime')
    expect(await readOutputFile('app.js')).toContain("require('./runtime-injection.js')")

    for (const jsFile of [
      'app.js',
      'runtime-injection.js',
      'pages/index/index.js',
      'pages/profile.js',
      'components/UserCard.js',
      'components/CounterInput.js',
      'components/ActivityList.js',
      'components/SlotPanel.js'
    ]) {
      expect(() => parseOutputJavaScript(jsFile)).not.toThrow()
    }
  })

  async function expectOutputFiles(files: string[]): Promise<void> {
    for (const file of files) {
      await expect(fs.stat(join(outputRoot, file)), file).resolves.toBeTruthy()
    }
  }

  async function readOutputFile(file: string): Promise<string> {
    return await fs.readFile(join(outputRoot, file), 'utf8')
  }

  async function parseOutputJavaScript(file: string): Promise<void> {
    parse(await readOutputFile(file), { sourceType: 'script' })
  }
})
