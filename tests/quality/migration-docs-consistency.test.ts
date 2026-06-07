/**
 * 真实项目迁移文档一致性审计。
 */

import { describe, expect, it } from 'vitest'
import { existsSync, readFileSync } from 'node:fs'
import { join } from 'node:path'

const MIGRATION_GUIDE = 'docs/migration-guide.md'

describe('真实项目迁移文档一致性', () => {
  it('提供正式迁移指南并覆盖版本兼容和 Native-first 边界', () => {
    expect(existsProjectFile(MIGRATION_GUIDE)).toBe(true)

    const guide = readProjectFile(MIGRATION_GUIDE)

    for (const heading of [
      '# 真实项目迁移指南',
      '## 适用范围',
      '## 迁移步骤',
      '## Vue3 特性迁移策略',
      '## 版本兼容策略',
      '## 验证清单',
      '## 回滚建议'
    ]) {
      expect(guide).toContain(heading)
    }

    for (const requiredText of [
      'Native-first + Thin Runtime',
      'vue@3.5.35',
      '@vue/compiler-sfc@3.5.35',
      '@vue/reactivity@3.5.35',
      'docs/latest-platform-baseline.md',
      'docs/native-first-runtime-boundary.md',
      'examples/real-miniprogram',
      'pnpm type-check',
      'pnpm test:run',
      'pnpm build',
      'pnpm test:real-devtools'
    ]) {
      expect(guide).toContain(requiredText)
    }
  })

  it('README 和 TODO 公开迁移指南入口，避免开发者体验文档漂移', () => {
    const readme = readProjectFile('README.md')
    const todo = readProjectFile('docs/TODO.md')

    expect(readme).toContain(MIGRATION_GUIDE)
    expect(readme).toContain('真实项目迁移')
    expect(todo).toContain('真实项目迁移指南')
    expect(todo).toContain(MIGRATION_GUIDE)
  })
})

/**
 * 读取项目内文本文件。
 */
function readProjectFile(relativePath: string): string {
  return readFileSync(projectPath(relativePath), 'utf8')
}

/**
 * 判断项目内文件是否存在。
 */
function existsProjectFile(relativePath: string): boolean {
  return existsSync(projectPath(relativePath))
}

/**
 * 拼接项目绝对路径。
 */
function projectPath(relativePath: string): string {
  return join(process.cwd(), relativePath)
}
