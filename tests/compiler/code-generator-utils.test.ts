import { describe, expect, it } from 'vitest'
import {
  filterInvalidOptions,
  generateCodeFileHeader,
  getRelativeRuntimePath,
  mapVueTypeToMiniProgram,
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

  it('映射 Vue prop 类型到小程序构造函数名', () => {
    expect(mapVueTypeToMiniProgram('string')).toBe('String')
    expect(mapVueTypeToMiniProgram('Number')).toBe('Number')
    expect(mapVueTypeToMiniProgram(Boolean)).toBe('Boolean')
    expect(mapVueTypeToMiniProgram(Array)).toBe('Array')
    expect(mapVueTypeToMiniProgram(null)).toBe('Object')
    expect(mapVueTypeToMiniProgram('unknown')).toBe('Object')
  })

  it('过滤空 option 与无效生命周期占位但保留空数组', () => {
    expect(
      filterInvalidOptions({
        title: '首页',
        emptyText: '',
        nullable: null,
        missing: undefined,
        tabs: [],
        onShow: '无效的回调函数: onShow',
        onLoad: 'function(options) {}',
      })
    ).toEqual({
      title: '首页',
      tabs: [],
      onLoad: 'function(options) {}',
    })
  })
})
