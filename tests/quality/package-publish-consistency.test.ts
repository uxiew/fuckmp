/**
 * npm 发布包契约一致性审计。
 */

import { describe, expect, it } from 'vitest'
import { existsSync, readFileSync } from 'node:fs'
import { join } from 'node:path'

interface PackageJson {
  main: string
  types: string
  bin: Record<string, string>
  files: string[]
}

const packageJson = JSON.parse(readProjectFile('package.json')) as PackageJson
const sourceEntry = readProjectFile('src/index.ts')
const readme = readProjectFile('README.md')

describe('npm 发布包契约一致性', () => {
  it('package.json files 不应声明源码中不存在的非生成目录', () => {
    const generatedEntries = new Set(['dist'])
    const missingEntries = packageJson.files
      .filter(entry => !generatedEntries.has(entry))
      .filter(entry => !existsProjectFile(entry))

    expect(missingEntries).toEqual([])
  })

  it('package.json main/types/bin 指向当前构建输出约定', () => {
    expect(packageJson.main).toBe('./dist/index.js')
    expect(packageJson.types).toBe('./dist/index.d.ts')
    expect(packageJson.bin).toEqual({
      fuckmp: './dist/cli/index.js',
      fmp: './dist/cli/index.js'
    })
  })

  it('README 示例中的根入口 API 必须由 src/index.ts 公开导出', () => {
    expect(readme).toContain('import { FuckMPCompiler } from \'fuckmp\'')
    expect(sourceEntry).toContain('FuckMPCompiler')
    expect(sourceEntry).toContain('Vue3MiniprogramCompiler')
    expect(sourceEntry).toContain('createCompiler')
  })

  it('ESM 根入口便捷 API 不应依赖 CommonJS require', () => {
    expect(sourceEntry).not.toContain('require(')
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
