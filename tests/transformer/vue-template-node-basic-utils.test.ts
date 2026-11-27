import { describe, expect, it } from 'vitest'
import {
  buildDynamicClassExpression,
  isCustomComponentTag,
  parseVueTemplateEventArguments,
  toKebabCase,
  transformVueTemplateComponentVModel
} from '@/transformer/vue-template-node-basic-utils.js'
import type { TemplateTransformResult } from '@/transformer/template-transformer.js'

describe('vue-template-node-basic-utils', () => {
  it('转换组件名为 kebab-case', () => {
    expect(toKebabCase('UserCard')).toBe('user-card')
    expect(toKebabCase('XMLViewer')).toBe('x-m-l-viewer')
  })

  it('转换对象和数组 class 表达式并保留条件优先级', () => {
    expect(buildDynamicClassExpression("{ active: isActive }")).toBe("isActive ? 'active' : ''")
    expect(buildDynamicClassExpression("{ active: isActive, online: isOnline }")).toBe(
      "((isActive ? 'active' : '') + ' ' + (isOnline ? 'online' : ''))"
    )
    expect(buildDynamicClassExpression('[baseClass, activeClass]')).toBe("((baseClass || '') + ' ' + (activeClass || ''))")
    expect(buildDynamicClassExpression('className')).toBe('className')
  })

  it('解析事件参数时保留引号内逗号和嵌套函数调用', () => {
    expect(parseVueTemplateEventArguments("item, 'a,b', wrap(foo, bar)")).toEqual([
      'item',
      "'a,b'",
      'wrap(foo, bar)'
    ])
  })

  it('识别自定义组件并排除原生 v-model 标签', () => {
    expect(isCustomComponentTag('UserCard')).toBe(true)
    expect(isCustomComponentTag('user-card')).toBe(true)
    expect(isCustomComponentTag('input')).toBe(false)
    expect(isCustomComponentTag('picker')).toBe(false)
    expect(isCustomComponentTag()).toBe(false)
  })

  it('转换组件 v-model 为属性绑定与 update 事件', () => {
    const result: TemplateTransformResult = {
      wxml: '',
      components: new Set(),
      eventHandlers: new Map<string, string>()
    }

    expect(transformVueTemplateComponentVModel('form.userName', result)).toEqual([
      'model-value="{{form.userName}}"',
      'bind:update:modelValue="_handleUpdate_form_userName"'
    ])
    expect(transformVueTemplateComponentVModel('form.checked', result, 'checkedValue')).toEqual([
      'checked-value="{{form.checked}}"',
      'bind:update:checkedValue="_handleUpdate_form_checked"'
    ])
    expect([...result.eventHandlers.keys()]).toEqual([
      '_handleUpdate_form_userName',
      '_handleUpdate_form_checked'
    ])
  })
})
