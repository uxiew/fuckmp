import { describe, expect, it } from 'vitest'
import {
  generateCodeFileHeader,
  getRelativeRuntimePath,
} from '@/compiler/codegen/code-generator-utils'

describe('code-generator utils', () => {
  it('生成包含运行时版本和目标平台的文件头', () => {
    const header = generateCodeFileHeader(
      { runtimeVersion: 'test-runtime' },
      { target: 'wechat', strict: true }
    )

    expect(header).toContain('运行时版本: test-runtime')
    expect(header).toContain('目标平台: wechat')
    expect(header).toContain("'use strict';")
  })

  it('根据输出路径深度生成 runtime-injection 相对路径', () => {
    expect(getRelativeRuntimePath('index')).toBe('./runtime-injection.js')
    expect(getRelativeRuntimePath('pages/home/index')).toBe('../../runtime-injection.js')
  })
})
