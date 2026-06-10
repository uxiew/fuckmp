import { describe, expect, it } from 'vitest'
import {
  buildClassBindingExpression,
  cleanupWhitespace,
  fixSelfClosingTags,
  fixTripleBraces,
  toKebabCase,
  transformBasicTemplateSyntax,
  transformDynamicClassBinding,
  transformTemplateTag,
  transformVForDirective,
  transformVModelDirective,
  transformVOnDirective,
  transformVueBindings,
  transformVueEvents,
  validateWxmlTransformResult
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

  it('映射 AST 标签名到小程序标签', () => {
    expect(transformTemplateTag('div')).toBe('view')
    expect(transformTemplateTag('span')).toBe('text')
    expect(transformTemplateTag('CustomCard')).toBe('CustomCard')
  })

  it('转换 AST v-model 指令为 value 与输入 handler', () => {
    expect(transformVModelDirective({ expression: 'form.name', modifiers: [] })).toEqual({
      value: '{{form.name}}',
      bindinput: '_handleInput_form_name'
    })
    expect(transformVModelDirective({ expression: 'count', modifiers: ['number'] }).bindinput).toBe(
      '_handleNumberInput_count'
    )
    expect(transformVModelDirective({ expression: 'title', modifiers: ['trim'] }).bindinput).toBe(
      '_handleTrimInput_title'
    )
  })

  it('转换 AST v-for 指令表达式', () => {
    expect(transformVForDirective({ expression: 'item, idx in list' })).toEqual({
      'wx:for': '{{list}}',
      'wx:for-item': 'item',
      'wx:for-index': 'idx',
      'wx:key': 'item'
    })
    expect(transformVForDirective({ expression: 'todo in todos' })['wx:for-index']).toBe('index')
    expect(transformVForDirective({ expression: 'bad expression' })).toEqual({})
    expect(transformVForDirective({})).toEqual({})
  })

  it('转换 AST v-on 指令并处理 capture 修饰符', () => {
    expect(transformVOnDirective({ arg: 'click', expression: 'save', modifiers: [] })).toEqual({
      'bind:tap': 'save'
    })
    expect(transformVOnDirective({ arg: 'touchstart', expression: 'start', modifiers: ['capture'] })).toEqual({
      'capture-bind:touchstart': 'start'
    })
    expect(transformVOnDirective({ arg: 'click', expression: 'captureStop', modifiers: ['capture', 'stop'] })).toEqual({
      'capture-catch:tap': 'captureStop'
    })
  })

  it('验证 WXML 转换结果边界', () => {
    expect(validateWxmlTransformResult({ wxml: '<view></view>' })).toEqual({ valid: true, errors: [] })
    expect(validateWxmlTransformResult({ wxml: '' }).errors).toContain('生成的 WXML 为空')
    expect(validateWxmlTransformResult({ wxml: '<view><text></view>' }).errors).toContain('WXML 标签未正确闭合')
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

  it('按 fallback 字符串管线转换基础 Vue 模板语法', () => {
    const result = transformBasicTemplateSyntax(`
      <div v-if="visible">
        <button @click.stop="save">保存</button>
        <input v-model="form.name">
        <p v-for="todo, index in todos">{{{todo.text}}}</p>
      </div>
    `)

    expect(result).toContain('<view wx:if="visible">')
    expect(result).toContain('bind:tap="save"')
    expect(result).toContain('value="{{form.name}}" bindinput="_handleInput_form_name"')
    expect(result).toContain('wx:for="{{todos}}" wx:for-item="todo" wx:for-index="index" wx:key="todo"')
    expect(result).toContain('<text')
    expect(result).not.toContain('{{{')
  })
})
