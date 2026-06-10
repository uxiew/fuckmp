import { describe, expect, it } from 'vitest'
import { PerformanceMonitor } from '@/compiler/compiler-performance-monitor.js'
import { PerformanceMonitor as LegacyPerformanceMonitor } from '@/compiler/utils.js'

describe('compiler PerformanceMonitor', () => {
  it('记录 mark 并测量到当前时间或结束 mark 的耗时', () => {
    const monitor = new PerformanceMonitor()
    const originalNow = Date.now

    try {
      Date.now = () => 100
      monitor.mark('start')
      Date.now = () => 125
      expect(monitor.measure('build', 'start')).toBe(25)
      expect(monitor.getMeasure('build')).toBe(25)

      Date.now = () => 200
      monitor.mark('end')
      Date.now = () => 999
      expect(monitor.measure('fixed', 'start', 'end')).toBe(100)
      expect(monitor.getMeasure('fixed')).toBe(100)
    } finally {
      Date.now = originalNow
    }
  })

  it('缺失起始或结束 mark 时保持旧错误文本', () => {
    const monitor = new PerformanceMonitor()

    expect(() => monitor.measure('missing-start', 'start')).toThrow('未找到起始标记: start')

    monitor.mark('start')
    expect(() => monitor.measure('missing-end', 'start', 'end')).toThrow('未找到结束标记: end')
  })

  it('返回测量结果副本并支持 clear', () => {
    const monitor = new PerformanceMonitor()
    const originalNow = Date.now

    try {
      Date.now = () => 10
      monitor.mark('start')
      Date.now = () => 15
      monitor.measure('compile', 'start')
    } finally {
      Date.now = originalNow
    }

    const measures = monitor.getAllMeasures()
    measures.set('compile', 999)

    expect(monitor.getMeasure('compile')).toBe(5)
    expect(monitor.getAllMeasures().get('compile')).toBe(5)

    monitor.clear()
    expect(monitor.getMeasure('compile')).toBeUndefined()
    expect([...monitor.getAllMeasures().entries()]).toEqual([])
  })

  it('生成性能报告并保持 compiler utils 旧入口兼容', () => {
    const monitor = new PerformanceMonitor()
    const originalNow = Date.now

    expect(monitor.generateReport()).toBe('没有性能数据')

    try {
      Date.now = () => 1
      monitor.mark('start')
      Date.now = () => 4
      monitor.measure('compile', 'start')
    } finally {
      Date.now = originalNow
    }

    expect(monitor.generateReport()).toBe(`性能监控报告:\n- compile: 3ms`)
    expect(LegacyPerformanceMonitor).toBe(PerformanceMonitor)
  })
})
