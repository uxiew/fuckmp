/**
 * Script 解析器宏信息提取工具。
 */

import type { CallExpression, ObjectPattern } from '@babel/types'
import { extractArgumentValue } from './script-codegen-utils.js'

/**
 * 宏提取所需的最小解析上下文。
 */
export interface ScriptMacroParseContext {
  variables: Map<string, any>
}

/**
 * 提取 Vue 3.5 defineProps 响应式解构的默认值和别名。
 */
export function extractDefinePropsDestructureInfo(
  pattern: ObjectPattern,
  result: ScriptMacroParseContext
): Record<string, any> {
  const defaults: Record<string, any> = {}
  const aliases: Record<string, string> = {}

  pattern.properties.forEach((property: any) => {
    if (property.type !== 'ObjectProperty') return

    const propName = getObjectPropertyKey(property.key)
    const localName = getDestructureLocalName(property.value)
    if (!propName || !localName) return

    aliases[localName] = propName

    if (property.value.type === 'AssignmentPattern') {
      defaults[propName] = extractDefaultValue(property.value.right, result)
    }
  })

  return { defaults, aliases }
}

/**
 * 获取数组解构的第一个标识符，用于 defineModel tuple 返回值。
 */
export function getArrayPatternFirstIdentifier(pattern: any): string {
  const firstElement = pattern.elements?.[0]
  return firstElement?.type === 'Identifier' ? firstElement.name : ''
}

/**
 * 提取 withDefaults(defineProps(), defaults) 中的默认值。
 */
export function extractWithDefaultsInfo(node: CallExpression, result: ScriptMacroParseContext): Record<string, any> {
  const defaultsNode = node.arguments[1]
  return {
    defaults: defaultsNode ? extractDefaultsObject(defaultsNode, result) : {}
  }
}

/**
 * 提取 defineModel 变量信息。
 */
export function extractDefineModelInfo(
  node: CallExpression,
  variableName: string,
  result: ScriptMacroParseContext
): Record<string, any> {
  const firstArg = node.arguments[0]
  const secondArg = node.arguments[1]
  const hasNamedModel = firstArg?.type === 'StringLiteral'
  const optionsNode = hasNamedModel ? secondArg : firstArg
  const options = optionsNode ? extractArgumentValue(optionsNode, result.variables) : {}

  return {
    property: hasNamedModel ? (firstArg as any).value : 'modelValue',
    variable: variableName,
    type: extractDefineModelType(node),
    default: options && typeof options === 'object' && 'default' in options ? options.default : undefined,
    required: options && typeof options === 'object' && 'required' in options ? options.required : false
  }
}

/**
 * 提取 Vue 3.5 useTemplateRef 的 ref key。
 */
export function extractUseTemplateRefInfo(
  node: CallExpression,
  variableName: string,
  result: ScriptMacroParseContext
): Record<string, any> {
  const firstArg = node.arguments[0]
  const refName = firstArg ? extractArgumentValue(firstArg, result.variables) : variableName

  return {
    variable: variableName,
    ref: typeof refName === 'string' ? refName : variableName
  }
}

/**
 * 获取对象属性 key。
 */
function getObjectPropertyKey(key: any): string {
  if (key.type === 'Identifier') return key.name
  if (key.type === 'StringLiteral' || key.type === 'NumericLiteral') return String(key.value)
  return ''
}

/**
 * 获取 defineProps 解构后的局部变量名。
 */
function getDestructureLocalName(value: any): string {
  if (value.type === 'Identifier') return value.name
  if (value.type === 'AssignmentPattern' && value.left.type === 'Identifier') return value.left.name
  return ''
}

/**
 * 提取 withDefaults 的对象字面量默认值。
 */
function extractDefaultsObject(node: any, result: ScriptMacroParseContext): Record<string, any> {
  if (!node || node.type !== 'ObjectExpression') {
    return {}
  }

  const defaults: Record<string, any> = {}
  node.properties.forEach((property: any) => {
    if (property.type !== 'ObjectProperty') return

    const key = property.key.type === 'Identifier' ? property.key.name : property.key.value
    defaults[key] = extractDefaultValue(property.value, result)
  })

  return defaults
}

/**
 * 提取单个 prop 默认值；数组/对象 factory 会取其返回的静态值。
 */
function extractDefaultValue(node: any, result: ScriptMacroParseContext): any {
  if (!node) {
    return undefined
  }

  if (node.type === 'ArrowFunctionExpression' || node.type === 'FunctionExpression') {
    if (node.body?.type === 'BlockStatement') {
      const returnStatement = node.body.body?.find((statement: any) => statement.type === 'ReturnStatement')
      return returnStatement?.argument ? extractArgumentValue(returnStatement.argument, result.variables) : undefined
    }
    return extractArgumentValue(node.body, result.variables)
  }

  return extractArgumentValue(node, result.variables)
}

/**
 * 从 defineModel 泛型或默认值中推断小程序 property 类型。
 */
function extractDefineModelType(node: CallExpression): string {
  const typeParam = (node as any).typeParameters?.params?.[0]
  switch (typeParam?.type) {
    case 'TSNumberKeyword':
      return 'Number'
    case 'TSBooleanKeyword':
      return 'Boolean'
    case 'TSArrayType':
      return 'Array'
    case 'TSTypeLiteral':
    case 'TSTypeReference':
      return 'Object'
    case 'TSStringKeyword':
    default:
      return 'String'
  }
}
