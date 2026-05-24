/**
 * AST节点类型定义兼容入口。
 *
 * 具体类型按 base / expressions / statements / vue 分组维护；
 * 现有调用方继续从 `@/types/ast` 或 `../../types/ast` 导入。
 */

export type * from './ast-base.js'
export type * from './ast-expressions.js'
export type * from './ast-statements.js'
export type * from './ast-vue.js'
