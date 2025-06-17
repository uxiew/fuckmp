/**
 * AST节点类型定义
 * 为Vue语法解析提供统一的AST节点接口
 */

/**
 * AST节点基类
 */
export interface ASTNode {
  type: string
  start?: number
  end?: number
  loc?: SourceLocation
  [key: string]: any
}

/**
 * 源码位置信息
 */
export interface SourceLocation {
  start: Position
  end: Position
  source?: string
}

export interface Position {
  line: number
  column: number
}

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

/**
 * Vue特定的AST节点类型
 */

/**
 * Vue响应式节点
 */
export interface VueReactiveNode extends ASTNode {
  type: 'VueReactive'
  apiType: 'ref' | 'reactive' | 'computed' | 'watch' | 'watchEffect'
  initialValue?: ASTNode
  getter?: ASTNode
  setter?: ASTNode
}

/**
 * Vue指令节点
 */
export interface VueDirectiveNode extends ASTNode {
  type: 'VueDirective'
  name: string
  expression?: ASTNode
  modifiers: string[]
  argument?: string
}

/**
 * Vue插槽节点
 */
export interface VueSlotNode extends ASTNode {
  type: 'VueSlot'
  name: string
  props?: Record<string, ASTNode>
  fallback?: ASTNode[]
}

/**
 * Vue组件节点
 */
export interface VueComponentNode extends ASTNode {
  type: 'VueComponent'
  name: string
  props: Record<string, ASTNode>
  slots: VueSlotNode[]
  directives: VueDirectiveNode[]
}

/**
 * Vue宏节点
 */
export interface VueMacroNode extends ASTNode {
  type: 'VueMacro'
  macroType: 'defineProps' | 'defineEmits' | 'defineExpose' | 'withDefaults'
  arguments: ASTNode[]
}
