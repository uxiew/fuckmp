/**
 * defineProps 宏处理器
 */

import type { CallExpression } from '@babel/types'
import type { TransformContext, MacroHandler } from '@/types/index.js'
import type { MiniprogramProperty } from '@/types/index.js'
import { logger } from '@/utils/index.js'

/**
 * Props 定义类型
 */
export interface PropsDefinition {
  [key: string]: PropType | MacroPropDefinition
}

/**
 * 属性类型
 */
export type PropType =
  | StringConstructor
  | NumberConstructor
  | BooleanConstructor
  | ArrayConstructor
  | ObjectConstructor
  | null

/**
 * 属性定义
 */
export interface MacroPropDefinition {
  type?: PropType | PropType[]
  default?: any
  required?: boolean
  validator?: Function
}

/**
 * defineProps 宏处理器
 */
export const definePropsHandler: MacroHandler = (node: any, context: TransformContext) => {
  try {
    logger.debug(`处理 defineProps 宏: ${context.filename}`)

    let propsDefinition: PropsDefinition = {}

    // 检查是否有参数
    const arg = node.arguments[0]
    if (arg) {
      // 有参数，从参数中解析
      propsDefinition = extractPropsDefinition(arg)
    } else {
      // 没有参数，检查是否有 TypeScript 泛型
      if (node.typeParameters && node.typeParameters.params && node.typeParameters.params.length > 0) {
        const typeParam = node.typeParameters.params[0]
        propsDefinition = extractTypeScriptProps(typeParam)
        logger.debug(`从 TypeScript 泛型解析 props: ${Object.keys(propsDefinition).length} 个属性`)
      } else {
        // 既没有参数也没有泛型，使用空的 props 定义
        logger.warn(`defineProps 没有参数也没有泛型，使用空的 props 定义: ${context.filename}`)
        propsDefinition = {}
      }
    }

    // 转换为小程序属性格式
    const miniprogramProperties = transformToMiniprogramProperties(propsDefinition)

    // 更新上下文
    context.props = propsDefinition

    logger.debug(`defineProps 处理完成: ${Object.keys(propsDefinition).length} 个属性`)

    return miniprogramProperties

  } catch (error) {
    logger.error(`defineProps 处理失败: ${context.filename}`, error as Error)
    throw error
  }
}

/**
 * 提取 props 定义
 */
function extractPropsDefinition(node: any): PropsDefinition {
  const props: PropsDefinition = {}

  if (node.type === 'ArrayExpression') {
    // 数组形式: ['prop1', 'prop2']
    node.elements.forEach((element: any) => {
      if (element?.type === 'StringLiteral') {
        props[element.value] = String
      }
    })
  } else if (node.type === 'ObjectExpression') {
    // 对象形式: { prop1: String, prop2: { type: Number, default: 0 } }
    node.properties.forEach((property: any) => {
      if (property.type === 'ObjectProperty') {
        const key = getPropertyKey(property.key)
        const value = extractPropertyValue(property.value)
        props[key] = value
      }
    })
  } else if (node.type === 'TSTypeReference' || node.type === 'TSTypeLiteral') {
    // TypeScript 类型定义
    const tsProps = extractTypeScriptProps(node)
    Object.assign(props, tsProps)
  }

  return props
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
function extractPropertyValue(valueNode: any): PropType | MacroPropDefinition {
  switch (valueNode.type) {
    case 'Identifier':
      return getConstructorFromName(valueNode.name)

    case 'ArrayExpression':
      // 多类型: [String, Number]
      return valueNode.elements.map((el: any) =>
        el?.type === 'Identifier' ? getConstructorFromName(el.name) : null
      ).filter(Boolean)

    case 'ObjectExpression':
      // 详细定义: { type: String, default: '', required: true }
      const definition: MacroPropDefinition = {}

      valueNode.properties.forEach((prop: any) => {
        if (prop.type === 'ObjectProperty') {
          const key = getPropertyKey(prop.key)
          const value = extractLiteralValue(prop.value)

          if (key === 'type') {
            definition.type = Array.isArray(value)
              ? value.map(getConstructorFromName)
              : getConstructorFromName(value)
          } else if (key === 'default') {
            definition.default = value
          } else if (key === 'required') {
            definition.required = value
          }
        }
      })

      return definition

    default:
      return String
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
    case 'ArrayExpression':
      return node.elements.map((el: any) => el ? extractLiteralValue(el) : null)
    case 'ObjectExpression':
      const obj: Record<string, any> = {}
      node.properties.forEach((prop: any) => {
        if (prop.type === 'ObjectProperty') {
          const key = getPropertyKey(prop.key)
          obj[key] = extractLiteralValue(prop.value)
        }
      })
      return obj
    default:
      return undefined
  }
}

/**
 * 从名称获取构造函数
 */
function getConstructorFromName(name: string): PropType {
  switch (name) {
    case 'String':
      return String
    case 'Number':
      return Number
    case 'Boolean':
      return Boolean
    case 'Array':
      return Array
    case 'Object':
      return Object
    default:
      return String
  }
}

/**
 * 提取 TypeScript props
 */
function extractTypeScriptProps(node: any): PropsDefinition {
  const props: PropsDefinition = {}

  try {
    logger.debug(`解析 TypeScript 类型节点: ${node.type}`)

    if (node.type === 'TSTypeReference') {
      // 类型引用，如 Props
      const typeName = node.typeName?.name || 'Unknown'
      logger.debug(`解析 TypeScript 类型引用: ${typeName}`)

      // 根据类型名称推断常见属性
      if (typeName === 'Props') {
        props.user = { type: Object, required: true }
        props.clickable = { type: Boolean, default: true }
      } else {
        // 对于其他类型引用，尝试从名称推断
        props[typeName.toLowerCase()] = { type: Object, required: false }
      }

    } else if (node.type === 'TSTypeLiteral') {
      // 内联类型字面量，如 { user: User; title?: string }
      logger.debug('解析 TypeScript 类型字面量')

      if (node.members && Array.isArray(node.members)) {
        node.members.forEach((member: any) => {
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

    } else if (node.type === 'TSInterfaceDeclaration') {
      // 接口声明
      logger.debug(`解析接口声明: ${node.id?.name}`)

      if (node.body && node.body.body) {
        node.body.body.forEach((member: any) => {
          if (member.type === 'TSPropertySignature') {
            const key = getPropertyKey(member.key)
            const isOptional = member.optional || false
            const tsType = member.typeAnnotation?.typeAnnotation

            props[key] = {
              type: mapTypeScriptTypeToConstructor(tsType),
              required: !isOptional,
              default: getDefaultValueForType(tsType)
            }
          }
        })
      }

    } else {
      logger.warn(`未支持的 TypeScript 类型: ${node.type}`)
      // 为未知类型创建一个默认属性
      props.unknownProp = { type: Object, required: false }
    }

  } catch (error) {
    logger.error('TypeScript props 解析失败', error as Error)
  }

  return props
}

/**
 * 转换为小程序属性格式
 */
function transformToMiniprogramProperties(props: PropsDefinition): Record<string, MiniprogramProperty> {
  const properties: Record<string, MiniprogramProperty> = {}

  Object.entries(props).forEach(([key, definition]) => {
    if (typeof definition === 'function') {
      // 简单类型
      properties[key] = {
        type: definition,
        value: getDefaultValue(definition)
      }
    } else if (typeof definition === 'object' && definition !== null) {
      // 详细定义
      const propDef = definition as MacroPropDefinition
      const propType = Array.isArray(propDef.type) ? propDef.type[0] : propDef.type
      const finalType = propType || String
      properties[key] = {
        type: finalType,
        value: propDef.default !== undefined ? propDef.default : getDefaultValue(finalType)
      }
    } else {
      // 默认为字符串类型
      properties[key] = {
        type: String,
        value: ''
      }
    }
  })

  return properties
}

/**
 * 获取类型的默认值
 */
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

/**
 * 生成小程序属性代码
 */
export function generatePropertiesCode(properties: Record<string, MiniprogramProperty>): string {
  const propertiesEntries = Object.entries(properties).map(([key, prop]) => {
    const typeStr = getTypeString(prop.type)
    const valueStr = JSON.stringify(prop.value)

    return `    ${key}: {
      type: ${typeStr},
      value: ${valueStr}
    }`
  })

  return `{
${propertiesEntries.join(',\n')}
  }`
}

/**
 * 映射 TypeScript 类型到构造函数
 */
function mapTypeScriptTypeToConstructor(tsType: any): PropType {
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
      // 处理自定义类型引用，如 User
      return Object
    case 'TSTypeLiteral':
      return Object
    case 'TSUnionType':
      // 联合类型，取第一个类型
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
 * 根据 TypeScript 类型获取默认值
 */
function getDefaultValueForType(tsType: any): any {
  const constructor = mapTypeScriptTypeToConstructor(tsType)
  return getDefaultValue(constructor)
}

/**
 * 获取类型字符串
 */
function getTypeString(type: PropType): string {
  if (type === String) return 'String'
  if (type === Number) return 'Number'
  if (type === Boolean) return 'Boolean'
  if (type === Array) return 'Array'
  if (type === Object) return 'Object'
  return 'null'
}
