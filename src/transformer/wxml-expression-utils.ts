import { parseExpression } from '@babel/parser'
import { VISITOR_KEYS, type Node } from '@babel/types'
import type { TransformContext } from '@/types/index.js'
import { recordUnsupportedTemplateFeatures } from '@/utils/unsupported-template-utils.js'

const WXML_NODES = new Set([
  'Identifier', 'StringLiteral', 'NumericLiteral', 'BooleanLiteral', 'NullLiteral',
  'MemberExpression', 'UnaryExpression', 'BinaryExpression', 'LogicalExpression',
  'ConditionalExpression', 'ArrayExpression', 'ObjectExpression', 'ObjectProperty',
  'CallExpression'
])

export function validateWxmlExpression(expression: string, context?: TransformContext): string {
  if (!context || !expression.trim()) return expression
  try {
    if (isWxmlExpression(parseExpression(expression), context.templateWxsModules)) return expression
  } catch {
    // Invalid JavaScript cannot be emitted as a native expression.
  }
  recordUnsupportedTemplateFeatures(context, 'non-native WXML expression')
  return 'null'
}

function isWxmlExpression(node: Node, wxsModules?: ReadonlySet<string>): boolean {
  if (!WXML_NODES.has(node.type)) return false
  if (node.type === 'CallExpression') {
    const callee = node.callee
    if (callee.type !== 'MemberExpression' || callee.object.type !== 'Identifier') return false
    if (callee.object.name !== 'wxsH' && !wxsModules?.has(callee.object.name)) return false
  }
  if (node.type === 'UnaryExpression' && !['!', '+', '-', '~'].includes(node.operator)) return false
  if (node.type === 'BinaryExpression' && ['in', 'instanceof', '**'].includes(node.operator)) return false
  if (node.type === 'LogicalExpression' && node.operator === '??') return false
  if (node.type === 'ObjectProperty' && node.computed) return false

  const fields = node as unknown as Record<string, Node | Array<Node | null> | undefined>
  return (VISITOR_KEYS[node.type] || []).every(key => {
    const child = fields[key]
    if (Array.isArray(child)) return child.every(value => !value || isWxmlExpression(value, wxsModules))
    return !child || isWxmlExpression(child, wxsModules)
  })
}
