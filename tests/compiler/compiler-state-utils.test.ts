import { describe, expect, it } from 'vitest'
import {
  collectCompileErrorsByFile,
  createCompileStatsReport,
  generateCompileErrorReport,
  generatePerformanceMeasureReport,
  getAverageCompileFileSize,
  getCompileCacheMissReason,
  getSlowestCompileFile,
  removeFileFromCompilationState,
  resetCompilationState
} from '@/compiler/compiler-state-utils.js'

describe('compiler state utils', () => {
  it('计算平均文件大小和最慢文件', () => {
    const fileStats = new Map([
      ['a.vue', { size: 10, time: 5 }],
      ['b.vue', { size: 21, time: 18 }],
      ['c.vue', { size: 20, time: 9 }]
    ])

    expect(getAverageCompileFileSize(new Map())).toBe(0)
    expect(getAverageCompileFileSize(fileStats)).toBe(17)
    expect(getSlowestCompileFile(new Map())).toBeNull()
    expect(getSlowestCompileFile(fileStats)).toEqual({ file: 'b.vue', time: 18 })
  })

  it('生成编译统计报告并保留旧文本格式', () => {
    const fileStats = new Map([
      ['a.vue', { size: 10, time: 5 }],
      ['b.vue', { size: 21, time: 18 }]
    ])

    expect(createCompileStatsReport(40, fileStats)).toBe(`编译统计报告:
- 总耗时: 40ms
- 文件数量: 2
- 平均文件大小: 16 bytes
- 最慢文件: b.vue (18ms)
- 平均编译速度: 20ms/file`)
    expect(createCompileStatsReport(0, new Map())).toContain('- 最慢文件: N/A (0ms)')
  })

  it('判断缓存 miss 原因', () => {
    const now = 1_000
    expect(getCompileCacheMissReason(undefined, 'hash', now, 100)).toBe('missing')
    expect(getCompileCacheMissReason({ hash: 'old', timestamp: now, result: 'x' }, 'new', now, 100)).toBe('hash')
    expect(getCompileCacheMissReason({ hash: 'hash', timestamp: 0, result: 'x' }, 'hash', now, 100)).toBe('expired')
    expect(getCompileCacheMissReason({ hash: 'hash', timestamp: 950, result: 'x' }, 'hash', now, 100)).toBeNull()
  })

  it('按文件收集错误并生成错误报告', () => {
    const first = new Error('first')
    const second = new Error('second')
    const errors = [
      { file: 'a.vue', error: first, timestamp: 1 },
      { file: 'a.vue', error: second, timestamp: 2 }
    ]

    expect([...collectCompileErrorsByFile(errors).entries()]).toEqual([
      ['a.vue', [first, second]]
    ])
    expect(generateCompileErrorReport([])).toBe('没有编译错误')
    expect(generateCompileErrorReport(errors)).toBe(`编译错误报告 (2 个错误):
文件: a.vue
  1. first
  2. second`)
  })

  it('生成性能监控报告', () => {
    expect(generatePerformanceMeasureReport(new Map())).toBe('没有性能数据')
    expect(generatePerformanceMeasureReport(new Map([
      ['parse', 12],
      ['emit', 8]
    ]))).toBe(`性能监控报告:
- parse: 12ms
- emit: 8ms`)
  })

  it('重置编译项目状态并替换 appConfig 对象', () => {
    const state = {
      sourceFiles: new Map([['app.vue', '<template />']]),
      compiledPages: new Map([['pages/index.vue', {}]]),
      compiledComponents: new Map([['components/card.vue', {}]]),
      appConfig: { config: { pages: ['pages/index'] } }
    }

    const nextAppConfig = resetCompilationState(
      state.sourceFiles,
      state.compiledPages,
      state.compiledComponents
    )

    expect(state.sourceFiles.size).toBe(0)
    expect(state.compiledPages.size).toBe(0)
    expect(state.compiledComponents.size).toBe(0)
    expect(nextAppConfig).toEqual({})
    expect(nextAppConfig).not.toBe(state.appConfig)
  })

  it('移除非 app 源文件时清理三类状态并要求删除输出文件', () => {
    const state = {
      sourceFiles: new Map([
        ['pages/index.vue', '<template />'],
        ['components/card.vue', '<template />']
      ]),
      compiledPages: new Map([['pages/index.vue', { page: true }]]),
      compiledComponents: new Map([['components/card.vue', { component: true }]]),
      appConfig: { config: { pages: ['pages/index'] } }
    }

    const result = removeFileFromCompilationState(
      state.sourceFiles,
      state.compiledPages,
      state.compiledComponents,
      state.appConfig,
      'pages/index.vue',
      false
    )

    expect(state.sourceFiles.has('pages/index.vue')).toBe(false)
    expect(state.compiledPages.has('pages/index.vue')).toBe(false)
    expect(state.compiledComponents.has('pages/index.vue')).toBe(false)
    expect(result).toEqual({
      appConfig: state.appConfig,
      shouldRemoveGeneratedOutputs: true
    })
  })

  it('移除 app 源文件时重置 appConfig 且不删除普通输出文件', () => {
    const state = {
      sourceFiles: new Map([['app.vue', '<template />']]),
      compiledPages: new Map(),
      compiledComponents: new Map(),
      appConfig: { config: { pages: ['pages/index'] } }
    }

    const result = removeFileFromCompilationState(
      state.sourceFiles,
      state.compiledPages,
      state.compiledComponents,
      state.appConfig,
      'app.vue',
      true
    )

    expect(state.sourceFiles.size).toBe(0)
    expect(result).toEqual({
      appConfig: {},
      shouldRemoveGeneratedOutputs: false
    })
    expect(result.appConfig).not.toBe(state.appConfig)
  })
})
