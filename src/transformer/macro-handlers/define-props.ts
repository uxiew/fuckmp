/**
 * defineProps 宏处理器
 */

import type { TransformContext, MacroHandler } from '@/types/index.js'
import { logger } from '@/utils/index.js'
import {
  extractPropsDefinition,
  transformToMiniprogramProperties,
  type PropsDefinition
} from './define-props-utils.js'

export type {
  MacroPropDefinition,
  PropsDefinition,
  PropType
} from './define-props-utils.js'
export { generatePropertiesCode } from './define-props-utils.js'

/**
 * defineProps 宏处理器
 */
export const definePropsHandler: MacroHandler = (node: any, context: TransformContext) => {
  try {
    logger.debug(`处理 defineProps 宏: ${context.filename}`)

    const propsDefinition = resolvePropsDefinition(node, context)
    const miniprogramProperties = transformToMiniprogramProperties(propsDefinition)

    context.props = Object.fromEntries(Object.entries(miniprogramProperties).map(([key, { type, value }]) => {
      const definition = propsDefinition[key]
      return [key, {
        type,
        default: value,
        required: Boolean(definition && typeof definition === 'object' && !Array.isArray(definition) && definition.required)
      }]
    }))

    logger.debug(`defineProps 处理完成: ${Object.keys(propsDefinition).length} 个属性`)

    return miniprogramProperties

  } catch (error) {
    logger.error(`defineProps 处理失败: ${context.filename}`, error as Error)
    throw error
  }
}

/**
 * 从 defineProps 调用节点解析 props 定义。
 */
function resolvePropsDefinition(node: any, context: TransformContext): PropsDefinition {
  const arg = node.arguments[0]
  if (arg) {
    return extractPropsDefinition(arg)
  }

  if (node.typeParameters?.params && node.typeParameters.params.length > 0) {
    const typeParam = node.typeParameters.params[0]
    const propsDefinition = extractPropsDefinition(typeParam)
    logger.debug(`从 TypeScript 泛型解析 props: ${Object.keys(propsDefinition).length} 个属性`)
    return propsDefinition
  }

  logger.warn(`defineProps 没有参数也没有泛型，使用空的 props 定义: ${context.filename}`)
  return {}
}
