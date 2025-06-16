/**
 * AST 操作工具
 */

import { parse } from '@babel/parser'
import _traverse, { type Visitor } from '@babel/traverse'
import _generate from '@babel/generator'
import * as t from '@babel/types'

// 处理 ES 模块和 CommonJS 的兼容性
const traverse = (_traverse as any).default || _traverse
const generate = (_generate as any).default || _generate
import type { Node, File } from '@babel/types'

/**
 * 解析 JavaScript 代码为 AST
 */
export function parseScript(code: string, options?: Parameters<typeof parse>[1]): File {
  return parse(code, {
    sourceType: 'module',
    plugins: ['typescript', 'jsx', 'decorators-legacy'],
    ...options
  })
}

/**
 * 遍历 AST
 */
export function traverseAST(ast: Node, visitor: Visitor): void {
  traverse(ast, visitor)
}

/**
 * 生成代码
 */
export function generateCode(ast: Node, options?: any): {
  code: string
  map?: any
} {
  return generate(ast, {
    compact: false,
    comments: true,
    ...(options || {})
  })
}

/**
 * 创建标识符
 */
export function createIdentifier(name: string): t.Identifier {
  return t.identifier(name)
}

/**
 * 创建字符串字面量
 */
export function createStringLiteral(value: string): t.StringLiteral {
  return t.stringLiteral(value)
}

/**
 * 创建数字字面量
 */
export function createNumericLiteral(value: number): t.NumericLiteral {
  return t.numericLiteral(value)
}

/**
 * 创建布尔字面量
 */
export function createBooleanLiteral(value: boolean): t.BooleanLiteral {
  return t.booleanLiteral(value)
}

/**
 * 创建对象表达式
 */
export function createObjectExpression(properties: t.ObjectProperty[]): t.ObjectExpression {
  return t.objectExpression(properties)
}

/**
 * 创建对象属性
 */
export function createObjectProperty(
  key: t.Expression | t.Identifier | t.StringLiteral,
  value: t.Expression
): t.ObjectProperty {
  return t.objectProperty(key, value)
}

/**
 * 创建数组表达式
 */
export function createArrayExpression(elements: (t.Expression | t.SpreadElement | null)[]): t.ArrayExpression {
  return t.arrayExpression(elements)
}

/**
 * 创建函数表达式
 */
export function createFunctionExpression(
  params: t.Identifier[],
  body: t.BlockStatement,
  id?: t.Identifier
): t.FunctionExpression {
  return t.functionExpression(id, params, body)
}

/**
 * 创建箭头函数表达式
 */
export function createArrowFunctionExpression(
  params: t.Identifier[],
  body: t.BlockStatement | t.Expression
): t.ArrowFunctionExpression {
  return t.arrowFunctionExpression(params, body)
}

/**
 * 创建调用表达式
 */
export function createCallExpression(
  callee: t.Expression,
  args: (t.Expression | t.SpreadElement)[]
): t.CallExpression {
  return t.callExpression(callee, args)
}

/**
 * 创建成员表达式
 */
export function createMemberExpression(
  object: t.Expression,
  property: t.Expression | t.Identifier,
  computed = false
): t.MemberExpression {
  return t.memberExpression(object, property, computed)
}

/**
 * 创建变量声明
 */
export function createVariableDeclaration(
  kind: 'var' | 'let' | 'const',
  declarations: t.VariableDeclarator[]
): t.VariableDeclaration {
  return t.variableDeclaration(kind, declarations)
}

/**
 * 创建变量声明器
 */
export function createVariableDeclarator(
  id: t.LVal,
  init?: t.Expression | null
): t.VariableDeclarator {
  return t.variableDeclarator(id, init)
}

/**
 * 创建块语句
 */
export function createBlockStatement(body: t.Statement[]): t.BlockStatement {
  return t.blockStatement(body)
}

/**
 * 创建返回语句
 */
export function createReturnStatement(argument?: t.Expression | null): t.ReturnStatement {
  return t.returnStatement(argument)
}

/**
 * 创建表达式语句
 */
export function createExpressionStatement(expression: t.Expression): t.ExpressionStatement {
  return t.expressionStatement(expression)
}

/**
 * 检查是否为标识符
 */
export function isIdentifier(node: Node): node is t.Identifier {
  return t.isIdentifier(node)
}

/**
 * 检查是否为字符串字面量
 */
export function isStringLiteral(node: Node): node is t.StringLiteral {
  return t.isStringLiteral(node)
}

/**
 * 检查是否为调用表达式
 */
export function isCallExpression(node: Node): node is t.CallExpression {
  return t.isCallExpression(node)
}

/**
 * 检查是否为变量声明
 */
export function isVariableDeclaration(node: Node): node is t.VariableDeclaration {
  return t.isVariableDeclaration(node)
}

/**
 * 检查是否为函数声明
 */
export function isFunctionDeclaration(node: Node): node is t.FunctionDeclaration {
  return t.isFunctionDeclaration(node)
}

/**
 * 检查是否为导入声明
 */
export function isImportDeclaration(node: Node): node is t.ImportDeclaration {
  return t.isImportDeclaration(node)
}

/**
 * 检查是否为导出声明
 */
export function isExportDeclaration(node: Node): node is t.ExportDeclaration {
  return t.isExportDeclaration(node)
}

/**
 * 获取节点的源码位置信息
 */
export function getNodeLocation(node: Node): string {
  if (node.loc) {
    const { start, end } = node.loc
    return `${start.line}:${start.column}-${end.line}:${end.column}`
  }
  return 'unknown'
}

/**
 * 克隆 AST 节点
 */
export function cloneNode<T extends Node>(node: T): T {
  return t.cloneNode(node)
}

/**
 * 移除节点
 */
export function removeNode(path: any): void {
  path.remove()
}

/**
 * 替换节点
 */
export function replaceNode(path: any, replacement: Node): void {
  path.replaceWith(replacement)
}

/**
 * 在节点前插入
 */
export function insertBefore(path: any, nodes: Node | Node[]): void {
  path.insertBefore(nodes)
}

/**
 * 在节点后插入
 */
export function insertAfter(path: any, nodes: Node | Node[]): void {
  path.insertAfter(nodes)
}
