import { afterEach, describe, expect, it, vi } from 'vitest'
import { BuildProgress, BuildStats, formatTime } from '@/cli/commands/build-progress-utils.js'
import {
  BuildProgress as PublicBuildProgress,
  BuildStats as PublicBuildStats
} from '@/cli/commands/build.js'

describe('build progress utils', () => {
  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('继续通过 build 旧入口导出构建进度和统计 helper', () => {
    expect(PublicBuildProgress).toBe(BuildProgress)
    expect(PublicBuildStats).toBe(BuildStats)
  })

  it('格式化构建耗时并保持旧输出语义', () => {
    expect(formatTime(999)).toBe('999ms')
    expect(formatTime(1500)).toBe('1.5s')
    expect(formatTime(65_000)).toBe('1m 5.0s')
  })

  it('计算构建统计汇总、最大文件和最慢文件', () => {
    vi.spyOn(Date, 'now')
      .mockReturnValueOnce(1000)
      .mockReturnValueOnce(1600)

    const stats = new BuildStats()
    stats.start()
    stats.addFile('pages/index.js', 1024, 50)
    stats.addFile('pages/profile.js', 4096, 120)

    expect(stats.getStats()).toEqual({
      totalFiles: 2,
      totalSize: 5120,
      totalTime: 600,
      averageTime: 300,
      largestFile: { path: 'pages/profile.js', size: 4096 },
      slowestFile: { path: 'pages/profile.js', time: 120 }
    })
  })

  it('输出进度条、ETA 和完成换行', () => {
    vi.spyOn(Date, 'now')
      .mockReturnValueOnce(1000)
      .mockReturnValueOnce(1000)
      .mockReturnValueOnce(1500)
      .mockReturnValueOnce(2000)
    const write = vi.spyOn(process.stdout, 'write').mockImplementation(() => true)

    const progress = new BuildProgress()
    progress.start(2)
    progress.increment()
    progress.increment()

    const output = write.mock.calls.map(call => String(call[0])).join('')
    expect(output).toContain('0% (0/2) ETA: 0ms')
    expect(output).toContain('50% (1/2) ETA: 500ms')
    expect(output).toContain('100% (2/2) ETA: 0ms')
    expect(output.endsWith('\n')).toBe(true)
  })
})
