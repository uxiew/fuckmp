/**
 * 编译结果构造辅助函数。
 */

import type { CompileResult } from '@/types/index.js'

/**
 * 创建空编译结果。
 */
export function createCompileResult(): CompileResult {
  return {
    success: [],
    errors: [],
    stats: {
      total: 0,
      success: 0,
      failed: 0,
      duration: 0
    }
  }
}

/**
 * 创建输入目录缺失时的编译结果。
 */
export function createMissingInputResult(inputPath: string, duration: number): CompileResult {
  return {
    ...createCompileResult(),
    errors: [
      {
        file: inputPath,
        message: createMissingInputMessage(inputPath)
      }
    ],
    stats: {
      total: 1,
      success: 0,
      failed: 1,
      duration
    }
  }
}

/**
 * 创建单文件编译错误对象。
 */
export function createCompileError(
  filePath: string,
  error: unknown
): CompileResult['errors'][number] {
  const normalizedError = normalizeError(error)
  const compileError: CompileResult['errors'][number] = {
    file: filePath,
    message: normalizedError.message
  }

  if (normalizedError.stack) {
    compileError.stack = normalizedError.stack
  }

  return compileError
}

/**
 * 创建输入目录缺失错误信息。
 */
export function createMissingInputMessage(inputPath: string): string {
  return `输入目录不存在或不可访问: ${inputPath}`
}

/**
 * 归一化未知异常值。
 */
function normalizeError(error: unknown): { message: string; stack?: string } {
  if (error instanceof Error) {
    return {
      message: error.message,
      ...(error.stack && { stack: error.stack })
    }
  }

  return {
    message: String(error)
  }
}
