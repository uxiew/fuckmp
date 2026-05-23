import { describe, expect, it } from 'vitest'
import type { Plugin } from '@/plugins/plugin-system.js'
import {
  collectCodeQualityIssues,
  createCacheEntryHash,
  createCompileMetricsSummary,
  groupIssuesByType,
  isCacheExpired,
  registerPluginHooks,
  unregisterPluginHooks
} from '@/plugins/plugin-system-utils.js'

describe('plugin system utils', () => {
  it('收集代码质量问题并按旧语义分组', () => {
    const longLine = 'x'.repeat(121)
    const content = [
      'console.log("a")',
      '// TODO one',
      '// TODO two',
      '// TODO three',
      '// TODO four',
      '// TODO five',
      '// TODO six',
      longLine
    ].join('\n')

    const issues = collectCodeQualityIssues('src/a.ts', content)

    expect(issues).toEqual([
      { file: 'src/a.ts', type: 'info', message: '发现 6 个 TODO 注释' },
      { file: 'src/a.ts', type: 'warning', message: '发现 1 个 console.log，建议移除' },
      { file: 'src/a.ts', type: 'warning', message: '第 8 行过长 (121 字符)' }
    ])
    expect(groupIssuesByType(issues)).toEqual({
      info: [issues[0]],
      warning: [issues[1], issues[2]]
    })
  })

  it('识别过大文件并生成编译耗时摘要', () => {
    expect(collectCodeQualityIssues('big.ts', 'a'.repeat(10001))[0]).toEqual({
      file: 'big.ts',
      type: 'warning',
      message: '文件过大，建议拆分'
    })

    expect(createCompileMetricsSummary([3, 9, 6])).toEqual({
      totalFiles: 3,
      averageTime: 6,
      maxTime: 9,
      minTime: 3
    })
    expect(createCompileMetricsSummary([])).toEqual({
      totalFiles: 0,
      averageTime: 0,
      maxTime: 0,
      minTime: 0
    })
  })

  it('保持缓存过期判断和旧 hash 语义', () => {
    expect(isCacheExpired(1000, 100, 1099)).toBe(false)
    expect(isCacheExpired(1000, 100, 1101)).toBe(true)
    expect(createCacheEntryHash('abc')).toBe('22ci')
  })

  it('注册和注销插件钩子时保持旧的 hook 存储语义', () => {
    const hooks = new Map<string, Function[]>()
    const plugin: Plugin = {
      name: 'demo',
      beforeCompile() {},
      transformFile(filePath: string) {
        return filePath
      }
    }

    registerPluginHooks(hooks, plugin)

    expect(hooks.get('beforeCompile')).toHaveLength(1)
    expect(hooks.get('transformFile')).toHaveLength(1)
    expect(hooks.has('afterCompile')).toBe(false)

    unregisterPluginHooks(hooks, plugin)

    // 旧实现通过 bound function 的 toString() 匹配插件名，通常不会移除上述钩子；这里锁定该行为避免重构中误改语义。
    expect(hooks.get('beforeCompile')).toHaveLength(1)
    expect(hooks.get('transformFile')).toHaveLength(1)
  })
})
