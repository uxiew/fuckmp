/**
 * ScriptTransformer Native-first 边界处理工具。
 */

import type { TransformContext } from '@/types/index.js'
import {
  createDefineExposeDegradeRecord,
  createDefineOptionsDegradeRecord,
  createDefineSlotsDegradeRecord,
  createProvideInjectDegradeRecord,
  createUseIdNativeRecord,
  createUseTemplateRefDegradeRecord,
  createWatcherDegradeRecord,
  generateUseIdComponentInitCode,
  getUseIdEntries,
  logger,
  mergeUseTemplateRefDegradeRecord
} from '@/utils/index.js'
import { appendLifecycleCode } from './script-transformer-utils.js'

/**
 * 将 defineExpose 标记为原生小程序目标降级记录。
 */
export function applyDefineExposeMacro(macroCall: any, context: TransformContext): void {
  const previousKeys = Array.isArray(context.expose?.keys) ? context.expose.keys : []
  context.expose = createDefineExposeDegradeRecord(macroCall.arguments?.[0], previousKeys)

  logger.warn(`defineExpose 已在原生小程序目标下降级: ${context.filename}`)
}

/**
 * 将 defineOptions 标记为原生小程序目标降级记录。
 */
export function applyDefineOptionsMacro(macroCall: any, context: TransformContext): void {
  const previousKeys = Array.isArray(context.defineOptions?.keys) ? context.defineOptions.keys : []
  context.defineOptions = createDefineOptionsDegradeRecord(macroCall.arguments?.[0], previousKeys)

  logger.warn(`defineOptions 已在原生小程序目标下降级: ${context.filename}`)
}

/**
 * 将 watch/watchEffect/onWatcherCleanup 标记为原生小程序目标降级记录。
 */
export function applyWatcherMacro(macroCall: any, context: TransformContext): void {
  const previousApis = Array.isArray(context.watcherEffects?.apis) ? context.watcherEffects.apis : []
  context.watcherEffects = createWatcherDegradeRecord(macroCall.name, previousApis)
}

/**
 * 将 provide/inject 调用标记为原生小程序目标降级记录。
 */
export function applyProvideInjectMacro(macroCall: any, context: TransformContext): void {
  context.provideInject = createProvideInjectDegradeRecord(
    macroCall.name,
    String(macroCall.arguments?.[0] || ''),
    '',
    context.provideInject || {}
  )

  logger.warn(`${macroCall.name} 已在原生小程序目标下降级: ${context.filename}`)
}

/**
 * 将 useTemplateRef 变量标记为原生小程序目标降级记录。
 */
export function applyUseTemplateRefVariable(variable: any, context: TransformContext): void {
  const refInfo = variable.init || {}
  const previousRefs = Array.isArray(context.templateRefs?.refs) ? context.templateRefs!.refs : []
  const record = createUseTemplateRefDegradeRecord(refInfo.ref, refInfo.variable || variable.name, previousRefs)
  context.templateRefs = mergeUseTemplateRefDegradeRecord(context.templateRefs, record)

  logger.warn(`useTemplateRef 已在原生小程序目标下降级: ${context.filename}`)
}

/**
 * 将 useId 变量编译为原生 data 中的稳定 id。
 */
export function applyUseIdVariable(variable: any, context: TransformContext): void {
  const variableName = variable.init?.variable || variable.name
  const previousIds = getUseIdEntries(context.useIds || {})
  context.useIds = createUseIdNativeRecord(context.filename, variableName, previousIds)

  const entry = getUseIdEntries(context.useIds)
    .find(item => item.variable === variableName)
  if (!entry) {
    return
  }

  context.data[variableName] = entry.baseId

  if (!context.isPage) {
    appendLifecycleCode(context, 'attached', generateUseIdComponentInitCode(entry))
  }

  logger.info(`useId 已编译为原生小程序稳定 id: ${context.filename}`)
}

/**
 * 将 inject 变量标记为原生小程序目标降级记录并避免落入 data。
 */
export function applyInjectVariable(variable: any, context: TransformContext): void {
  context.provideInject = createProvideInjectDegradeRecord(
    'inject',
    String(variable.init?.key || ''),
    variable.init?.variable || variable.name,
    context.provideInject || {}
  )

  logger.warn(`inject 已在原生小程序目标下降级: ${context.filename}`)
}

/**
 * 将 defineSlots 类型宏擦除为原生小程序目标降级记录。
 */
export function applyDefineSlotsVariable(variable: any, context: TransformContext): void {
  context.defineSlots = createDefineSlotsDegradeRecord(variable.init?.variable || variable.name)
  logger.warn(`defineSlots 已在原生小程序目标下降级: ${context.filename}`)
}
