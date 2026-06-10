/**
 * TemplateTransformer 轻量工具测试。
 */

import { describe, expect, it } from 'vitest'
import {
  collectTemplateComponents,
  createDefaultDirectiveTransformers,
  createTemplateTransformResult,
  renderTemplateElement,
  renderTemplateForBlock,
  renderTemplateIfBranches,
  transformTemplateInterpolationNode,
  transformTemplateTextNode,
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

  it('创建空模板转换结果并按旧规则收集组件依赖', () => {
    const result = createTemplateTransformResult()
    const context = { components: new Map() } as TransformContext

    collectTemplateComponents(new Set(['UserCard', 'TodoList']), result, context)

    expect(result).toMatchObject({ wxml: '' })
    expect([...result.components]).toEqual(['UserCard', 'TodoList'])
    expect([...result.eventHandlers.entries()]).toEqual([])
    expect([...context.components.entries()]).toEqual([
      ['UserCard', './UserCard'],
      ['TodoList', './TodoList']
    ])
  })

  it('渲染自闭合与普通元素并保持旧输出格式', () => {
    expect(renderTemplateElement('input', ' value="{{name}}"', '')).toBe('<input value="{{name}}" />')
    expect(renderTemplateElement('view', ' class="card"', '<text>Hi</text>')).toBe('<view class="card"><text>Hi</text></view>')
  })

  it('转换文本、插值与 v-for block', () => {
    expect(transformTemplateTextNode({ content: 'hello' })).toBe('hello')
    expect(transformTemplateTextNode({})).toBe('')
    expect(transformTemplateInterpolationNode({ content: { content: 'count + 1' } })).toBe('{{count + 1}}')
    expect(transformTemplateInterpolationNode({})).toBe('{{}}')
    expect(renderTemplateForBlock('items', 'item', 'idx', '<view>{{item}}</view>')).toBe(`<block wx:for="{{items}}" wx:for-item="item" wx:for-index="idx" wx:key="idx">
      <view>{{item}}</view>
    </block>`)
  })

  it('渲染 if / else-if / else 分支并保持旧换行缩进', () => {
    const branches = [
      { condition: { content: 'visible' }, children: ['if-child'] },
      { condition: { content: 'fallback' }, children: ['else-if-child'] },
      { children: ['else-child'] }
    ]

    expect(renderTemplateIfBranches(branches, children => `<text>${children[0]}</text>`)).toBe(`<block wx:if="{{visible}}">
          <text>if-child</text>
        </block><block wx:elif="{{fallback}}">
          <text>else-if-child</text>
        </block><block wx:else>
          <text>else-child</text>
        </block>`)
  })
})
