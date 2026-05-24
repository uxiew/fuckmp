import { describe, expect, it } from 'vitest'
import {
  buildDynamicClassExpression,
  buildVModelInputHandlerName,
  fixSelfClosingTags,
  mapAstEventName,
  mapAttributeEventName,
  mapVOnEventName,
  parseVForExpression,
  transformBasicDirectives,
  transformBasicTags,
  transformTemplateTag,
  transformVForDirectives,
  transformVModelDirectives
} from '@/transformer/template-string-basic-utils.js'

describe('template string basic utils', () => {
  it('转换基础标签和 Vue 指令名称', () => {
    expect(transformTemplateTag('div')).toBe('view')
    expect(transformTemplateTag('CustomCard')).toBe('CustomCard')
    expect(transformBasicTags('<div><span>Hi</span><p>Text</p></div>')).toBe(
      '<view><text>Hi</text><text>Text</text></view>'
    )
    expect(transformBasicDirectives('<view v-if="ok" v-show="visible"></view>')).toContain('wx:if="ok"')
  })

  it('解析和转换 v-for 字符串语法', () => {
    expect(parseVForExpression('item, idx in list')).toEqual({ item: 'item', index: 'idx', list: 'list' })
    expect(parseVForExpression('todo in todos')).toEqual({ item: 'todo', index: 'index', list: 'todos' })
    expect(parseVForExpression('bad expression')).toBeUndefined()
    expect(transformVForDirectives('<view v-for="todo in todos"></view>')).toContain(
      'wx:for="{{todos}}" wx:for-item="todo" wx:for-index="index" wx:key="todo"'
    )
  })

  it('构造 v-model handler 并转换字符串指令', () => {
    expect(buildVModelInputHandlerName('form.name')).toBe('_handleInput_form_name')
    expect(buildVModelInputHandlerName('count', ['number'])).toBe('_handleNumberInput_count')
    expect(buildVModelInputHandlerName('title', ['trim'])).toBe('_handleTrimInput_title')
    expect(transformVModelDirectives('<input v-model="form.name">')).toBe(
      '<input value="{{form.name}}" bindinput="_handleInput_form_name">'
    )
  })

  it('映射 AST、@event 与 v-on 事件名旧语义', () => {
    expect(mapAstEventName('click')).toBe('tap')
    expect(mapAstEventName('touchstart')).toBe('touchstart')
    expect(mapAttributeEventName('click')).toBe('tap')
    expect(mapAttributeEventName('user-click')).toBe('user-click')
    expect(mapVOnEventName('click')).toBe('tap')
    expect(mapVOnEventName('user-click')).toBe('user-click')
  })

  it('保留自闭合标签和动态 class 表达式旧语义', () => {
    expect(fixSelfClosingTags('<image src="{{avatar}}">')).toBe('<image src="{{avatar}}" />')
    expect(buildDynamicClassExpression('{ online: isOnline, active: isActive }')).toBe(
      `(isOnline ? 'online' : '' + " " + isActive ? 'active' : '')`
    )
    expect(buildDynamicClassExpression('dynamicClass')).toBe('dynamicClass')
  })
})
