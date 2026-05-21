/**
 * 源码文件体积约束测试。
 */

import { describe, expect, it } from 'vitest'
import { readdirSync, readFileSync, statSync } from 'fs'
import { join, relative } from 'path'

const MAX_SOURCE_LINES = 740

describe('源码文件体积约束', () => {
  it(`src/**/*.ts 单文件不应超过 ${MAX_SOURCE_LINES} 行`, () => {
    const offenders = listTypeScriptFiles(join(process.cwd(), 'src'))
      .map(file => ({
        file: relative(process.cwd(), file),
        lines: countLines(file)
      }))
      .filter(item => item.lines > MAX_SOURCE_LINES)
      .sort((a, b) => b.lines - a.lines)

    expect(offenders).toEqual([])
  })
})

/**
 * 递归列出源码 TypeScript 文件。
 */
function listTypeScriptFiles(dir: string): string[] {
  return readdirSync(dir).flatMap(entry => {
    const filePath = join(dir, entry)
    const stats = statSync(filePath)

    if (stats.isDirectory()) {
      return listTypeScriptFiles(filePath)
    }

    return filePath.endsWith('.ts') ? [filePath] : []
  })
}

/**
 * 统计文件行数。
 */
function countLines(file: string): number {
  const content = readFileSync(file, 'utf8')
  if (!content) return 0

  return content.split('\n').length
}
