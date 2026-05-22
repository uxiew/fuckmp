import { describe, expect, it } from 'vitest'
import { generateComponentMethods } from '@/generator/component-method-generator-utils.js'
import type { TransformContext } from '@/types/index.js'
import type { TemplateTransformResult } from '@/transformer/index.js'

describe('component method generator utils', () => {
  it('组合用户方法、computed、emit 与模板派生 handler', () => {
    const templateResult: TemplateTransformResult = {
      wxml: '<input bindinput="_handleTrimInput_modelValue" />',
      components: new Set(),
      eventHandlers: new Map([
        ['_handleTrimInput_modelValue', '_handleTrimInput_modelValue'],
        ['_handleUpdate_count', '_handleUpdate_count']
      ])
    }

    const context = {
      computed: {
        summary: {
          getter: 'return this.data.modelValue'
        }
      }
    } as TransformContext

    const methods = generateComponentMethods({
      methods: {
        handleTap: {
          body: '() => count += 1'
        }
      },
      computed: context.computed,
      emits: ['update:modelValue', 'customEvent'],
      context,
      templateResult
    })

    expect(methods).toContain('handleTap()')
    expect(methods).toContain('return count += 1')
    expect(methods).toContain('_computed_summary()')
    expect(methods).toContain('_emitCustomEvent(detail)')
    expect(methods).toContain("_handleTrimInput_modelValue(event)")
    expect(methods).toContain("this.triggerEvent('update:modelValue', value)")
    expect(methods).toContain('_handleUpdate_count(event)')
    expect(methods).toContain('count: event.detail')
    expect(methods).toContain('_setupReactivity()')
    expect(methods).toContain('_updateComputed()')
  })
})
