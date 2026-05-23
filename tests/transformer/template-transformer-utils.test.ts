/**
 * TemplateTransformer 轻量工具测试。
 */

import { describe, expect, it } from 'vitest'
import {
  createDefaultDirectiveTransformers,
  transformVueComponentTagsInTemplate
} from '@/transformer/template-transformer-utils'
import type { TemplateTransformResult } from '@/transformer/template-transformer'
import type { TransformContext } from '@/types/index'

describe('template-transformer utils', () => {
  it('应该创建默认 AST 指令转换器', () => {
    const transformers = createDefaultDirectiveTransformers()

    expect(transformers.get('v-if')?.({}, { expression: 'visible' })).toEqual({
      'wx:if': '{{visible}}'
    })
    expect(transformers.get('v-else-if')?.({}, { expression: 'fallback' })).toEqual({
      'wx:elif': '{{fallback}}'
    })
    expect(transformers.get('v-else')?.({}, {})).toEqual({
      'wx:else': true
    })
    expect(transformers.get('v-show')?.({}, { expression: 'visible' })).toEqual({
      hidden: '{{!(visible)}}'
    })
    expect(transformers.get('v-on')?.({}, {
      arg: 'click',
      expression: 'handleClick',
      modifiers: []
    })).toEqual({
      'bind:tap': 'handleClick'
    })
  })

  it('应该转换大写 Vue 组件标签并记录组件依赖', () => {
    const result: TemplateTransformResult = {
      wxml: '',
      components: new Set(),
      eventHandlers: new Map()
    }
    const context = {
      components: new Map()
    } as TransformContext

    const wxml = transformVueComponentTagsInTemplate(
      '<view><UserCard title="用户"></UserCard></view>',
      result,
      context
    )

    expect(wxml).toBe('<view><user-card title="用户"></user-card></view>')
    expect(result.components.has('UserCard')).toBe(true)
    expect(context.components.get('UserCard')).toBe('@/components/UserCard.vue')
  })
})
