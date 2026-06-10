/**
 * 性能监控器。
 */

import { formatBytes } from './performance-utils.js'

/**
 * 性能指标接口。
 */
export interface PerformanceMetric {
  name: string
  startTime: number
  endTime: number
  duration: number
  memoryUsage: NodeJS.MemoryUsage
  memoryUsageEnd?: NodeJS.MemoryUsage
}

/**
 * 性能监控器。
 */
export class PerformanceMonitor {
  private metrics: Map<string, PerformanceMetric> = new Map()
  private startTime: number = 0

  /**
   * 开始监控。
   */
  start(name: string): void {
    this.startTime = performance.now()
    this.metrics.set(name, {
      name,
      startTime: this.startTime,
      endTime: 0,
      duration: 0,
      memoryUsage: process.memoryUsage()
    })
  }

  /**
   * 结束监控。
   */
  end(name: string): PerformanceMetric | null {
    const metric = this.metrics.get(name)
    if (!metric) return null

    metric.endTime = performance.now()
    metric.duration = metric.endTime - metric.startTime
    metric.memoryUsageEnd = process.memoryUsage()

    return metric
  }

  /**
   * 获取所有指标。
   */
  getMetrics(): PerformanceMetric[] {
    return Array.from(this.metrics.values())
  }

  /**
   * 生成性能报告。
   */
  generateReport(): string {
    const metrics = this.getMetrics()
    if (metrics.length === 0) return '没有性能数据'

    const reports = ['性能监控报告:']

    metrics.forEach(metric => {
      reports.push(`${metric.name}:`)
      reports.push(`  耗时: ${metric.duration.toFixed(2)}ms`)

      if (metric.memoryUsageEnd) {
        const memoryGrowth = metric.memoryUsageEnd.heapUsed - metric.memoryUsage.heapUsed
        reports.push(`  内存增长: ${formatBytes(memoryGrowth)}`)
      }
    })

    return reports.join('\n')
  }

  /**
   * 清理数据。
   */
  clear(): void {
    this.metrics.clear()
  }
}
