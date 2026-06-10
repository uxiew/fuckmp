/**
 * npm 包真实安装 smoke 入口文档一致性审计。
 */

import { describe, expect, it } from 'vitest'
import { existsSync, readFileSync } from 'node:fs'
import { join } from 'node:path'

interface PackageJson {
  scripts: Record<string, string>
}

const packageJson = JSON.parse(readProjectFile('package.json')) as PackageJson
const readme = readProjectFile('README.md')
const todo = readProjectFile('docs/TODO.md')

describe('npm 包真实安装 smoke 入口一致性', () => {
  it('package.json 提供默认跳过的 opt-in smoke 脚本', () => {
    expect(packageJson.scripts['test:package-smoke']).toBe('tsx scripts/package-smoke.ts')
    expect(existsProjectFile('scripts/package-smoke.ts')).toBe(true)

    const script = readProjectFile('scripts/package-smoke.ts')
    expect(script).toContain('FUCKMP_PACKAGE_SMOKE=1')
    expect(script).toContain('skipped')
  })

  it('README 和 TODO 记录 package smoke 验收入口', () => {
    expect(readme).toContain('pnpm test:package-smoke')
    expect(readme).toContain('FUCKMP_PACKAGE_SMOKE=1')
    expect(todo).toContain('npm 包真实安装 smoke')
    expect(todo).toContain('tests/quality/package-smoke-docs-consistency.test.ts')
  })
})

/**
 * 读取项目内文本文件。
 */
function readProjectFile(relativePath: string): string {
  return readFileSync(projectPath(relativePath), 'utf8')
}

/**
 * 判断项目内路径是否存在。
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
