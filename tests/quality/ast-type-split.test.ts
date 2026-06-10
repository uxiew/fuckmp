import { describe, expect, it } from 'vitest'
import { existsSync, readFileSync } from 'node:fs'
import { resolve } from 'node:path'

const typeDir = resolve(process.cwd(), 'src/types')

describe('AST 类型定义拆分约束', () => {
  it('保留 ast.ts 兼容入口并只做 type-only barrel', () => {
    const astSource = readFileSync(resolve(typeDir, 'ast.ts'), 'utf8')

    expect(astSource).toContain("export type * from './ast-base.js'")
    expect(astSource).toContain("export type * from './ast-expressions.js'")
    expect(astSource).toContain("export type * from './ast-statements.js'")
    expect(astSource).toContain("export type * from './ast-vue.js'")
    expect(astSource).not.toContain('export interface')
  })

  it('按 base / expressions / statements / vue 分组保存 AST 类型', () => {
    for (const file of [
      'ast-base.ts',
      'ast-expressions.ts',
      'ast-statements.ts',
      'ast-vue.ts'
    ]) {
      expect(existsSync(resolve(typeDir, file)), `${file} should exist`).toBe(true)
    }
  })

  it('基础类型文件保留 ASTNode 与源码位置信息定义', () => {
    const source = readFileSync(resolve(typeDir, 'ast-base.ts'), 'utf8')

    expect(source).toContain('export interface ASTNode')
    expect(source).toContain('export interface SourceLocation')
    expect(source).toContain('export interface Position')
  })

  it('Vue 专属类型文件保留 Vue 节点定义', () => {
    const source = readFileSync(resolve(typeDir, 'ast-vue.ts'), 'utf8')

    expect(source).toContain('export interface VueReactiveNode')
    expect(source).toContain('export interface VueDirectiveNode')
    expect(source).toContain('export interface VueSlotNode')
    expect(source).toContain('export interface VueComponentNode')
    expect(source).toContain('export interface VueMacroNode')
  })
})
