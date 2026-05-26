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

    const appSource = await fs.readFile(join(exampleRoot, 'app.vue'), 'utf8')
    const appJs = await readOutputFile('app.js')
    expect(appSource).toContain('onMounted(() =>')
    expect(appJs).toContain('onLaunch: function(options)')
    expect(appJs).toContain("console.log('真实示例 App 启动')")
    expect(appJs).not.toContain('lifetimes: {')
    expect(appJs).not.toContain('attached: function()')

    const indexWxml = await readOutputFile('pages/index/index.wxml')
    const indexJs = await readOutputFile('pages/index/index.js')
    const indexSource = await fs.readFile(join(exampleRoot, 'pages/index/index.vue'), 'utf8')
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
    expect(indexSource).toContain('<a href="/pages/profile">')
    expect(indexWxml).toContain('<navigator url="/pages/profile"')
    expect(indexWxml).toContain('查看资料页')
    expect(indexWxml).not.toContain('<navigator href=')
    expect(indexSource).toContain('@click="incrementVisit"')
    expect(indexSource).not.toContain('@tap="incrementVisit"')
    expect(indexWxml).toContain('bind:tap="incrementVisit"')
    expect(indexJs).toMatch(/_handleUpdate_displayName(?:: function)?\(event\)/)
    expect(indexJs).toMatch(/_handleUpdate_visitCount(?:: function)?\(event\)/)
    expect(indexJs).toContain('displayName: event.detail')
    expect(indexJs).toContain('visitCount: event.detail')
    expect(indexSource).toContain('@user-click="handleUserClick"')
    expect(indexSource).toContain('@select-activity="handleSelectActivity"')
    expect(indexJs).toContain('const user = event.detail')
    expect(indexJs).toContain('const activity = event.detail')
    expect(indexJs).not.toContain('const user = event.currentTarget.dataset.arg0')
    expect(indexJs).not.toContain('const activity = event.currentTarget.dataset.arg0')
    expect(indexSource).toContain('onMounted(() =>')
    expect(indexJs).toContain('onReady: function()')
    expect(indexJs).toContain("console.log('真实示例首页加载完成')")
    expect(indexJs).not.toContain('this.this.data')

    const userCardJs = await readOutputFile('components/UserCard.js')
    const userCardWxml = await readOutputFile('components/UserCard.wxml')
    const userCardSource = await fs.readFile(join(exampleRoot, 'components/UserCard.vue'), 'utf8')
    expect(userCardSource).toContain('<img class="avatar-image"')
    expect(userCardSource).toContain(':src="user.avatarUrl"')
    expect(userCardSource).toContain('@click="handleClick"')
    expect(userCardSource).toContain('@click.stop="handleMessage"')
    expect(userCardSource).toContain('onMounted(() =>')
    expect(userCardSource).toContain('onUnmounted(() =>')
    expect(userCardWxml).toContain('<image')
    expect(userCardWxml).toContain('class="avatar-image"')
    expect(userCardWxml).toContain('src="{{user.avatarUrl}}"')
    expect(userCardWxml).not.toContain('<img')
    expect(userCardJs).toContain('lifetimes: {')
    expect(userCardJs).toContain('attached: function()')
    expect(userCardJs).toContain('detached: function()')
    expect(userCardJs).toContain("console.log('UserCard attached', this.properties.user.name)")
    expect(userCardJs).toContain("console.log('UserCard detached', this.properties.user.id)")
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
    const activityListSource = await fs.readFile(join(exampleRoot, 'components/ActivityList.vue'), 'utf8')
    expect(activityListJs).toContain('items: {')
    expect(activityListJs).toContain('loading: {')
    expect(activityListJs).toContain("this.triggerEvent('selectActivity',")
    expect(activityListWxml).toContain('wx:if="{{loading}}"')
    expect(activityListWxml).toContain('wx:for="{{items}}"')
    expect(activityListWxml).toContain('wx:for-item="activity"')
    expect(activityListWxml).toContain('wx:key="id"')
    expect(activityListSource).toContain('@click="handleSelect(activity.id)"')
    expect(activityListSource).not.toContain(':data-activity-id="activity.id"')
    expect(activityListWxml).toContain('data-arg0="{{activity.id}}"')
    expect(activityListWxml).toContain('bind:tap="handleSelect"')
    expect(activityListWxml).toContain("activity.done ? 'done' : ''")
    expect(activityListJs).toContain('const activityId = event.currentTarget.dataset.arg0')
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

    const profileSource = await fs.readFile(join(exampleRoot, 'pages/profile.vue'), 'utf8')
    const profileJs = await readOutputFile('pages/profile.js')
    const profileWxml = await readOutputFile('pages/profile.wxml')
    const profileWxss = await readOutputFile('pages/profile.wxss')
    expect(profileSource).toContain('computed(')
    expect(profileSource).toContain('v-if="profileReady"')
    expect(profileSource).toContain('<input')
    expect(profileSource).toContain('class="name-input"')
    expect(profileSource).toContain(':value="profileName"')
    expect(profileSource).toContain('@input="handleNameInput"')
    expect(profileSource).toContain('@focus="handleNameFocus"')
    expect(profileSource).toContain('@blur="handleNameBlur"')
    expect(profileSource).toContain('class="touch-card"')
    expect(profileSource).toContain('@touchstart="handleTouchStart"')
    expect(profileSource).toContain('@touchmove="handleTouchMove"')
    expect(profileSource).toContain('@touchend="handleTouchEnd"')
    expect(profileSource).toContain('@touchcancel="handleTouchCancel"')
    expect(profileSource).toContain('@longpress="handleLongPress"')
    expect(profileSource).toContain('<textarea')
    expect(profileSource).toContain('@input="handleBioInput"')
    expect(profileSource).toContain('@focus="handleBioFocus"')
    expect(profileSource).toContain('@blur="handleBioBlur"')
    expect(profileSource).toContain('<switch')
    expect(profileSource).toContain(':checked="emailOptIn"')
    expect(profileSource).toContain('@change="handleEmailOptInChange"')
    expect(profileSource).toContain('<picker')
    expect(profileSource).toContain(':value="themeIndex"')
    expect(profileSource).toContain(':range="themeOptions"')
    expect(profileSource).toContain('@change="handleThemeChange"')
    expect(profileSource).toContain('<slider')
    expect(profileSource).toContain(':value="completionLevel"')
    expect(profileSource).toContain('@change="handleCompletionChange"')
    expect(profileSource).toContain('<radio-group')
    expect(profileSource).toContain('@change="handleContactMethodChange"')
    expect(profileSource).toContain('<radio value="email"')
    expect(profileSource).toContain(':checked="contactMethod === \'email\'"')
    expect(profileSource).toContain('<checkbox-group')
    expect(profileSource).toContain('@change="handleChannelChange"')
    expect(profileSource).toContain('<checkbox value="email"')
    expect(profileSource).toContain(':checked="selectedChannels.includes(\'email\')"')
    expect(profileSource).toContain('<form')
    expect(profileSource).toContain('@submit="handleProfileSubmit"')
    expect(profileSource).toContain('@reset="handleProfileReset"')
    expect(profileSource).toContain('form-type="submit"')
    expect(profileSource).toContain('form-type="reset"')
    expect(profileWxml).toContain('wx:if="{{profileReady}}"')
    expect(profileWxml).toContain('{{profileSummary}}')
    expect(profileWxml).toContain('<input')
    expect(profileWxml).toContain('value="{{profileName}}"')
    expect(profileWxml).toContain('bind:input="handleNameInput"')
    expect(profileWxml).toContain('bind:focus="handleNameFocus"')
    expect(profileWxml).toContain('bind:blur="handleNameBlur"')
    expect(profileWxml).toContain('bind:touchstart="handleTouchStart"')
    expect(profileWxml).toContain('bind:touchmove="handleTouchMove"')
    expect(profileWxml).toContain('bind:touchend="handleTouchEnd"')
    expect(profileWxml).toContain('bind:touchcancel="handleTouchCancel"')
    expect(profileWxml).toContain('bind:longpress="handleLongPress"')
    expect(profileWxml).toContain('<textarea')
    expect(profileWxml).toContain('value="{{bioDraft}}"')
    expect(profileWxml).toContain('bind:input="handleBioInput"')
    expect(profileWxml).toContain('bind:focus="handleBioFocus"')
    expect(profileWxml).toContain('bind:blur="handleBioBlur"')
    expect(profileWxml).toContain('<switch')
    expect(profileWxml).toContain('checked="{{emailOptIn}}"')
    expect(profileWxml).toContain('bind:change="handleEmailOptInChange"')
    expect(profileWxml).toContain('<picker')
    expect(profileWxml).toContain('value="{{themeIndex}}"')
    expect(profileWxml).toContain('range="{{themeOptions}}"')
    expect(profileWxml).toContain('bind:change="handleThemeChange"')
    expect(profileWxml).toContain('<slider')
    expect(profileWxml).toContain('value="{{completionLevel}}"')
    expect(profileWxml).toContain('bind:change="handleCompletionChange"')
    expect(profileWxml).toContain('<radio-group')
    expect(profileWxml).toContain('bind:change="handleContactMethodChange"')
    expect(profileWxml).toContain('<radio value="email"')
    expect(profileWxml).toContain('checked="{{contactMethod === \'email\'}}"')
    expect(profileWxml).toContain('<checkbox-group')
    expect(profileWxml).toContain('bind:change="handleChannelChange"')
    expect(profileWxml).toContain('<checkbox value="email"')
    expect(profileWxml).toContain('checked="{{selectedChannels.includes(\'email\')}}"')
    expect(profileWxml).toContain('<form')
    expect(profileWxml).toContain('bind:submit="handleProfileSubmit"')
    expect(profileWxml).toContain('bind:reset="handleProfileReset"')
    expect(profileWxml).toContain('form-type="submit"')
    expect(profileWxml).toContain('form-type="reset"')
    expect(profileJs).toContain('profileReady: true')
    expect(profileJs).toContain('bioDraft:')
    expect(profileJs).toContain('emailOptIn: true')
    expect(profileJs).toContain('themeOptions:')
    expect(profileJs).toContain('themeIndex: 0')
    expect(profileJs).toContain('completionLevel: 60')
    expect(profileJs).toContain('contactMethod: "email"')
    expect(profileJs).toContain('selectedChannels: ["email"]')
    expect(profileJs).toContain('formSnapshot:')
    expect(profileJs).toContain('touchPhase:')
    expect(profileJs).toContain('this.profileName.value = event.detail.value')
    expect(profileJs).toContain('this.bioDraft.value = event.detail.value')
    expect(profileJs).toContain('this.emailOptIn.value = event.detail.value')
    expect(profileJs).toContain('this.themeIndex.value = event.detail.value')
    expect(profileJs).toContain('this.completionLevel.value = event.detail.value')
    expect(profileJs).toContain('this.contactMethod.value = event.detail.value')
    expect(profileJs).toContain('this.selectedChannels.value = event.detail.value')
    expect(profileJs).toContain('this.formSnapshot.value = event.detail.value')
    expect(profileJs).toContain("this.bioDraft.value = ''")
    expect(profileJs).toContain("this.touchPhase.value = 'start'")
    expect(profileJs).toContain("this.touchPhase.value = 'move'")
    expect(profileJs).toContain("this.touchPhase.value = 'end'")
    expect(profileJs).toContain("this.touchPhase.value = 'cancel'")
    expect(profileJs).toContain("this.touchPhase.value = 'longpress'")
    expect(profileJs).toContain("console.log('name focus')")
    expect(profileJs).toContain("console.log('name blur')")
    expect(profileJs).toContain("console.log('bio focus')")
    expect(profileJs).toContain("console.log('bio blur')")
    expect(profileJs).toContain('_computed_profileSummary')
    expect(profileJs).toContain('_computed_selectedTheme')
    expect(profileJs).toContain('_computed_completionText')
    expect(profileJs).toContain('_computed_contactMethodText')
    expect(profileJs).toContain('_computed_selectedChannelsText')
    expect(profileJs).toContain("return this.data.contactMethod === 'email' ? '邮箱' : '电话'")
    expect(profileJs).toContain('return `${this.data.profileName} · ${this.data.profileRole}`')
    expect(profileWxss).toContain('.profile-summary')
    expect(profileWxss).toContain('.profile-meta')
    expect(profileWxss).toContain('.name-input')
    expect(profileWxss).toContain('.touch-card')
    expect(profileWxss).toContain('.bio-input')
    expect(profileWxss).toContain('.preference-row')
    expect(profileWxss).toContain('.picker-value')
    expect(profileWxss).toContain('.slider-row')
    expect(profileWxss).toContain('.radio-row')
    expect(profileWxss).toContain('.checkbox-row')
    expect(profileWxss).toContain('.profile-form')

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
