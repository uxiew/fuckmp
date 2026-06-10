/**
 * defineEmits 宏处理器
 */

import type { TransformContext, MacroHandler } from '@/types/index.js'
import { logger } from '@/utils/index.js'
import type { EmitsDefinition } from './define-emits-utils.js'
import {
  extractEmitsDefinition,
  extractTypeScriptEmits,
  transformToEmitInfos
} from './define-emits-utils.js'
export type { EmitInfo, EmitsDefinition } from './define-emits-utils.js'
export {
  generateEmitMethodsCode,
  generateEventDocs,
  generateEventHandlersCode,
  generateInputHandlersCode,
  generateVModelUpdateCode,
  getVModelProps,
  hasVModelEvents,
  validateEventName
} from './define-emits-utils.js'

/**
 * defineEmits 宏处理器
 */
export const defineEmitsHandler: MacroHandler = (node: any, context: TransformContext) => {
  try {
    logger.debug(`处理 defineEmits 宏: ${context.filename}`)

    let emitsDefinition: EmitsDefinition = []

    // 检查是否有参数
    const arg = node.arguments[0]
    if (arg) {
      // 有参数，从参数中解析
      emitsDefinition = extractEmitsDefinition(arg)
    } else if (node.typeParameters?.params?.length > 0) {
      // 没有参数，检查是否有 TypeScript 泛型
      const typeParam = node.typeParameters.params[0]
      emitsDefinition = extractTypeScriptEmits(typeParam)
      logger.debug(`从 TypeScript 泛型解析 emits: ${Object.keys(emitsDefinition).length} 个事件`)
    } else {
      // 既没有参数也没有泛型，使用空的 emits 定义
      logger.warn(`defineEmits 没有参数也没有泛型，使用空的 emits 定义: ${context.filename}`)
      emitsDefinition = []
    }

    // 转换为事件信息列表
    const emitInfos = transformToEmitInfos(emitsDefinition)

    // 更新上下文
    context.emits = emitInfos.map(info => info.name)

    logger.debug(`defineEmits 处理完成: ${emitInfos.length} 个事件`)

    return emitInfos
  } catch (error) {
    logger.error(`defineEmits 处理失败: ${context.filename}`, error as Error)
    throw error
  }
}
