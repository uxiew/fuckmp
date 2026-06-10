import { describe, expect, it } from 'vitest'
import { createScriptTransformContext } from '@/transformer/script-transformer-utils.js'
import {
  applyDefineExposeMacro,
  applyDefineOptionsMacro,
  applyDefineSlotsVariable,
  applyInjectVariable,
  applyProvideInjectMacro,
  applyUseIdVariable,
  applyUseTemplateRefVariable,
  applyWatcherMacro
} from '@/transformer/script-native-boundary-utils.js'

describe('script-native-boundary-utils', () => {
  it('合并 defineExpose 和 defineOptions 降级 keys', () => {
    const context = createScriptTransformContext('components/card.vue', false)

    applyDefineExposeMacro({ arguments: [{ open: true }] }, context)
    applyDefineExposeMacro({ arguments: [{ close: true }] }, context)
    applyDefineOptionsMacro({ arguments: [{ name: 'Card' }] }, context)

    expect(context.expose).toMatchObject({
      unsupported: true,
      strategy: 'degraded',
      keys: ['open', 'close']
    })
    expect(context.defineOptions).toMatchObject({
      unsupported: true,
      strategy: 'degraded',
      keys: ['name']
    })
  })

  it('合并 watcher 与 provide/inject 降级记录', () => {
    const context = createScriptTransformContext('pages/home.vue', true)

    applyWatcherMacro({ name: 'watch' }, context)
    applyWatcherMacro({ name: 'onWatcherCleanup' }, context)
    applyProvideInjectMacro({ name: 'provide', arguments: ['theme'] }, context)
    applyInjectVariable({ name: 'themeValue', init: { key: 'theme', variable: 'themeValue' } }, context)

    expect(context.watcherEffects?.apis).toEqual(['watch', 'onWatcherCleanup'])
    expect(context.provideInject?.apis).toEqual(['provide', 'inject'])
    expect(context.provideInject?.keys).toEqual(['theme'])
    expect(context.provideInject?.variables).toEqual(['themeValue'])
  })

  it('合并 useTemplateRef 降级 refs 与 variables', () => {
    const context = createScriptTransformContext('components/card.vue', false)

    applyUseTemplateRefVariable({ name: 'panel', init: { ref: 'panelRef', variable: 'panel' } }, context)
    applyUseTemplateRefVariable({ name: 'button', init: { ref: 'buttonRef', variable: 'button' } }, context)

    expect(context.templateRefs).toMatchObject({
      unsupported: true,
      strategy: 'degraded',
      refs: ['panelRef', 'buttonRef'],
      variables: ['panel', 'button']
    })
  })

  it('为组件 useId 写入 data 并追加 attached 初始化', () => {
    const context = createScriptTransformContext('components/card.vue', false)

    applyUseIdVariable({ name: 'fieldId', init: { variable: 'fieldId' } }, context)

    expect(context.useIds?.supported).toBe(true)
    expect(context.data.fieldId).toMatch(/^vue3wx-/)
    expect(context.lifecycle.attached).toContain('this.setData')
    expect(context.lifecycle.attached).toContain('fieldId')
  })

  it('擦除 defineSlots 为降级记录', () => {
    const context = createScriptTransformContext('components/card.vue', false)

    applyDefineSlotsVariable({ name: 'slots', init: { variable: 'slots' } }, context)

    expect(context.defineSlots).toMatchObject({
      unsupported: true,
      strategy: 'type-only-erased',
      variables: ['slots']
    })
  })
})
