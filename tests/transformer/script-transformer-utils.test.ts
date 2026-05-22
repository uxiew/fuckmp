import { describe, expect, it } from 'vitest'
import {
  appendLifecycleCode,
  createScriptTransformContext,
  getConstructorFromTypeName,
  mergePropDefaults
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

  it('追加生命周期代码时保留已有代码顺序', () => {
    const context = createScriptTransformContext('components/input.vue', false)

    appendLifecycleCode(context, 'attached', 'this.initProps()')
    appendLifecycleCode(context, 'attached', 'this.initUseId()')

    expect(context.lifecycle.attached).toBe('this.initProps()\nthis.initUseId()')
  })
})
