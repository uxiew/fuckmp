import { describe, expect, it } from 'vitest'
import {
  applyDefineModelVariable,
  applyDefinePropsDestructureVariable,
  appendLifecycleCode,
  createMethodFromFunctionInitializer,
  createScriptTransformContext,
  getConstructorFromTypeName,
  isFunctionInitializer,
  mergePropDefaults,
  recordScriptImports,
  transformComputedGetter
} from '@/transformer/script-transformer-utils.js'

describe('script-transformer utils', () => {
  it('创建脚本转换初始上下文', () => {
    const context = createScriptTransformContext('pages/home.vue', true)

    expect(context.filename).toBe('pages/home.vue')
    expect(context.isPage).toBe(true)
    expect(context.hasScoped).toBe(false)
    expect(context.imports).toBeInstanceOf(Set)
    expect(context.components).toBeInstanceOf(Map)
    expect(context.reactiveVariables).toBeInstanceOf(Map)
    expect(context.propAliases).toBeInstanceOf(Map)
    expect(context.propNamespaces).toBeInstanceOf(Set)
  })

  it('合并已有 prop 默认值并为新 prop 推断构造函数', () => {
    const context = createScriptTransformContext('components/card.vue', false)
    context.props.title = {
      type: String,
      required: true
    }

    mergePropDefaults({
      title: 'Untitled',
      count: 1,
      enabled: true,
      tags: ['a', 'b'],
      options: { dense: true }
    }, context)

    expect(context.props.title).toEqual({
      type: String,
      required: true,
      default: 'Untitled'
    })
    expect(context.props.count).toMatchObject({ type: Number, default: 1, required: false })
    expect(context.props.enabled).toMatchObject({ type: Boolean, default: true, required: false })
    expect(context.props.tags).toMatchObject({ type: Array, default: ['a', 'b'], required: false })
    expect(context.props.options).toMatchObject({ type: Object, default: { dense: true }, required: false })
  })

  it('根据类型名称返回小程序 property 构造函数', () => {
    expect(getConstructorFromTypeName('Number')).toBe(Number)
    expect(getConstructorFromTypeName('Boolean')).toBe(Boolean)
    expect(getConstructorFromTypeName('Array')).toBe(Array)
    expect(getConstructorFromTypeName('Object')).toBe(Object)
    expect(getConstructorFromTypeName('String')).toBe(String)
    expect(getConstructorFromTypeName(undefined)).toBe(String)
  })

  it('将 defineModel 变量写入原生 property 与 update 事件', () => {
    const context = createScriptTransformContext('components/input.vue', false)

    applyDefineModelVariable({
      name: 'model',
      init: {
        property: 'checked',
        type: 'Boolean',
        default: false,
        required: true
      }
    }, context)

    expect(context.props.checked).toEqual({
      type: Boolean,
      default: false,
      required: true
    })
    expect(context.emits).toEqual(['update:checked'])

    applyDefineModelVariable({
      name: 'model',
      init: {
        property: 'checked',
        type: 'Boolean'
      }
    }, context)

    expect(context.emits).toEqual(['update:checked'])
  })

  it('合并 defineProps 解构默认值并登记局部别名', () => {
    const context = createScriptTransformContext('components/card.vue', false)

    applyDefinePropsDestructureVariable({
      name: 'props',
      init: {
        defaults: {
          title: 'Untitled'
        },
        aliases: {
          localTitle: 'title',
          count: 'count'
        }
      }
    }, context)

    expect(context.props.title).toEqual({
      type: String,
      default: 'Untitled',
      required: false
    })
    expect(context.propAliases?.get('localTitle')).toBe('title')
    expect(context.propAliases?.get('count')).toBe('count')
  })

  it('追加生命周期代码时保留已有代码顺序', () => {
    const context = createScriptTransformContext('components/input.vue', false)

    appendLifecycleCode(context, 'attached', 'this.initProps()')
    appendLifecycleCode(context, 'attached', 'this.initUseId()')

    expect(context.lifecycle.attached).toBe('this.initProps()\nthis.initUseId()')
  })

  it('记录 Vue、组件和样式导入到转换上下文', () => {
    const context = createScriptTransformContext('pages/home.vue', true)

    recordScriptImports(new Map([
      ['vue', {
        isVue: true,
        isComponent: false,
        isStyle: false,
        specifiers: [
          { type: 'named', imported: 'ref', local: 'ref' },
          { type: 'named', imported: 'computed', local: 'computed' }
        ]
      }],
      ['./UserCard.vue', {
        isVue: false,
        isComponent: true,
        isStyle: false,
        specifiers: [
          { type: 'default', local: 'UserCard' }
        ]
      }],
      ['../styles/page.scss', {
        isVue: false,
        isComponent: false,
        isStyle: true,
        specifiers: []
      }]
    ] as any), context)

    expect([...context.imports]).toEqual(['ref', 'computed'])
    expect(context.components.get('UserCard')).toBe('./UserCard.vue')
    expect(context.styleImports).toEqual(['../styles/page.scss'])
  })

  it('识别函数初始化表达式并构造 setup 方法记录', () => {
    expect(isFunctionInitializer('() => count.value++')).toBe(true)
    expect(isFunctionInitializer('function save() {}')).toBe(true)
    expect(isFunctionInitializer('123')).toBe(false)
    expect(isFunctionInitializer(123)).toBe(false)

    expect(createMethodFromFunctionInitializer('save', '() => count.value++')).toEqual({
      name: 'save',
      params: [],
      isAsync: false,
      isArrow: true,
      body: '() => count.value++'
    })
  })

  it('转换 computed getter 中的响应式变量和 props 访问', () => {
    const context = createScriptTransformContext('components/card.vue', false)
    context.propAliases!.set('displayTitle', 'title')

    const getter = transformComputedGetter(
      '() => count.value + displayTitle',
      {
        variables: new Map([
          ['count', { isReactive: true, macroType: 'ref' }],
          ['doubleCount', { isReactive: true, macroType: 'computed' }]
        ])
      },
      context
    )

    expect(getter).toBe('return this.data.count + this.data.title')
  })
})
