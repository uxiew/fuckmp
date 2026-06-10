/**
 * CLI 入口维护性约束。
 */

import { describe, expect, it } from 'vitest'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'

const cliEntry = readProjectFile('src/cli/index.ts')

describe('CLI 入口维护性约束', () => {
  it('不保留未接入 Commander 的旧自定义 help helper', () => {
    expect(cliEntry).not.toContain('function showHelp(')
  })

  it('子命令应通过独立 create*Command 模块注册', () => {
    expect(cliEntry).not.toMatch(/\.command\(['"](?:build|create|dev|config|clean|analyze)['"]\)/)

    for (const commandFactory of [
      'createBuildCommand',
      'createCreateCommand',
      'createDevCommand',
      'createConfigCommand',
      'createCleanCommand',
      'createAnalyzeCommand'
    ]) {
      expect(cliEntry).toContain(`program.addCommand(${commandFactory}())`)
    }
  })
})

/**
 * 读取项目内文本文件。
 */
function readProjectFile(relativePath: string): string {
  return readFileSync(join(process.cwd(), relativePath), 'utf8')
}
