import { describe, expect, it } from 'vitest'
import {
  addScopeAttributes,
  generateScopeId,
  generateUsingComponents,
  kebabCase,
  removeCtxPrefixes
} from '@/generator/shared-generator-utils.js'

describe('shared generator utils', () => {
  it('移除 WXML 中的 _ctx 前缀但保留绑定语义', () => {
    const wxml = '<view bind:tap="_ctx.handleTap" wx:if="{{_ctx.visible}}" title="{{_ctx.title}}">{{_ctx.title}}</view>'

    expect(removeCtxPrefixes(wxml)).toBe(
      '<view bind:tap="handleTap" wx:if="{{visible}}" title="{{title}}">{{title}}</view>'
    )
  })

  it('为普通标签和自闭合标签添加 scoped 属性', () => {
    expect(addScopeAttributes('<view><image src="/a.png" /></view>', 'abc123')).toBe(
      '<view data-v-abc123><image src="/a.png" data-v-abc123 /></view>'
    )
  })

  it('不会重复添加已有 scoped 属性', () => {
    expect(addScopeAttributes('<view data-v-old></view>', 'abc123')).toBe('<view data-v-old></view>')
  })

  it('生成稳定 scope id', () => {
    expect(generateScopeId('src/pages/index.vue')).toBe(generateScopeId('src/pages/index.vue'))
    expect(generateScopeId('src/pages/index.vue')).not.toBe(generateScopeId('src/pages/about.vue'))
  })

  it('转换组件名为 kebab-case', () => {
    expect(kebabCase('UserCard')).toBe('user-card')
    expect(kebabCase('XMLViewer')).toBe('x-m-l-viewer')
  })

  it('生成 usingComponents 配置并移除 .vue 与相对路径前缀', () => {
    const components = new Map([
      ['UserCard', './components/UserCard.vue'],
      ['LoadingSpinner', '@/components/LoadingSpinner.vue']
    ])

    expect(generateUsingComponents(components, {
      debugLabel: '测试组件引用',
      errorLabel: '处理测试组件路径失败'
    })).toEqual({
      'user-card': 'components/UserCard',
      'loading-spinner': '@/components/LoadingSpinner'
    })
  })
})
