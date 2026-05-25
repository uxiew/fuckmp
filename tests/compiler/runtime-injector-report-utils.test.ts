import { describe, expect, it } from 'vitest'
import type { RuntimeInjectionConfig, Vue3FeatureUsage } from '@/compiler/runtime-injector.js'
import { createEmptyFeatureUsage } from '@/compiler/runtime-injector-usage-utils.js'
import {
  buildRuntimeInjectionReportLines,
  getGeneratedFilesTotalSize,
  getRuntimeGeneratedFileCount,
  getUsedRuntimeFeatureNames
} from '@/compiler/runtime-injector-report-utils.js'

const baseConfig: RuntimeInjectionConfig = {
  enableRuntime: true,
  runtimePath: './runtime/index.js',
  autoInject: true,
  runtimeConfig: {
    debug: true,
    performance: false
  },
  plugins: { enableAll: true, include: [], exclude: [] },
  treeshaking: true,
  minify: false,
  codeSplitting: true,
  chunkStrategy: 'feature',
  runtimeVersion: 'test-runtime',
  customModules: []
}

const bundleResult = {
  code: '// runtime bundle',
  modules: ['core', 'reactivity'],
  totalSize: 120,
  minifiedSize: 80
}

function createUsage(): Vue3FeatureUsage {
  const usage = createEmptyFeatureUsage()
  usage.reactivity.ref = true
  usage.composition.setup = true
  usage.directives.vIf = true
  return usage
}

describe('runtime injector report utils', () => {
  it('按 runtime injector 旧日志顺序收集已使用特性名称', () => {
    expect(getUsedRuntimeFeatureNames(createUsage())).toEqual([
      'reactivity.ref',
      'composition.setup',
      'directives.vIf'
    ])
  })

  it('统计生成文件总大小和运行时文件数量', () => {
    const files = [
      { path: 'runtime.js', content: 'abc', isRuntime: true },
      { path: 'pages/index.js', content: '12345', isRuntime: false },
      { path: 'runtime/chunk.js', content: 'xx', isRuntime: true }
    ]

    expect(getGeneratedFilesTotalSize(files)).toBe(10)
    expect(getRuntimeGeneratedFileCount(files)).toBe(2)
  })

  it('构造未压缩模式下注入报告行并保持旧文本顺序', () => {
    const files = [
      { path: 'runtime.js', content: 'abc', isRuntime: true },
      { path: 'pages/index.js', content: '12345' }
    ]

    expect(buildRuntimeInjectionReportLines(baseConfig, createUsage(), bundleResult, files)).toEqual([
      '=== 运行时注入报告 ===',
      '使用的Vue3特性: 3 个',
      '包含的运行时模块: core, reactivity',
      '运行时库大小: 120 字节',
      '生成的文件: 2 个',
      '运行时文件: 1 个',
      '总代码大小: 8 字节',
      '========================'
    ])
  })

  it('仅在 minify 启用时包含压缩后大小', () => {
    expect(
      buildRuntimeInjectionReportLines(
        { ...baseConfig, minify: true },
        createUsage(),
        bundleResult,
        []
      )
    ).toContain('压缩后大小: 80 字节')

    expect(buildRuntimeInjectionReportLines(baseConfig, createUsage(), bundleResult, [])).not.toContain(
      '压缩后大小: 80 字节'
    )
  })
})
