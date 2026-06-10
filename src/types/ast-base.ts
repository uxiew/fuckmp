/**
 * AST 基础节点类型定义。
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
