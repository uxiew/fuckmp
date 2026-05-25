/**
 * defineProps TypeScript 类型声明解析辅助函数。
 */

import { logger } from '@/utils/index.js'
import type { PropsDefinition, PropType } from './define-props-utils.js'

/**
 * 从 TypeScript 类型节点提取 props 定义。
 */
export function extractTypeScriptProps(node: any): PropsDefinition {
  const props: PropsDefinition = {}

  try {
    logger.debug(`解析 TypeScript 类型节点: ${node.type}`)

    if (node.type === 'TSTypeReference') {
      const typeName = node.typeName?.name || 'Unknown'
      logger.warn(`未解析的 TypeScript 类型引用: ${typeName}`)
    } else if (node.type === 'TSTypeLiteral') {
      logger.debug('解析 TypeScript 类型字面量')
      extractTypeScriptMembers(node.members, props)
    } else if (node.type === 'TSInterfaceDeclaration') {
      logger.debug(`解析接口声明: ${node.id?.name}`)
      extractTypeScriptMembers(node.body?.body, props)
    } else {
      logger.warn(`未支持的 TypeScript 类型: ${node.type}`)
      props.unknownProp = { type: Object, required: false }
    }
  } catch (error) {
    logger.error('TypeScript props 解析失败', error as Error)
  }

  return props
}

/**
 * 映射 TypeScript 类型到运行时构造函数。
 */
export function mapTypeScriptTypeToConstructor(tsType: any): PropType {
  if (!tsType) return String

  switch (tsType.type) {
    case 'TSStringKeyword':
      return String
    case 'TSNumberKeyword':
      return Number
    case 'TSBooleanKeyword':
      return Boolean
    case 'TSArrayType':
      return Array
    case 'TSTypeReference':
    case 'TSTypeLiteral':
      return Object
    case 'TSUnionType':
      if (tsType.types && tsType.types.length > 0) {
        return mapTypeScriptTypeToConstructor(tsType.types[0])
      }
      return String
    default:
      logger.warn(`未知的 TypeScript 类型: ${tsType.type}`)
      return String
  }
}

/**
 * 根据 TypeScript 类型获取小程序 property 默认值。
 */
export function getDefaultValueForType(tsType: any): any {
  return getDefaultValue(mapTypeScriptTypeToConstructor(tsType))
}

/** 从 TypeScript 成员列表提取 props。 */
function extractTypeScriptMembers(members: any[] | undefined, props: PropsDefinition): void {
  if (!Array.isArray(members)) {
    return
  }

  members.forEach((member: any) => {
    if (member.type === 'TSPropertySignature') {
      const key = getPropertyKey(member.key)
      const isOptional = member.optional || false
      const tsType = member.typeAnnotation?.typeAnnotation

      props[key] = {
        type: mapTypeScriptTypeToConstructor(tsType),
        required: !isOptional,
        default: getDefaultValueForType(tsType)
      }

      logger.debug(`解析属性: ${key}, 可选: ${isOptional}, 类型: ${tsType?.type}`)
    }
  })
}

/** 获取属性键名。 */
function getPropertyKey(keyNode: any): string {
  if (keyNode.type === 'Identifier') {
    return keyNode.name
  }

  if (keyNode.type === 'StringLiteral') {
    return keyNode.value
  }

  return 'unknown'
}

/** 获取类型的默认值。 */
function getDefaultValue(type: PropType | PropType[]): any {
  const targetType = Array.isArray(type) ? type[0] : type

  switch (targetType) {
    case String:
      return ''
    case Number:
      return 0
    case Boolean:
      return false
    case Array:
      return []
    case Object:
      return {}
    default:
      return null
  }
}
