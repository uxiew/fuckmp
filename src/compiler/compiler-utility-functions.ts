/**
 * 编译器通用纯函数工具。
 */

import { relative } from 'path'
import type { CompileResult } from '@/types/index.js'

/**
 * 生成内容哈希。
 */
export function generateHash(content: string): string {
  let hash = 0
  for (let i = 0; i < content.length; i++) {
    const char = content.charCodeAt(i)
    hash = ((hash << 5) - hash) + char
    hash = hash & hash
  }
  return Math.abs(hash).toString(36)
}

/**
 * 格式化文件大小。
 */
export function formatFileSize(bytes: number): string {
  const units = ['B', 'KB', 'MB', 'GB']
  let size = bytes
  let unitIndex = 0

  while (size >= 1024 && unitIndex < units.length - 1) {
    size /= 1024
    unitIndex++
  }

  return `${size.toFixed(1)} ${units[unitIndex]}`
}

/**
 * 格式化耗时。
 */
export function formatTime(ms: number): string {
  if (ms < 1000) {
    return `${ms}ms`
  }

  if (ms < 60000) {
    return `${(ms / 1000).toFixed(1)}s`
  }

  const minutes = Math.floor(ms / 60000)
  const seconds = ((ms % 60000) / 1000).toFixed(1)
  return `${minutes}m ${seconds}s`
}

/**
 * 验证文件路径是否包含非法字符。
 */
export function validateFilePath(filePath: string): boolean {
  const invalidChars = /[<>:"|?*]/
  return !invalidChars.test(filePath)
}

/**
 * 获取使用 POSIX 分隔符的相对路径。
 */
export function getRelativePath(from: string, to: string): string {
  return relative(from, to).replace(/\\/g, '/')
}

/**
 * 创建空编译结果。
 */
export function createCompileResult(): CompileResult {
  return {
    success: [],
    errors: [],
    warnings: [],
    stats: {
      total: 0,
      success: 0,
      failed: 0,
      duration: 0
    }
  }
}

/**
 * 合并多个编译结果。
 */
export function mergeCompileResults(results: CompileResult[]): CompileResult {
  const merged = createCompileResult()

  results.forEach(result => {
    merged.success.push(...result.success)
    merged.errors.push(...result.errors)
    merged.warnings.push(...result.warnings)
    merged.stats.total += result.stats.total
    merged.stats.success += result.stats.success
    merged.stats.failed += result.stats.failed
    merged.stats.duration += result.stats.duration
  })

  return merged
}
