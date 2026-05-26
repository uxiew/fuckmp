/**
 * CLI 使用文档一致性审计。
 */

import { describe, expect, it } from 'vitest'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'

interface PackageJson {
  bin: Record<string, string>
  scripts: Record<string, string>
}

const readme = readProjectFile('README.md')
const packageJson = JSON.parse(readProjectFile('package.json')) as PackageJson

describe('CLI 使用文档一致性', () => {
  it('README 记录当前公开 CLI 入口与常用命令', () => {
    for (const binName of Object.keys(packageJson.bin)) {
      expect(readme).toContain(`\`${binName}\``)
    }

    for (const command of [
      'fuckmp create my-miniprogram',
      'fuckmp build --input src --output dist',
      'fuckmp dev [options]',
      'fmp build --input src --output dist'
    ]) {
      expect(readme).toContain(command)
    }
  })

  it('README 记录 create 模板和真实 DevTools opt-in 验收入口', () => {
    expect(readme).toContain('TS + SCSS 基础模板')
    expect(readme).toContain('tests/cli/create-templates.test.ts')
    expect(readme).toContain(packageJson.scripts['test:real-devtools'])
    expect(readme).toContain('pnpm test:real-devtools')
    expect(readme).toContain('FUCKMP_REAL_DEVTOOLS_SMOKE=1')
    expect(readme).toContain('WECHAT_IDE_CLI=')
  })
})

/**
 * 读取项目内文本文件。
 */
function readProjectFile(relativePath: string): string {
  return readFileSync(join(process.cwd(), relativePath), 'utf8')
}
