/**
 * defineEmits 宏处理器
 */

import type { CallExpression } from '@babel/types'
import type { TransformContext, MacroHandler } from '@/types/index.js'
import { logger } from '@/utils/index.js'

/**
 * Emits 定义类型
 */
export type EmitsDefinition = string[] | Record<string, any>

/**
 * 事件信息
 */
export interface EmitInfo {
  name: string
  payload?: any[] | undefined
  validator?: Function | undefined
}

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
    } else {
      // 没有参数，检查是否有 TypeScript 泛型
      if (node.typeParameters && node.typeParameters.params && node.typeParameters.params.length > 0) {
        const typeParam = node.typeParameters.params[0]
        emitsDefinition = extractTypeScriptEmits(typeParam)
        logger.debug(`从 TypeScript 泛型解析 emits: ${Object.keys(emitsDefinition).length} 个事件`)
      } else {
        // 既没有参数也没有泛型，使用空的 emits 定义
        logger.warn(`defineEmits 没有参数也没有泛型，使用空的 emits 定义: ${context.filename}`)
        emitsDefinition = []
      }
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

/**
 * 提取 emits 定义
 */
function extractEmitsDefinition(node: any): EmitsDefinition {
  if (node.type === 'ArrayExpression') {
    // 数组形式: ['event1', 'event2']
    return node.elements
      .filter((element: any) => element?.type === 'StringLiteral')
      .map((element: any) => element.value)
  } else if (node.type === 'ObjectExpression') {
    // 对象形式: { event1: null, event2: (payload) => true }
    const emits: Record<string, any> = {}

    node.properties.forEach((property: any) => {
      if (property.type === 'ObjectProperty') {
        const key = getPropertyKey(property.key)
        const value = extractPropertyValue(property.value)
        emits[key] = value
      }
    })

    return emits
  } else if (node.type === 'TSTypeReference' || node.type === 'TSTypeLiteral') {
    // TypeScript 类型定义
    return extractTypeScriptEmits(node)
  }

  return []
}

/**
 * 获取属性键名
 */
function getPropertyKey(keyNode: any): string {
  if (keyNode.type === 'Identifier') {
    return keyNode.name
  } else if (keyNode.type === 'StringLiteral') {
    return keyNode.value
  }
  return 'unknown'
}

/**
 * 提取属性值
 */
function extractPropertyValue(valueNode: any): any {
  switch (valueNode.type) {
    case 'NullLiteral':
      return null
    case 'ArrowFunctionExpression':
    case 'FunctionExpression':
      return 'function'
    case 'ArrayExpression':
      return valueNode.elements.map((el: any) => extractLiteralValue(el))
    default:
      return extractLiteralValue(valueNode)
  }
}

/**
 * 提取字面量值
 */
function extractLiteralValue(node: any): any {
  switch (node.type) {
    case 'StringLiteral':
      return node.value
    case 'NumericLiteral':
      return node.value
    case 'BooleanLiteral':
      return node.value
    case 'NullLiteral':
      return null
    case 'Identifier':
      return node.name
    default:
      return undefined
  }
}

/**
 * 提取 TypeScript emits
 */
function extractTypeScriptEmits(node: any): EmitsDefinition {
  const emits: Record<string, any> = {}

  try {
    logger.debug(`解析 TypeScript emits 节点: ${node.type}`)

    if (node.type === 'TSTypeLiteral') {
      // 类型字面量，如 { userClick: [user: User]; sendMessage: [user: User] }
      logger.debug('解析 TypeScript emits 类型字面量')

      if (node.members && Array.isArray(node.members)) {
        node.members.forEach((member: any) => {
          if (member.type === 'TSPropertySignature') {
            const key = getPropertyKey(member.key)
            // 对于事件，我们主要关心事件名，参数类型暂时忽略
            emits[key] = null
            logger.debug(`解析事件: ${key}`)
          }
        })
      }

    } else if (node.type === 'TSTypeReference') {
      // 类型引用，如 EmitEvents
      const typeName = node.typeName?.name || 'Unknown'
      logger.debug(`解析 TypeScript emits 类型引用: ${typeName}`)

      // 根据类型名称推断常见事件
      if (typeName.toLowerCase().includes('emit')) {
        emits.click = null
        emits.change = null
      }

    } else {
      logger.warn(`未支持的 TypeScript emits 类型: ${node.type}`)
      // 为未知类型创建默认事件
      emits.unknownEvent = null
    }

  } catch (error) {
    logger.error('TypeScript emits 解析失败', error as Error)
  }

  return emits
}

/**
 * 转换为事件信息列表
 */
function transformToEmitInfos(emits: EmitsDefinition): EmitInfo[] {
  if (Array.isArray(emits)) {
    // 数组形式
    return emits.map(name => ({
      name,
      payload: undefined,
      validator: undefined
    }))
  } else {
    // 对象形式
    return Object.entries(emits).map(([name, validator]) => ({
      name,
      payload: undefined,
      validator: validator === 'function' ? validator : undefined
    }))
  }
}

/**
 * 生成事件发射方法代码
 */
export function generateEmitMethodsCode(emitInfos: EmitInfo[]): string {
  const methods = emitInfos.map(info => {
    const methodName = `_emit${capitalize(info.name)}`

    return `    ${methodName}(payload) {
      this.triggerEvent('${info.name}', payload)
    }`
  })

  return methods.join(',\n\n')
}

/**
 * 生成事件处理器代码
 */
export function generateEventHandlersCode(emitInfos: EmitInfo[]): string {
  const handlers = emitInfos.map(info => {
    const handlerName = `_handle${capitalize(info.name)}`
    const emitMethodName = `_emit${capitalize(info.name)}`

    return `    ${handlerName}(event) {
      const payload = event.detail
      this.${emitMethodName}(payload)
    }`
  })

  return handlers.join(',\n\n')
}

/**
 * 生成 v-model 更新方法代码
 */
export function generateVModelUpdateCode(emitInfos: EmitInfo[]): string {
  const updateMethods: string[] = []

  emitInfos.forEach(info => {
    if (info.name.startsWith('update:')) {
      const propName = info.name.replace('update:', '')
      const methodName = `_handleUpdate_${propName.replace(/\./g, '_')}`

      updateMethods.push(`    ${methodName}(event) {
      const value = event.detail.value
      this.triggerEvent('${info.name}', value)
    }`)
    }
  })

  return updateMethods.join(',\n\n')
}

/**
 * 生成输入处理方法代码
 */
export function generateInputHandlersCode(emitInfos: EmitInfo[]): string {
  const inputHandlers: string[] = []

  emitInfos.forEach(info => {
    if (info.name.startsWith('update:')) {
      const propName = info.name.replace('update:', '')

      // 普通输入处理
      inputHandlers.push(`    _handleInput_${propName.replace(/\./g, '_')}(event) {
      const value = event.detail.value
      this.setData({
        ${propName}: value
      })
      this.triggerEvent('${info.name}', value)
    }`)

      // 数字输入处理
      inputHandlers.push(`    _handleNumberInput_${propName.replace(/\./g, '_')}(event) {
      const value = parseFloat(event.detail.value) || 0
      this.setData({
        ${propName}: value
      })
      this.triggerEvent('${info.name}', value)
    }`)

      // Trim 输入处理
      inputHandlers.push(`    _handleTrimInput_${propName.replace(/\./g, '_')}(event) {
      const value = event.detail.value.trim()
      this.setData({
        ${propName}: value
      })
      this.triggerEvent('${info.name}', value)
    }`)
    }
  })

  return inputHandlers.join(',\n\n')
}

/**
 * 检查是否包含 v-model 事件
 */
export function hasVModelEvents(emitInfos: EmitInfo[]): boolean {
  return emitInfos.some(info => info.name.startsWith('update:'))
}

/**
 * 获取 v-model 属性名列表
 */
export function getVModelProps(emitInfos: EmitInfo[]): string[] {
  return emitInfos
    .filter(info => info.name.startsWith('update:'))
    .map(info => info.name.replace('update:', ''))
}

/**
 * 首字母大写
 */
function capitalize(str: string): string {
  return str.charAt(0).toUpperCase() + str.slice(1)
}

/**
 * 验证事件名称
 */
export function validateEventName(name: string): { valid: boolean; message?: string } {
  // 检查事件名称格式
  if (!/^[a-zA-Z][a-zA-Z0-9:_-]*$/.test(name)) {
    return {
      valid: false,
      message: `事件名称 "${name}" 格式不正确，应该以字母开头，只包含字母、数字、冒号、下划线和连字符`
    }
  }

  // 检查保留事件名称
  const reservedEvents = ['tap', 'input', 'change', 'focus', 'blur', 'submit', 'reset']
  if (reservedEvents.includes(name)) {
    return {
      valid: false,
      message: `事件名称 "${name}" 是保留名称，请使用其他名称`
    }
  }

  return { valid: true }
}

/**
 * 生成事件文档
 */
export function generateEventDocs(emitInfos: EmitInfo[]): string {
  const docs = emitInfos.map(info => {
    return `/**
 * ${info.name} 事件
 * @param {any} payload 事件载荷
 */`
  })

  return docs.join('\n')
}
