/**
 * Script 解析器宏信息提取工具。
 */

import type { CallExpression, ObjectPattern } from '@babel/types'
import * as t from '@babel/types'
import { extractArgumentValue } from './script-codegen-utils.js'
import { getStaticPropertyKey, readStaticDefault, readStaticScriptValue } from './script-static-value.js'

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
  _result: ScriptMacroParseContext
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
      const value = readStaticScriptValue(property.value.right)
      if (value !== undefined) defaults[propName] = value
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
export function extractWithDefaultsInfo(node: CallExpression, _result: ScriptMacroParseContext): Record<string, any> {
  const defaultsNode = node.arguments[1]
  return {
    defaults: extractDefaultsObject(defaultsNode)
  }
}

/**
 * 提取 defineModel 变量信息。
 */
export function extractDefineModelInfo(
  node: CallExpression,
  variableName: string,
  _result: ScriptMacroParseContext
): Record<string, any> {
  const firstArg = node.arguments[0]
  const secondArg = node.arguments[1]
  const hasNamedModel = firstArg?.type === 'StringLiteral'
  const optionsNode = hasNamedModel ? secondArg : firstArg
  const options = t.isObjectExpression(optionsNode) ? optionsNode.properties : []
  const getOption = (name: string) => options.find(option =>
    t.isObjectProperty(option) ? getStaticPropertyKey(option) === name :
      t.isObjectMethod(option) && !option.computed && t.isIdentifier(option.key, { name }))
  const typeOption = getOption('type')
  const defaultOption = getOption('default')
  const requiredOption = getOption('required')
  const modelDefault = readStaticDefault(t.isObjectProperty(defaultOption) ? defaultOption.value : defaultOption)

  return {
    property: hasNamedModel ? firstArg.value : 'modelValue',
    variable: variableName,
    type: inferDefineModelType(node, t.isObjectProperty(typeOption) ? typeOption.value : undefined, modelDefault),
    default: modelDefault,
    required: t.isObjectProperty(requiredOption) && t.isBooleanLiteral(requiredOption.value, { value: true })
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
function extractDefaultsObject(node: t.Node | undefined): Record<string, unknown> {
  if (!t.isObjectExpression(node)) return {}
  const defaults: Record<string, any> = {}
  node.properties.forEach(property => {
    const key = t.isObjectProperty(property) ? getStaticPropertyKey(property) :
      t.isObjectMethod(property) && !property.computed && t.isIdentifier(property.key) ? property.key.name : undefined
    if (!key || key === '__proto__') return
    const value = readStaticDefault(t.isObjectProperty(property) ? property.value : property)
    if (value !== undefined) defaults[key] = value
  })

  return defaults
}

/**
 * 从 defineModel 泛型或默认值中推断小程序 property 类型。
 */
function inferDefineModelType(node: CallExpression, runtimeType: t.Node | undefined, value: unknown): string {
  if (t.isIdentifier(runtimeType) && ['String', 'Number', 'Boolean', 'Array', 'Object'].includes(runtimeType.name)) {
    return runtimeType.name
  }
  const typeParam = t.isTSTypeParameterInstantiation(node.typeParameters) ? node.typeParameters.params[0] : undefined
  switch (typeParam?.type) {
    case 'TSNumberKeyword':
      return 'Number'
    case 'TSBooleanKeyword':
      return 'Boolean'
    case 'TSArrayType':
    case 'TSTupleType':
      return 'Array'
    case 'TSTypeLiteral':
      return 'Object'
    case 'TSTypeReference':
      return t.isIdentifier(typeParam.typeName) && ['Array', 'ReadonlyArray'].includes(typeParam.typeName.name)
        ? 'Array'
        : 'Object'
    case 'TSStringKeyword':
      return 'String'
  }
  if (Array.isArray(value)) return 'Array'
  if (typeof value === 'number') return 'Number'
  if (typeof value === 'boolean') return 'Boolean'
  if (value && typeof value === 'object') return 'Object'
  return 'String'
}
