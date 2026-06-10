/**
 * AST 表达式节点类型定义。
 */

import type { ASTNode } from './ast-base.js'
import type { BlockStatement } from './ast-statements.js'

/**
 * 标识符节点
 */
export interface Identifier extends ASTNode {
  type: 'Identifier'
  name: string
}

/**
 * 字面量节点
 */
export interface Literal extends ASTNode {
  type: 'Literal'
  value: string | number | boolean | null
  raw?: string
}

/**
 * 字符串字面量
 */
export interface StringLiteral extends ASTNode {
  type: 'StringLiteral'
  value: string
  raw?: string
}

/**
 * 数字字面量
 */
export interface NumericLiteral extends ASTNode {
  type: 'NumericLiteral'
  value: number
  raw?: string
}

/**
 * 布尔字面量
 */
export interface BooleanLiteral extends ASTNode {
  type: 'BooleanLiteral'
  value: boolean
}

/**
 * null字面量
 */
export interface NullLiteral extends ASTNode {
  type: 'NullLiteral'
  value: null
}

/**
 * 函数调用表达式
 */
export interface CallExpression extends ASTNode {
  type: 'CallExpression'
  callee: ASTNode
  arguments: ASTNode[]
}

/**
 * 成员表达式
 */
export interface MemberExpression extends ASTNode {
  type: 'MemberExpression'
  object: ASTNode
  property: ASTNode
  computed: boolean
}

/**
 * 二元表达式
 */
export interface BinaryExpression extends ASTNode {
  type: 'BinaryExpression'
  left: ASTNode
  right: ASTNode
  operator: string
}

/**
 * 赋值表达式
 */
export interface AssignmentExpression extends ASTNode {
  type: 'AssignmentExpression'
  left: ASTNode
  right: ASTNode
  operator: string
}

/**
 * 更新表达式 (++, --)
 */
export interface UpdateExpression extends ASTNode {
  type: 'UpdateExpression'
  argument: ASTNode
  operator: '++' | '--'
  prefix: boolean
}

/**
 * 一元表达式
 */
export interface UnaryExpression extends ASTNode {
  type: 'UnaryExpression'
  argument: ASTNode
  operator: string
  prefix: boolean
}

/**
 * 逻辑表达式
 */
export interface LogicalExpression extends ASTNode {
  type: 'LogicalExpression'
  left: ASTNode
  right: ASTNode
  operator: '&&' | '||' | '??'
}

/**
 * 条件表达式 (三元运算符)
 */
export interface ConditionalExpression extends ASTNode {
  type: 'ConditionalExpression'
  test: ASTNode
  consequent: ASTNode
  alternate: ASTNode
}

/**
 * 对象表达式
 */
export interface ObjectExpression extends ASTNode {
  type: 'ObjectExpression'
  properties: (ObjectProperty | SpreadElement)[]
}

/**
 * 对象属性
 */
export interface ObjectProperty extends ASTNode {
  type: 'ObjectProperty' | 'Property'
  key: ASTNode
  value: ASTNode
  computed: boolean
  shorthand: boolean
}

/**
 * 数组表达式
 */
export interface ArrayExpression extends ASTNode {
  type: 'ArrayExpression'
  elements: (ASTNode | null)[]
}

/**
 * 扩展元素
 */
export interface SpreadElement extends ASTNode {
  type: 'SpreadElement'
  argument: ASTNode
}

/**
 * 模板字面量
 */
export interface TemplateLiteral extends ASTNode {
  type: 'TemplateLiteral'
  quasis: TemplateElement[]
  expressions: ASTNode[]
}

/**
 * 模板元素
 */
export interface TemplateElement extends ASTNode {
  type: 'TemplateElement'
  value: {
    raw: string
    cooked: string
  }
  tail: boolean
}

/**
 * new表达式
 */
export interface NewExpression extends ASTNode {
  type: 'NewExpression'
  callee: ASTNode
  arguments: ASTNode[]
}

/**
 * 箭头函数表达式
 */
export interface ArrowFunctionExpression extends ASTNode {
  type: 'ArrowFunctionExpression'
  params: ASTNode[]
  body: ASTNode
  async: boolean
  expression: boolean
}

/**
 * 函数表达式
 */
export interface FunctionExpression extends ASTNode {
  type: 'FunctionExpression'
  id?: Identifier
  params: ASTNode[]
  body: BlockStatement
  async: boolean
  generator: boolean
}
