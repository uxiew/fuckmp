/**
 * 编译器性能监控器。
 */

import { generatePerformanceMeasureReport } from './compiler-state-utils.js'

/**
 * 编译器侧轻量性能监控器。
 */
export class PerformanceMonitor {
  private marks: Map<string, number> = new Map()
  private measures: Map<string, number> = new Map()

  /**
   * 标记时间点。
   */
  mark(name: string): void {
    this.marks.set(name, Date.now())
  }

  /**
   * 测量时间间隔。
   */
  measure(name: string, startMark: string, endMark?: string): number {
    const startTime = this.marks.get(startMark)
    if (!startTime) {
      throw new Error(`未找到起始标记: ${startMark}`)
    }

    const endTime = endMark ? this.marks.get(endMark) : Date.now()
    if (endMark && !endTime) {
      throw new Error(`未找到结束标记: ${endMark}`)
    }

    const duration = (endTime || Date.now()) - startTime
    this.measures.set(name, duration)

    return duration
  }

  /**
   * 获取测量结果。
   */
  getMeasure(name: string): number | undefined {
    return this.measures.get(name)
  }

  /**
   * 获取所有测量结果。
   */
  getAllMeasures(): Map<string, number> {
    return new Map(this.measures)
  }

  /**
   * 清理数据。
   */
  clear(): void {
    this.marks.clear()
    this.measures.clear()
  }

  /**
   * 生成性能报告。
   */
  generateReport(): string {
    return generatePerformanceMeasureReport(this.measures)
  }
}
