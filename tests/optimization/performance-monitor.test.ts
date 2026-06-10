import { describe, expect, it } from 'vitest'
import { PerformanceMonitor } from '@/optimization/performance-monitor.js'
import { PerformanceMonitor as PublicPerformanceMonitor } from '@/optimization/performance.js'

describe('performance monitor', () => {
  it('继续通过 performance 旧入口导出监控器', () => {
    expect(PublicPerformanceMonitor).toBe(PerformanceMonitor)
  })

  it('没有指标时返回空报告并支持结束不存在的指标', () => {
    const monitor = new PerformanceMonitor()

    expect(monitor.generateReport()).toBe('没有性能数据')
    expect(monitor.end('missing')).toBeNull()
    expect(monitor.getMetrics()).toEqual([])
  })

  it('记录指标、生成报告并清理数据', () => {
    const monitor = new PerformanceMonitor()

    monitor.start('compile')
    const metric = monitor.end('compile')

    expect(metric).not.toBeNull()
    expect(metric?.name).toBe('compile')
    expect(metric?.duration).toBeGreaterThanOrEqual(0)
    expect(metric?.memoryUsage.heapUsed).toBeGreaterThan(0)
    expect(metric?.memoryUsageEnd?.heapUsed).toBeGreaterThan(0)
    expect(monitor.getMetrics()).toHaveLength(1)

    const report = monitor.generateReport()
    expect(report).toContain('性能监控报告:')
    expect(report).toContain('compile:')
    expect(report).toMatch(/耗时: \d+\.\d{2}ms/)
    expect(report).toMatch(/内存增长: -?\d+\.\d [A-Z]+/)

    monitor.clear()
    expect(monitor.getMetrics()).toEqual([])
  })
})
