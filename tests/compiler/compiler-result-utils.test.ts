import { describe, expect, it } from 'vitest'
import {
  createCompileError,
  createCompileResult,
  createMissingInputResult
} from '@/compiler/compiler-result-utils.js'

describe('compiler result utils', () => {
  it('创建空编译结果', () => {
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
  })

  it('创建输入目录缺失结果', () => {
    expect(createMissingInputResult('/project/src', 25)).toEqual({
      success: [],
      errors: [
        {
          file: '/project/src',
          message: '输入目录不存在或不可访问: /project/src'
        }
      ],
      stats: {
        total: 1,
        success: 0,
        failed: 1,
        duration: 25
      }
    })
  })

  it('从 Error 创建编译错误并保留 stack', () => {
    const error = new Error('parse failed')
    error.stack = 'stack trace'

    expect(createCompileError('/project/src/pages/index.vue', error)).toEqual({
      file: '/project/src/pages/index.vue',
      message: 'parse failed',
      stack: 'stack trace'
    })
  })

  it('从非 Error 值创建编译错误', () => {
    expect(createCompileError('/project/src/pages/index.vue', 'bad input')).toEqual({
      file: '/project/src/pages/index.vue',
      message: 'bad input'
    })
  })
})
