/**
 * Script macro processing helpers.
 */

import type { ScriptParseResult, MacroCall } from '@/parser/index.js'
import type { MacroHandler, TransformContext } from '@/types/index.js'
import {
  applyDefineExposeMacro,
  applyDefineOptionsMacro,
  applyProvideInjectMacro,
  applyWatcherMacro
} from './script-native-boundary-utils.js'
import { resolveTypeReferenceParameters } from './type-reference-resolver.js'
import { createLiteralNodeFromValue } from './script-value-utils.js'

export type ScriptMacroErrorHandler = (macroName: string, error: unknown) => void

/**
 * 按 ScriptTransformer 旧顺序处理解析出的宏调用。
 */
export function processScriptMacros(
  parseResult: ScriptParseResult,
  context: TransformContext,
  macroHandlers: Map<string, MacroHandler>,
  onMacroError?: ScriptMacroErrorHandler
): void {
  if (!parseResult.macros) {
    return
  }

  parseResult.macros.forEach((macroCalls, macroName) => {
    if (processNativeBoundaryMacro(macroName, macroCalls, context)) {
      return
    }

    const handler = macroHandlers.get(macroName)
    if (!handler) {
      return
    }

    macroCalls.forEach(macroCall => {
      try {
        handler(createMacroHandlerNode(macroName, macroCall, parseResult, context), context)
      } catch (error) {
        onMacroError?.(macroName, error)
      }
    })
  })
}

/**
 * 构造普通宏处理器消费的旧 CallExpression 节点。
 */
export function createMacroHandlerNode(
  macroName: string,
  macroCall: MacroCall,
  parseResult: ScriptParseResult,
  context: TransformContext
): any {
  return {
    type: 'CallExpression',
    callee: { type: 'Identifier', name: macroName },
    arguments: macroCall.arguments.map(arg => createLiteralNodeFromValue(arg)),
    typeParameters: shouldResolveTypeParameters(macroName)
      ? resolveTypeReferenceParameters(macroCall.typeParameters, parseResult, context.filename)
      : macroCall.typeParameters
  }
}

function processNativeBoundaryMacro(
  macroName: string,
  macroCalls: MacroCall[],
  context: TransformContext
): boolean {
  if (macroName === 'defineExpose') {
    macroCalls.forEach(macroCall => applyDefineExposeMacro(macroCall, context))
    return true
  }

  if (macroName === 'defineOptions') {
    macroCalls.forEach(macroCall => applyDefineOptionsMacro(macroCall, context))
    return true
  }

  if (['watch', 'watchEffect', 'onWatcherCleanup'].includes(macroName)) {
    macroCalls.forEach(macroCall => applyWatcherMacro(macroCall, context))
    return true
  }

  if (['provide', 'inject'].includes(macroName)) {
    macroCalls.forEach(macroCall => applyProvideInjectMacro(macroCall, context))
    return true
  }

  return false
}

function shouldResolveTypeParameters(macroName: string): boolean {
  return ['defineProps', 'defineEmits'].includes(macroName)
}
