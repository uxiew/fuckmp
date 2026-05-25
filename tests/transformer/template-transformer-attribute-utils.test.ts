import { describe, expect, it } from 'vitest'
import { createDefaultDirectiveTransformers } from '@/transformer/template-transformer-utils.js'
import {
  transformTemplateAttributes,
  transformTemplateDirective
} from '@/transformer/template-transformer-attribute-utils.js'
import type { TemplateTransformResult } from '@/transformer/template-transformer.js'
import type { TransformContext } from '@/types/index.js'

function createResult(): TemplateTransformResult {
  return {
    wxml: '',
    components: new Set(),
    eventHandlers: new Map()
  }
}

function createContext(): TransformContext {
  return {
    filename: 'components/card.vue',
    isPage: false,
    hasScoped: false,
    props: {},
    emits: [],
    expose: {},
    data: {},
    methods: {},
    computed: {},
    watch: {},
    lifecycle: {},
    imports: new Set(),
    components: new Map()
  }
}

describe('template-transformer attribute utils', () => {
  it('转换静态属性并合并静态和动态 class', () => {
    const attrs = transformTemplateAttributes([
      { type: 6, name: 'id', value: { content: 'card' } },
      { type: 6, name: 'disabled' },
      { type: 6, name: 'class', value: { content: 'card base' } },
      { type: 7, name: 'bind', arg: { content: 'class' }, exp: { content: "{ active: isActive, disabled: isDisabled }" }, modifiers: [] }
    ], createDefaultDirectiveTransformers(), createResult(), createContext())

    expect(attrs).toBe(' id="card" disabled="" class="{{\'card base\' + \' \' + ((isActive ? \'active\' : \'\' + " " + isDisabled ? \'disabled\' : \'\'))}}"')
  })

  it('转换已注册 AST 指令并保持 v-on capture 语义', () => {
    const attrs = transformTemplateAttributes([
      { type: 7, name: 'on', arg: { content: 'click' }, exp: { content: 'handleClick' }, modifiers: ['capture'] },
      { type: 7, name: 'show', exp: { content: 'visible' }, modifiers: [] }
    ], createDefaultDirectiveTransformers(), createResult(), createContext())

    expect(attrs).toBe(' capture-bind:tap="handleClick" hidden="{{!(visible)}}"')
  })

  it('对未注册但可映射的 Vue 指令使用旧 fallback 语义', () => {
    const transformed = transformTemplateDirective(
      { type: 7, name: 'if', exp: { content: 'visible' }, modifiers: [] },
      new Map(),
      createResult(),
      createContext()
    )

    expect(transformed).toEqual({ 'wx:if': '{{visible}}' })
  })

  it('未知指令返回空对象，布尔属性只在 true 时输出', () => {
    expect(transformTemplateDirective(
      { type: 7, name: 'unknown', exp: { content: 'value' }, modifiers: [] },
      new Map(),
      createResult(),
      createContext()
    )).toEqual({})

    const attrs = transformTemplateAttributes([
      { type: 7, name: 'else', modifiers: [] }
    ], createDefaultDirectiveTransformers(), createResult(), createContext())

    expect(attrs).toBe(' wx:else')
  })
})
