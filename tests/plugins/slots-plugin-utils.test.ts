import { describe, expect, it } from 'vitest'
import {
  extractFallbackContent,
  extractSlotName,
  extractSlotProps,
  extractSlotTarget,
  generateSlotCode,
  generateSlotUsageCode,
  generateSlotsRuntimeConfig,
  hasSlotDirective,
  optimizeSlotRendering,
  validateSlotConfig
} from '@/plugins/composition/slots-plugin-utils.js'

describe('slots plugin utils', () => {
  it('识别 slot 指令并提取 slot 名称、props 与 fallback', () => {
    const node: any = {
      type: 'Element',
      tagName: 'template',
      directives: [{ name: 'slot:header' }],
      attributes: [
        { name: 'name', value: 'header' },
        { name: 'title', value: 'Title' },
        { name: 'v-if', value: 'show' }
      ],
      children: [{ type: 'text', value: 'fallback' }]
    }

    expect(hasSlotDirective(node)).toBe(true)
    expect(extractSlotName(node)).toBe('header')
    expect(extractSlotProps(node)).toEqual({ title: 'Title' })
    expect(extractFallbackContent(node)).toBe('fallback')
  })

  it('支持 VueSlot 节点和 slot 使用目标提取', () => {
    const vueSlot: any = {
      type: 'VueSlot',
      name: 'footer',
      props: { active: true },
      fallback: 'empty'
    }
    const directiveUsageNode: any = {
      directives: [{ name: 'slot', argument: 'footer' }],
      attributes: [{ name: 'size', value: 'large' }]
    }
    const defaultUsageNode: any = {
      directives: [{ name: 'slot' }]
    }
    const shorthandUsageNode: any = {
      attributes: [{ name: '#header' }]
    }

    expect(extractSlotName(vueSlot)).toBe('footer')
    expect(extractSlotProps(vueSlot)).toEqual({ active: true })
    expect(extractFallbackContent(vueSlot)).toBe('empty')
    expect(extractSlotTarget(directiveUsageNode)).toBe('footer')
    expect(extractSlotTarget(defaultUsageNode)).toBe('default')
    expect(extractSlotTarget(shorthandUsageNode)).toBe('header')
  })

  it('保持现有 slot 定义与使用 WXML 生成语义', () => {
    expect(generateSlotCode('header', { title: 'Title', count: 1 })).toBe(
      '<slot name="header" title="Title" count="{{1}}" ></slot>'
    )
    expect(generateSlotUsageCode('default', {}, { type: 'text', value: 'body' })).toBe('body')
    expect(generateSlotUsageCode('header', { title: 'Title' }, { type: 'text', value: 'body' })).toBe(
      '<view slot="header"title="Title">body</view>'
    )
  })

  it('生成 runtime config 并保持 validate/optimize 旧语义', () => {
    const slots = {
      header: { type: 'definition', props: { title: 'Title' }, fallback: 'fallback' },
      header_usage: { type: 'usage', target: 'header', props: { title: 'Used' }, content: 'body' }
    }

    expect(generateSlotsRuntimeConfig(slots)).toEqual({
      type: 'slots',
      slots: [
        { name: 'header', type: 'definition', props: { title: 'Title' }, content: 'fallback', target: undefined },
        { name: 'header_usage', type: 'usage', props: { title: 'Used' }, content: 'body', target: 'header' }
      ]
    })
    expect(validateSlotConfig({ name: 'header', type: 'definition' })).toBe(true)
    expect(validateSlotConfig({ target: 'header', type: 'usage' })).toBe(false)
    expect(optimizeSlotRendering({
      header: { name: 'header', type: 'definition', props: { title: 'Old' } },
      headerWithFallback: { name: 'header', type: 'definition', props: { size: 'lg' }, fallback: 'fallback' },
      usage: { name: 'usage', type: 'usage', props: {}, content: 'body' }
    })).toEqual({
      headerWithFallback: { name: 'header', type: 'definition', props: { size: 'lg' }, fallback: 'fallback' },
      usage: { name: 'usage', type: 'usage', props: {}, content: 'body' }
    })
  })
})
