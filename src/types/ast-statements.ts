/**
 * AST 语句节点类型定义。
 */

import type { ASTNode } from './ast-base.js'
import type { Identifier } from './ast-expressions.js'

/**
 * 块语句
 */
export interface BlockStatement extends ASTNode {
  type: 'BlockStatement'
  body: ASTNode[]
}

/**
 * 表达式语句
 */
export interface ExpressionStatement extends ASTNode {
  type: 'ExpressionStatement'
  expression: ASTNode
}

/**
 * 变量声明
 */
export interface VariableDeclaration extends ASTNode {
  type: 'VariableDeclaration'
  declarations: VariableDeclarator[]
  kind: 'var' | 'let' | 'const'
}

/**
 * 变量声明器
 */
export interface VariableDeclarator extends ASTNode {
  type: 'VariableDeclarator'
  id: ASTNode
  init?: ASTNode
}

/**
 * if语句
 */
export interface IfStatement extends ASTNode {
  type: 'IfStatement'
  test: ASTNode
  consequent: ASTNode
  alternate?: ASTNode
}

/**
 * switch语句
 */
export interface SwitchStatement extends ASTNode {
  type: 'SwitchStatement'
  discriminant: ASTNode
  cases: SwitchCase[]
}

/**
 * switch case
 */
export interface SwitchCase extends ASTNode {
  type: 'SwitchCase'
  test?: ASTNode
  consequent: ASTNode[]
}

/**
 * break语句
 */
export interface BreakStatement extends ASTNode {
  type: 'BreakStatement'
  label?: Identifier
}

/**
 * return语句
 */
export interface ReturnStatement extends ASTNode {
  type: 'ReturnStatement'
  argument?: ASTNode
}
