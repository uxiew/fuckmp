import { describe, expect, it, vi } from 'vitest'
import type { MacroHandler } from '@/types/index.js'
import type { MacroCall, ScriptParseResult } from '@/parser/index.js'
import { createScriptTransformContext } from '@/transformer/script-transformer-utils.js'
import { processScriptMacros } from '@/transformer/script-macro-processing-utils.js'

function createParseResult(macros: Map<string, MacroCall[]>): ScriptParseResult {
  return {
    ast: {} as any,
    imports: new Map(),
    macros,
    variables: new Map(),
    functions: new Map(),
    exports: []
  }
}

describe('script macro processing utils', () => {
  it('优先分派 Native-first 特殊宏并避免落入普通 handler', () => {
    const context = createScriptTransformContext('components/card.vue', false)
    const defineExposeHandler = vi.fn()
    const watchHandler = vi.fn()
    const provideHandler = vi.fn()
    const macroHandlers = new Map<string, MacroHandler>([
      ['defineExpose', defineExposeHandler],
      ['watch', watchHandler],
      ['provide', provideHandler]
    ])

    processScriptMacros(
      createParseResult(new Map([
        ['defineExpose', [{ name: 'defineExpose', arguments: [{ open: true }], location: '1:1' }]],
        ['watch', [{ name: 'watch', arguments: ['count'], location: '2:1' }]],
        ['provide', [{ name: 'provide', arguments: ['theme'], location: '3:1' }]]
      ])),
      context,
      macroHandlers
    )

    expect(context.expose).toMatchObject({ unsupported: true, keys: ['open'] })
    expect(context.watcherEffects?.apis).toEqual(['watch'])
    expect(context.provideInject?.apis).toEqual(['provide'])
    expect(context.provideInject?.keys).toEqual(['theme'])
    expect(defineExposeHandler).not.toHaveBeenCalled()
    expect(watchHandler).not.toHaveBeenCalled()
    expect(provideHandler).not.toHaveBeenCalled()
  })

  it('为普通宏构造旧 CallExpression 节点并解析 defineProps/defineEmits 泛型参数', () => {
    const context = createScriptTransformContext('components/card.vue', false)
    const receivedNodes: any[] = []
    const handler: MacroHandler = vi.fn((node) => {
      receivedNodes.push(node)
    })
    const macroHandlers = new Map<string, MacroHandler>([
      ['defineProps', handler],
      ['ref', handler]
    ])

    processScriptMacros(
      createParseResult(new Map([
        ['defineProps', [{
          name: 'defineProps',
          arguments: [{ title: String }],
          location: '1:1',
          typeParameters: { params: ['Props'] }
        }]],
        ['ref', [{ name: 'ref', arguments: [1], location: '2:1', typeParameters: ['number'] }]]
      ])),
      context,
      macroHandlers
    )

    expect(handler).toHaveBeenCalledTimes(2)
    expect(receivedNodes[0]).toMatchObject({
      type: 'CallExpression',
      callee: { type: 'Identifier', name: 'defineProps' }
    })
    expect(receivedNodes[0].arguments).toHaveLength(1)
    expect(receivedNodes[0].typeParameters).toEqual({ params: ['Props'] })
    expect(receivedNodes[1].callee.name).toBe('ref')
    expect(receivedNodes[1].typeParameters).toEqual(['number'])
  })

  it('普通宏 handler 抛错时保持旧吞吐语义并继续处理后续宏', () => {
    const context = createScriptTransformContext('pages/home.vue', true)
    const failingHandler: MacroHandler = vi.fn(() => {
      throw new Error('boom')
    })
    const successHandler: MacroHandler = vi.fn(() => undefined)
    const onMacroError = vi.fn()

    processScriptMacros(
      createParseResult(new Map([
        ['ref', [{ name: 'ref', arguments: [1], location: '1:1' }]],
        ['computed', [{ name: 'computed', arguments: ['count + 1'], location: '2:1' }]]
      ])),
      context,
      new Map<string, MacroHandler>([
        ['ref', failingHandler],
        ['computed', successHandler]
      ]),
      onMacroError
    )

    expect(failingHandler).toHaveBeenCalledTimes(1)
    expect(successHandler).toHaveBeenCalledTimes(1)
    expect(onMacroError).toHaveBeenCalledTimes(1)
    expect(onMacroError.mock.calls[0][0]).toBe('ref')
    expect(onMacroError.mock.calls[0][1]).toBeInstanceOf(Error)
  })
})
