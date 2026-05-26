import { describe, expect, it } from 'vitest'
import { parse } from 'node-html-parser'
import { createScriptTransformContext } from '@/transformer/script-transformer-utils.js'
import type { TemplateTransformResult } from '@/transformer/template-transformer.js'
import {
  transformEnhancedTemplateAttributes,
  transformEnhancedTemplateDirective,
  transformEnhancedTemplateNode,
  transformEnhancedTemplateTagName,
  transformEnhancedTemplateTextNode
} from '@/transformer/enhanced-template-transformer-utils.js'

function createResult(): TemplateTransformResult {
  return {
    wxml: '',
    components: new Set(),
    eventHandlers: new Map()
  }
}

function firstElement(source: string): any {
  return parse(source, { lowerCaseTagName: false }).childNodes.find((node: any) => node.tagName)
}

describe('enhanced-template-transformer-utils', () => {
  it('转换文本节点并保留双花括号语义', () => {
    const textNode = parse('{{{ rawHtml }}}').childNodes[0] as any

    expect(transformEnhancedTemplateTextNode(textNode)).toBe('{{ rawHtml }}')
  })

  it('转换标签名并保持大写组件 kebab-case 旧语义', () => {
    expect(transformEnhancedTemplateTagName('div')).toBe('view')
    expect(transformEnhancedTemplateTagName('img')).toBe('image')
    expect(transformEnhancedTemplateTagName('UserCard')).toBe('user-card')
    expect(transformEnhancedTemplateTagName('custom-view')).toBe('custom-view')
  })

  it('转换属性、class 绑定、动态属性、事件和 Vue 指令', () => {
    const node = firstElement('<view class="card" :class="{ active: isActive }" :title="title" @click="submit" v-if="ok" />')

    expect(transformEnhancedTemplateAttributes(node)).toBe(
      ' title="{{title}}" bind:tap="submit" wx:if="{{ok}}" class="{{\'card\' + \' \' + (isActive ? \'active\' : \'\')}}"'
    )
  })

  it('转换 v-for 与 v-model 指令字符串', () => {
    expect(transformEnhancedTemplateDirective('v-for', 'item, idx in list')).toBe(
      'wx:for="{{list}}" wx:for-item="item" wx:for-index="idx" wx:key="item"'
    )
    expect(transformEnhancedTemplateDirective('v-model', 'form.name')).toBe(
      'value="{{form.name}}" bindinput="_handleInput_form_name"'
    )
    expect(transformEnhancedTemplateDirective('v-unknown', 'noop')).toBeNull()
  })

  it('递归转换整棵 enhanced template AST 并输出自闭合标签', () => {
    const root = parse('<div><span>{{ msg }}</span><input v-model="form.name" /></div>', {
      lowerCaseTagName: false,
      comment: false
    })

    expect(transformEnhancedTemplateNode(root, createResult(), createScriptTransformContext('pages/home.vue', true))).toBe(
      '<view><text>{{ msg }}</text><input value="{{form.name}}" bindinput="_handleInput_form_name" /></view>'
    )
  })
})
