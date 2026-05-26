import { describe, expect, it } from 'vitest'
import { MiniProgramOptionsGenerator } from '@/compiler/codegen/mini-program-options-generator'

describe('mini-program-options-generator', () => {
  it('生成 app options 时保留 data、methods、computed、watch 和生命周期语义', () => {
    const generator = new MiniProgramOptionsGenerator()

    const options = generator.generateAppOptions({
      data: { count: 1 },
      methods: {
        save: { body: 'function() { return this.data.count }' }
      },
      computed: {
        total: { getter: 'function() { return this.data.count + 1 }' }
      },
      watch: { count: 'countChanged' },
      lifecycle: { onShow: 'this.trackShow()' }
    })

    expect(options).toContain('data: {')
    expect(options).toContain('count: 1')
    expect(options).toContain('save: function() { return this.data.count }')
    expect(options).toContain('getTotal: function() { return this.data.count + 1 }')
    expect(options).toContain('observers: {')
    expect(options).toContain('count: "countChanged"')
    expect(options).toContain('onShow: function()')
    expect(options).toContain('this.trackShow()')
  })

  it('生成 app options 时把组件式 attached 生命周期归一为 App onLaunch', () => {
    const generator = new MiniProgramOptionsGenerator()

    const options = generator.generateAppOptions({
      data: {},
      methods: {},
      computed: {},
      watch: {},
      lifecycle: {
        attached: "console.log('app mounted')",
        onShow: 'this.trackShow()'
      }
    })

    expect(options).toContain('onLaunch: function(options)')
    expect(options).toContain("console.log('app mounted')")
    expect(options).toContain('onShow: function()')
    expect(options).toContain('this.trackShow()')
    expect(options).not.toContain('lifetimes: {')
    expect(options).not.toContain('attached: function()')
  })

  it('生成 page options 时把模板事件和 computed runtime methods 放在根级', () => {
    const generator = new MiniProgramOptionsGenerator()
    const templateResult = {
      eventHandlers: new Map([['_handleUpdate_title', '']])
    }

    const options = generator.generatePageOptions({
      data: { title: 'Hello' },
      methods: {
        submit: { body: 'function() { return this.data.title }' }
      },
      computed: {
        summary: { getter: 'return this.data.title + "!"' }
      },
      watch: {},
      lifecycle: {},
      reactiveVariables: new Map([['title', { name: 'title', type: 'ref', initialValue: 'Hello' }]])
    }, null, templateResult as any)

    expect(options).toContain('data: {')
    expect(options).toContain('submit: function() { return this.data.title }')
    expect(options).toContain('_handleUpdate_title: function(event)')
    expect(options).toContain('_computed_summary: function()')
    expect(options).toContain('_updateComputed: function()')
    expect(options).toContain('_reactiveVariables: [')
    expect(options).not.toContain('methods: {')
  })

  it('生成 component options 时把用户方法、模板 handler 和 computed runtime methods 合并到 methods', () => {
    const generator = new MiniProgramOptionsGenerator()
    const templateResult = {
      eventHandlers: new Map([['_handleTrimInput_modelValue', '']])
    }

    const options = generator.generateComponentOptions({
      data: { modelValue: 'x' },
      props: {
        modelValue: { type: String, default: 'x' }
      },
      emits: ['update:modelValue'],
      methods: {
        reset: { body: 'function() { this.setData({ modelValue: "" }) }' }
      },
      computed: {
        decorated: { getter: 'return this.data.modelValue + "!"' }
      },
      watch: {},
      lifecycle: { attached: 'this.init()' },
      reactiveVariables: new Map([['modelValue', { name: 'modelValue', type: 'ref', initialValue: 'x' }]])
    }, null, templateResult as any)

    expect(options).toContain('properties: {')
    expect(options).toContain('modelValue: {')
    expect(options).toContain('type: String')
    expect(options).toContain('value: "x"')
    expect(options).toContain('methods: {')
    expect(options).toContain('reset: function() { this.setData({ modelValue: "" }) }')
    expect(options).toContain('_handleTrimInput_modelValue: function(event)')
    expect(options).toContain("this.triggerEvent('update:modelValue', value)")
    expect(options).toContain('_computed_decorated: function()')
    expect(options).toContain('lifetimes: {')
    expect(options).toContain('attached: function()')
  })
})
