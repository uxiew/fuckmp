import { describe, expect, it } from 'vitest'
import {
  buildClassBindingExpression,
  cleanupWhitespace,
  fixSelfClosingTags,
  fixTripleBraces,
  toKebabCase,
  transformDynamicClassBinding,
  transformVueBindings,
  transformVueEvents
} from '@/transformer/template-string-utils'

describe('template-string-utils', () => {
  it('转换组件名为 kebab-case', () => {
    expect(toKebabCase('UserProfileCard')).toBe('user-profile-card')
  })

  it('合并静态 class 与对象语法动态 class', () => {
    const result = transformDynamicClassBinding(
      '<view class="status" :class="{ online: isOnline }">内容</view>'
    )

    expect(result).toContain(`class="{{'status' + ' ' + (isOnline ? 'online' : '')}}"`)
    expect(result).not.toContain(':class=')
  })

  it('为 AST 属性转换生成 class 绑定表达式', () => {
    expect(buildClassBindingExpression('status', '{ online: isOnline }')).toBe(
      `'status' + ' ' + (isOnline ? 'online' : '')`
    )
    expect(buildClassBindingExpression('', 'dynamicClass')).toBe('dynamicClass')
  })

  it('转换属性绑定并跳过已处理的 class', () => {
    const result = transformVueBindings('<image :src="avatar" :class="{ active: isActive }" />')

    expect(result).toContain('src="{{avatar}}"')
    expect(result).toContain(`class="{{isActive ? 'active' : ''}}"`)
  })

  it('转换 Vue 事件绑定为 bind:event 形式', () => {
    const result = transformVueEvents(
      '<button @click.stop="save" v-on:user-click="handleUserClick">保存</button>'
    )

    expect(result).toContain('bind:tap="save"')
    expect(result).toContain('bind:user-click="handleUserClick"')
  })

  it('修复基础 WXML 字符串后处理问题', () => {
    const fixedTags = fixSelfClosingTags('<image src="{{avatar}}">')
    const fixedBraces = fixTripleBraces('<text>{{{title}}}</text>')
    const cleaned = cleanupWhitespace('<view>\n    <text>Hi</text>\n  </view>')

    expect(fixedTags).toBe('<image src="{{avatar}}" />')
    expect(fixedBraces).toBe('<text>{{title}}</text>')
    expect(cleaned).toBe('<view> <text>Hi</text> </view>')
  })
})
