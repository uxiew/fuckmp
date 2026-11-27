import * as t from '@babel/types'

type StaticValue = null | string | number | boolean | StaticValue[] | { [key: string]: StaticValue }

export function readStaticScriptValue(node: t.Node | null | undefined): StaticValue | undefined {
  if (t.isNullLiteral(node)) return null
  if (t.isStringLiteral(node) || t.isBooleanLiteral(node)) return node.value
  if (t.isNumericLiteral(node)) return Number.isFinite(node.value) ? node.value : undefined

  if (t.isTSAsExpression(node) || t.isTSSatisfiesExpression(node) || t.isTSTypeAssertion(node) ||
    t.isParenthesizedExpression(node)) {
    return readStaticScriptValue(node.expression)
  }

  if (t.isUnaryExpression(node) && (node.operator === '-' || node.operator === '+')) {
    const value = readStaticScriptValue(node.argument)
    if (typeof value === 'number') return node.operator === '-' ? -value : value
  }

  if (t.isArrayExpression(node)) {
    const values = node.elements.map(element => readStaticScriptValue(element))
    if (values.every(value => value !== undefined)) return values
  }

  if (t.isObjectExpression(node)) {
    const entries: Array<[string, StaticValue]> = []
    for (const property of node.properties) {
      if (!t.isObjectProperty(property)) return undefined
      const key = getStaticPropertyKey(property)
      const value = readStaticScriptValue(property.value)
      if (key === undefined || key === '__proto__' || value === undefined) return undefined
      entries.push([key, value])
    }
    return Object.fromEntries(entries)
  }

  return undefined
}

export function getStaticPropertyKey(node: t.ObjectProperty): string | undefined {
  const { key, computed } = node
  if (t.isStringLiteral(key) || t.isNumericLiteral(key)) return String(key.value)
  if (!computed && t.isIdentifier(key)) return key.name
  return undefined
}

export function readStaticDefault(node: t.Node | null | undefined): StaticValue | undefined {
  if (t.isArrowFunctionExpression(node) || t.isFunctionExpression(node) || t.isObjectMethod(node)) {
    if (node.params.length || node.async || node.generator) return undefined
    if (!t.isBlockStatement(node.body)) return readStaticScriptValue(node.body)
    const statement = node.body.body[0]
    return node.body.body.length === 1 && t.isReturnStatement(statement)
      ? readStaticScriptValue(statement.argument)
      : undefined
  }
  return readStaticScriptValue(node)
}
