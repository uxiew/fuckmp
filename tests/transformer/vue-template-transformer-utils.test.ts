import { describe, expect, it } from 'vitest'
import { createScriptTransformContext } from '@/transformer/script-transformer-utils.js'
import type { TemplateTransformResult } from '@/transformer/template-transformer.js'
import {
  transformVueTemplateDirective,
  transformVueTemplateElementNode,
  transformVueTemplateForNode,
  transformVueTemplateIfNode
} from '@/transformer/vue-template-transformer-utils.js'

function createResult(): TemplateTransformResult {
  return {
    wxml: '',
    components: new Set(),
    eventHandlers: new Map(),
    customEventHandlers: new Set()
  }
}

describe('vue-template-transformer-utils', () => {
  it('转换 v-if / v-else-if / v-else 分支并复用子节点 renderer', () => {
    const context = createScriptTransformContext('pages/home.vue', true)

    const output = transformVueTemplateIfNode({
      branches: [
        { condition: { content: '_ctx.ready' }, children: [{ content: 'ready' }] },
        { condition: { loc: { source: 'count > 1' } }, children: [{ content: 'many' }] },
        { children: [{ content: 'empty' }] }
      ]
    }, context, child => child.content)

    expect(output).toBe(
      '<view wx:if="{{ready}}">ready</view>' +
      '<view wx:elif="{{count > 1}}">many</view>' +
      '<view wx:else>empty</view>'
    )
  })

  it('转换 v-for 节点并从子节点 :key 推断 wx:key', () => {
    const context = createScriptTransformContext('pages/list.vue', true)

    const output = transformVueTemplateForNode({
      source: { content: '_ctx.users' },
      valueAlias: { content: 'user' },
      keyAlias: { content: 'idx' },
      children: [{
        props: [{
          type: 7,
          name: 'bind',
          arg: { content: 'key' },
          exp: { content: 'user.id' }
        }],
        content: 'row'
      }]
    }, context, child => child.content)

    expect(output).toBe('<view wx:for="{{users}}" wx:for-item="user" wx:for-index="idx" wx:key="id">row</view>')
  })

  it('转换元素标签、class 绑定、事件参数并写入 eventHandlers', () => {
    const context = createScriptTransformContext('components/card.vue', false)
    const result = createResult()

    const output = transformVueTemplateElementNode({
      tag: 'button',
      props: [
        { type: 6, name: 'class', value: { content: 'primary' } },
        { type: 7, name: 'bind', arg: { content: 'class' }, exp: { content: '{ active: isActive }' } },
        { type: 7, name: 'on', arg: { content: 'click' }, exp: { content: 'submit(item, 1)' } }
      ],
      children: [{ content: 'Submit' }]
    }, result, context, child => child.content)

    expect(output).toBe(
      '<button bind:tap="submit" data-arg0="{{item}}" data-arg1="1" class="{{\'primary\' + \' \' + (isActive ? \'active\' : \'\')}}">Submit</button>'
    )
    expect([...result.eventHandlers.keys()]).toEqual(['submit'])
  })

  it('转换 a href 为微信原生 navigator url', () => {
    const context = createScriptTransformContext('pages/index.vue', true)
    const result = createResult()

    const output = transformVueTemplateElementNode({
      tag: 'a',
      props: [
        { type: 6, name: 'href', value: { content: '/pages/profile' } }
      ],
      children: [{ content: '查看资料页' }]
    }, result, context, child => child.content)

    expect(output).toBe('<navigator url="/pages/profile">查看资料页</navigator>')
  })

  it('转换 Vue AST 事件 stop 修饰符为微信原生 catch 绑定', () => {
    const context = createScriptTransformContext('components/card.vue', false)
    const result = createResult()

    const output = transformVueTemplateElementNode({
      tag: 'button',
      props: [
        { type: 7, name: 'on', arg: { content: 'tap' }, exp: { content: 'handleMessage' }, modifiers: ['stop'] }
      ],
      children: [{ content: 'Message' }]
    }, result, context, child => child.content)

    expect(output).toBe('<button catch:tap="handleMessage">Message</button>')
    expect([...result.eventHandlers.keys()]).toEqual(['handleMessage'])
  })

  it('标记自定义组件直传事件 handler 使用 event.detail payload', () => {
    const context = createScriptTransformContext('pages/index.vue', true)
    const result = createResult()

    const output = transformVueTemplateElementNode({
      tag: 'UserCard',
      props: [
        { type: 7, name: 'on', arg: { content: 'user-click' }, exp: { content: 'handleUserClick' } },
        { type: 7, name: 'on', arg: { content: 'tap' }, exp: { content: 'handleNativeTap(item)' } }
      ],
      children: []
    }, result, context, child => child.content)

    expect(output).toContain('<user-card')
    expect(output).toContain('bind:user-click="handleUserClick"')
    expect(output).toContain('bind:tap="handleNativeTap"')
    expect(output).toContain('data-arg0="{{item}}"')
    expect([...result.eventHandlers.keys()]).toEqual(['handleUserClick', 'handleNativeTap'])
    expect([...result.customEventHandlers || []]).toEqual(['handleUserClick'])
  })

  it('转换普通指令并保留 v-model 修饰符旧语义', () => {
    const result = createResult()
    const context = createScriptTransformContext('components/form.vue', false)

    expect(transformVueTemplateDirective({
      name: 'bind',
      arg: { content: 'value' },
      exp: { content: 'form.name' }
    }, result, context)).toBe('value="{{form.name}}"')
    expect(transformVueTemplateDirective({
      name: 'show',
      exp: { content: 'visible' }
    }, result, context)).toBe('hidden="{{!(visible)}}"')
    expect(transformVueTemplateDirective({
      name: 'model',
      exp: { content: 'form.age' },
      modifiers: [{ content: 'number' }]
    }, result, context, 'input')).toEqual([
      'value="{{form.age}}"',
      'bindinput="_handleNumberInput_form_age"'
    ])
    expect(result.eventHandlers.has('_handleNumberInput_form_age')).toBe(true)
  })
})
