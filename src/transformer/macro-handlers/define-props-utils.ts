/**
 * defineProps 宏处理辅助函数。
 */

import type { MiniprogramProperty } from '@/types/index.js'
import { readStaticDefault } from '@/parser/script-static-value.js'
import { extractTypeScriptProps } from './define-props-type-utils.js'

/** Props 定义类型。 */
export interface PropsDefinition {
  [key: string]: PropDefinitionValue
}

/** 属性类型。 */
export type PropType =
  | StringConstructor
  | NumberConstructor
  | BooleanConstructor
  | ArrayConstructor
  | ObjectConstructor
  | null

/** 属性定义。 */
export interface MacroPropDefinition {
  type?: PropType | PropType[]
  default?: any
  required?: boolean
  validator?: Function
}

/** defineProps 中单个 prop 的归一化前定义值。 */
export type PropDefinitionValue = PropType | PropType[] | MacroPropDefinition

/**
 * 提取 props 定义。
 */
export function extractPropsDefinition(node: any): PropsDefinition {
  const props: PropsDefinition = {}

  if (node.type === 'ArrayExpression') {
    node.elements.forEach((element: any) => {
      if (element?.type === 'StringLiteral') {
        if (element.value !== '__proto__') props[element.value] = String
      }
    })
  } else if (node.type === 'ObjectExpression') {
    node.properties.forEach((property: any) => {
      if (property.type === 'ObjectProperty' && (!property.computed || property.key.type === 'StringLiteral')) {
        const key = getPropertyKey(property.key)
        if (key === '__proto__') return
        const value = extractPropertyValue(property.value)
        props[key] = value
      }
    })
  } else if (
    node.type === 'TSTypeReference' ||
    node.type === 'TSTypeLiteral' ||
    node.type === 'TSInterfaceDeclaration'
  ) {
    Object.assign(props, extractTypeScriptProps(node))
  }

  return props
}

/**
 * 转换为小程序属性格式。
 */
export function transformToMiniprogramProperties(
  props: PropsDefinition
): Record<string, MiniprogramProperty> {
  const properties: Record<string, MiniprogramProperty> = {}

  Object.entries(props).forEach(([key, definition]) => {
    if (typeof definition === 'function') {
      properties[key] = {
        type: definition,
        value: getDefaultValue(definition)
      }
      return
    }

    if (typeof definition === 'object' && definition !== null) {
      const propDef = definition as MacroPropDefinition
      const rawType = Array.isArray(definition) ? definition : propDef.type
      const propType = Array.isArray(rawType) ? rawType[0] : rawType
      const finalType = propType || String
      properties[key] = {
        type: finalType,
        value: propDef.default !== undefined ? propDef.default : getDefaultValue(finalType)
      }
      return
    }

    properties[key] = {
      type: String,
      value: ''
    }
  })

  return properties
}

/**
 * 生成小程序属性代码。
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

/** 提取属性值。 */
function extractPropertyValue(valueNode: any): PropDefinitionValue {
  switch (valueNode.type) {
    case 'Identifier':
      return getConstructorFromName(valueNode.name)

    case 'ArrayExpression':
      return valueNode.elements.map((el: any) =>
        el?.type === 'Identifier' ? getConstructorFromName(el.name) : null
      ).filter(Boolean) as PropType[]

    case 'ObjectExpression': {
      const definition: MacroPropDefinition = {}

      valueNode.properties.forEach((prop: any) => {
        if ((prop.type === 'ObjectProperty' || prop.type === 'ObjectMethod') &&
          (!prop.computed || prop.key.type === 'StringLiteral')) {
          const key = getPropertyKey(prop.key)
          if (key === 'default') {
            const value = readStaticDefault(prop.type === 'ObjectMethod' ? prop : prop.value)
            if (value !== undefined) definition.default = value
          } else if (prop.type === 'ObjectProperty') {
            if (key === 'type') {
              definition.type = prop.value.type === 'ArrayExpression'
                ? prop.value.elements.map((el: any) => el?.type === 'Identifier' ? getConstructorFromName(el.name) : null)
                : getConstructorFromName(prop.value.name)
            } else if (key === 'required') {
              definition.required = prop.value.type === 'BooleanLiteral' && prop.value.value
            }
          }
        }
      })

      return definition
    }

    default:
      return String
  }
}

/** 从名称获取构造函数。 */
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

/** 获取类型字符串。 */
function getTypeString(type: PropType): string {
  if (type === String) return 'String'
  if (type === Number) return 'Number'
  if (type === Boolean) return 'Boolean'
  if (type === Array) return 'Array'
  if (type === Object) return 'Object'
  return 'null'
}
