import { describe, expect, it } from 'vitest'
import {
  createTemplateDirectiveInfo,
  createTemplateEventInfo,
  createTemplateModelInfo,
  getTemplateComplexityScore,
  getTemplateNodeLocation,
  getTemplateSlotName,
  getTemplateSlotProps,
  getUniqueTemplateDirectiveNames,
  getUniqueTemplateEventNames,
  isTemplateComponentTag
} from '@/parser/template-parser-utils.js'

describe('template parser utils', () => {
  it('识别组件标签并保持旧命名规则', () => {
    expect(isTemplateComponentTag('UserCard')).toBe(true)
    expect(isTemplateComponentTag('user-card')).toBe(true)
    expect(isTemplateComponentTag('view')).toBe(false)
  })

  it('格式化 AST 节点位置信息并保留 unknown fallback', () => {
    expect(getTemplateNodeLocation({ loc: { start: { line: 2, column: 3 }, end: { line: 4, column: 5 } } })).toBe('2:3-4:5')
    expect(getTemplateNodeLocation({})).toBe('unknown')
  })

  it('从指令节点构造 directive、event 与 model 信息', () => {
    const onProp = {
      name: 'on',
      arg: { content: 'tap' },
      modifiers: ['stop'],
      exp: { content: 'handleTap' },
      loc: { start: { line: 1, column: 2 }, end: { line: 1, column: 25 } }
    }
    const modelProp = {
      name: 'model',
      modifiers: ['trim'],
      exp: { content: 'title' }
    }

    expect(createTemplateDirectiveInfo(onProp, '1:2-1:25')).toEqual({
      name: 'on',
      arg: 'tap',
      modifiers: ['stop'],
      expression: 'handleTap',
      location: '1:2-1:25'
    })
    expect(createTemplateEventInfo(onProp, '1:2-1:25')).toEqual({
      name: 'tap',
      handler: 'handleTap',
      modifiers: ['stop'],
      location: '1:2-1:25'
    })
    expect(createTemplateModelInfo(modelProp, 'unknown')).toEqual({
      property: 'title',
      event: 'update:modelValue',
      modifiers: ['trim'],
      location: 'unknown'
    })
  })

  it('提取 slot 名称与 props 并保持旧属性规则', () => {
    const slotNode = {
      props: [
        { type: 6, name: 'name', value: { content: 'header' } },
        { type: 6, name: 'title', value: { content: 'Hello' } },
        { type: 6, name: 'empty' },
        { type: 7, name: 'bind', exp: { content: 'dynamicValue' } }
      ]
    }

    expect(getTemplateSlotName(slotNode)).toBe('header')
    expect(getTemplateSlotName({ props: [] })).toBe('default')
    expect(getTemplateSlotProps(slotNode)).toEqual({
      title: 'Hello',
      empty: undefined,
      bind: 'dynamicValue'
    })
  })

  it('生成唯一列表并计算旧复杂度权重', () => {
    expect(getUniqueTemplateDirectiveNames([{ name: 'if' }, { name: 'for' }, { name: 'if' }])).toEqual(['if', 'for'])
    expect(getUniqueTemplateEventNames([{ name: 'tap' }, { name: 'change' }, { name: 'tap' }])).toEqual(['tap', 'change'])
    expect(getTemplateComplexityScore({
      directives: [{}, {}],
      components: new Set(['UserCard']),
      events: [{}, {}, {}],
      models: [{}],
      slots: [{}, {}]
    })).toBe(16)
  })
})
