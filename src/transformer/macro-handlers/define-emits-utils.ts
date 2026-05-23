/**
 * defineEmits 宏处理辅助函数。
 */

import { logger } from '@/utils/index.js'

/** Emits 定义类型。 */
export type EmitsDefinition = string[] | Record<string, any>

/** 事件信息。 */
export interface EmitInfo {
  name: string
  payload?: any[] | undefined
  validator?: Function | undefined
}

/**
 * 提取 emits 定义。
 */
export function extractEmitsDefinition(node: any): EmitsDefinition {
  if (node.type === 'ArrayExpression') {
    return node.elements
      .filter((element: any) => element?.type === 'StringLiteral')
      .map((element: any) => element.value)
  }

  if (node.type === 'ObjectExpression') {
    const emits: Record<string, any> = {}

    node.properties.forEach((property: any) => {
      if (property.type === 'ObjectProperty') {
        const key = getPropertyKey(property.key)
        const value = extractPropertyValue(property.value)
        emits[key] = value
      }
    })

    return emits
  }

  return []
}

/**
 * 提取 TypeScript emits。
 */
export function extractTypeScriptEmits(node: any): EmitsDefinition {
  const emits: Record<string, any> = {}

  try {
    logger.debug(`解析 TypeScript emits 节点: ${node.type}`)

    if (node.type === 'TSTypeLiteral' || node.type === 'TSInterfaceDeclaration') {
      logger.debug('解析 TypeScript emits 类型字面量')

      const members = node.type === 'TSInterfaceDeclaration' ? node.body?.body : node.members
      if (members && Array.isArray(members)) {
        members.forEach((member: any) => {
          if (member.type === 'TSPropertySignature') {
            const key = getPropertyKey(member.key)
            emits[key] = null
            logger.debug(`解析事件: ${key}`)
          } else if (member.type === 'TSCallSignatureDeclaration') {
            extractEventNamesFromSignature(member).forEach(eventName => {
              emits[eventName] = null
              logger.debug(`解析 call signature 事件: ${eventName}`)
            })
          }
        })
      }
    } else if (node.type === 'TSFunctionType') {
      extractEventNamesFromSignature(node).forEach(eventName => {
        emits[eventName] = null
        logger.debug(`解析函数类型事件: ${eventName}`)
      })
    } else if (node.type === 'TSTypeReference') {
      const typeName = node.typeName?.name || 'Unknown'
      logger.warn(`未解析的 TypeScript emits 类型引用: ${typeName}`)
    } else {
      logger.warn(`未支持的 TypeScript emits 类型: ${node.type}`)
    }
  } catch (error) {
    logger.error('TypeScript emits 解析失败', error as Error)
  }

  return emits
}

/**
 * 从 defineEmits 的 TypeScript 函数签名中提取事件名。
 */
export function extractEventNamesFromSignature(node: any): string[] {
  const firstParam = node.parameters?.[0]
  const typeNode = firstParam?.typeAnnotation?.typeAnnotation

  return extractEventNamesFromTypeNode(typeNode)
}

/**
 * 从事件名参数类型中提取字符串字面量事件。
 */
export function extractEventNamesFromTypeNode(node: any): string[] {
  if (!node) {
    return []
  }

  if (node.type === 'TSLiteralType' && node.literal?.type === 'StringLiteral') {
    return [node.literal.value]
  }

  if (node.type === 'TSUnionType') {
    return node.types.flatMap((item: any) => extractEventNamesFromTypeNode(item))
  }

  return []
}

/**
 * 转换为事件信息列表。
 */
export function transformToEmitInfos(emits: EmitsDefinition): EmitInfo[] {
  if (Array.isArray(emits)) {
    return emits.map(name => ({
      name,
      payload: undefined,
      validator: undefined
    }))
  }

  return Object.entries(emits).map(([name, validator]) => ({
    name,
    payload: undefined,
    validator: validator === 'function' ? validator : undefined
  }))
}

/**
 * 生成事件发射方法代码。
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
 * 生成事件处理方法代码。
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
 * 生成 v-model 更新方法代码。
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
 * 生成输入处理方法代码。
 */
export function generateInputHandlersCode(emitInfos: EmitInfo[]): string {
  const inputHandlers: string[] = []

  emitInfos.forEach(info => {
    if (info.name.startsWith('update:')) {
      const propName = info.name.replace('update:', '')

      inputHandlers.push(`    _handleInput_${propName.replace(/\./g, '_')}(event) {
      const value = event.detail.value
      this.setData({
        ${propName}: value
      })
      this.triggerEvent('${info.name}', value)
    }`)

      inputHandlers.push(`    _handleNumberInput_${propName.replace(/\./g, '_')}(event) {
      const value = parseFloat(event.detail.value) || 0
      this.setData({
        ${propName}: value
      })
      this.triggerEvent('${info.name}', value)
    }`)

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
 * 检查是否包含 v-model 事件。
 */
export function hasVModelEvents(emitInfos: EmitInfo[]): boolean {
  return emitInfos.some(info => info.name.startsWith('update:'))
}

/**
 * 获取 v-model 属性名列表。
 */
export function getVModelProps(emitInfos: EmitInfo[]): string[] {
  return emitInfos
    .filter(info => info.name.startsWith('update:'))
    .map(info => info.name.replace('update:', ''))
}

/**
 * 验证事件名称。
 */
export function validateEventName(name: string): { valid: boolean; message?: string } {
  if (!/^[a-zA-Z][a-zA-Z0-9:_-]*$/.test(name)) {
    return {
      valid: false,
      message: `事件名称 "${name}" 格式不正确，应该以字母开头，只包含字母、数字、冒号、下划线和连字符`
    }
  }

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
 * 生成事件文档。
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

/** 获取属性键名。 */
function getPropertyKey(node: any): string {
  if (node.type === 'Identifier') {
    return node.name
  }
  if (node.type === 'StringLiteral') {
    return node.value
  }
  return 'unknown'
}

/** 提取属性值。 */
function extractPropertyValue(node: any): any {
  switch (node.type) {
    case 'StringLiteral':
    case 'NumericLiteral':
    case 'BooleanLiteral':
    case 'NullLiteral':
    case 'Identifier':
      return extractLiteralValue(node)
    case 'ArrowFunctionExpression':
    case 'FunctionExpression':
      return 'function'
    case 'ArrayExpression':
      return node.elements.map((el: any) => extractLiteralValue(el))
    default:
      return undefined
  }
}

/** 提取字面量值。 */
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

/** 首字母大写。 */
function capitalize(str: string): string {
  return str.charAt(0).toUpperCase() + str.slice(1)
}
