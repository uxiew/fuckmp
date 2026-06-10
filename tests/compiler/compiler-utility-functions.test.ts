import { describe, expect, it } from 'vitest'
import {
  createCompileResult,
  formatFileSize,
  formatTime,
  generateHash,
  getRelativePath,
  mergeCompileResults,
  validateFilePath
} from '@/compiler/compiler-utility-functions.js'

describe('compiler utility functions', () => {
  it('生成稳定内容哈希', () => {
    expect(generateHash('hello')).toBe(generateHash('hello'))
    expect(generateHash('hello')).not.toBe(generateHash('world'))
    expect(generateHash('')).toBe('0')
  })

  it('格式化文件大小和耗时', () => {
    expect(formatFileSize(0)).toBe('0.0 B')
    expect(formatFileSize(1024)).toBe('1.0 KB')
    expect(formatFileSize(1024 * 1024)).toBe('1.0 MB')

    expect(formatTime(999)).toBe('999ms')
    expect(formatTime(1500)).toBe('1.5s')
    expect(formatTime(61_500)).toBe('1m 1.5s')
  })

  it('校验文件路径并归一化相对路径分隔符', () => {
    expect(validateFilePath('src/pages/index.vue')).toBe(true)
    expect(validateFilePath('src/pages/inva<lid.vue')).toBe(false)
    expect(validateFilePath('src/pages/inva|lid.vue')).toBe(false)

    expect(getRelativePath('/project/src', '/project/src/pages/index.vue')).toBe('pages/index.vue')
  })

  it('创建并合并编译结果', () => {
    expect(createCompileResult()).toEqual({
      success: [],
      errors: [],
      stats: {
        total: 0,
        success: 0,
        failed: 0,
        duration: 0
      }
    })

    const merged = mergeCompileResults([
      {
        success: ['a.vue'],
        errors: [],
        stats: { total: 1, success: 1, failed: 0, duration: 10 }
      },
      {
        success: [],
        errors: [{ file: 'b.vue', message: 'boom' }],
        stats: { total: 1, success: 0, failed: 1, duration: 20 }
      }
    ])

    expect(merged).toEqual({
      success: ['a.vue'],
      errors: [{ file: 'b.vue', message: 'boom' }],
      stats: { total: 2, success: 1, failed: 1, duration: 30 }
    })
  })
})
