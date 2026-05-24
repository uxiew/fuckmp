/**
 * 编译器工具函数
 */

import type { CompileResult } from '@/types/index.js'
import {
  createCompileResult,
  formatFileSize,
  formatTime,
  generateHash,
  getRelativePath,
  mergeCompileResults,
  validateFilePath
} from './compiler-utility-functions.js'
import {
  createCompileStatsReport,
  generateCompileErrorReport,
  generatePerformanceMeasureReport,
  getAverageCompileFileSize,
  getCompileCacheMissReason,
  getSlowestCompileFile,
  type CompileCacheEntry,
  type CompileErrorEntry,
  type CompileFileStat
} from './compiler-state-utils.js'

/**
 * 编译统计工具
 */
export class CompileStats {
  private startTime: number = 0
  private endTime: number = 0
  private fileStats: Map<string, CompileFileStat> = new Map()

  /**
   * 开始计时
   */
  start(): void {
    this.startTime = Date.now()
  }

  /**
   * 结束计时
   */
  end(): void {
    this.endTime = Date.now()
  }

  /**
   * 记录文件统计
   */
  recordFile(filePath: string, size: number, time: number): void {
    this.fileStats.set(filePath, { size, time })
  }

  /**
   * 获取总耗时
   */
  getTotalTime(): number {
    return this.endTime - this.startTime
  }

  /**
   * 获取平均文件大小
   */
  getAverageFileSize(): number {
    return getAverageCompileFileSize(this.fileStats)
  }

  /**
   * 获取最慢的文件
   */
  getSlowestFile(): { file: string; time: number } | null {
    return getSlowestCompileFile(this.fileStats)
  }

  /**
   * 生成统计报告
   */
  generateReport(): string {
    return createCompileStatsReport(this.getTotalTime(), this.fileStats)
  }
}

/**
 * 编译缓存管理器
 */
export class CompileCache {
  private cache: Map<string, CompileCacheEntry> = new Map()
  private maxAge: number = 24 * 60 * 60 * 1000 // 24小时

  constructor(maxAge?: number) {
    if (maxAge) {
      this.maxAge = maxAge
    }
  }

  /**
   * 获取缓存
   */
  get(filePath: string, contentHash: string): any | null {
    const cached = this.cache.get(filePath)

    const missReason = getCompileCacheMissReason(cached, contentHash, Date.now(), this.maxAge)
    if (missReason === 'missing') return null

    if (missReason) {
      this.cache.delete(filePath)
      return null
    }

    return cached!.result
  }

  /**
   * 设置缓存
   */
  set(filePath: string, contentHash: string, result: any): void {
    this.cache.set(filePath, {
      hash: contentHash,
      result,
      timestamp: Date.now()
    })
  }

  /**
   * 清理过期缓存
   */
  cleanup(): void {
    const now = Date.now()
    
    this.cache.forEach((cached, filePath) => {
      if (now - cached.timestamp > this.maxAge) {
        this.cache.delete(filePath)
      }
    })
  }

  /**
   * 清空所有缓存
   */
  clear(): void {
    this.cache.clear()
  }

  /**
   * 获取缓存大小
   */
  size(): number {
    return this.cache.size
  }
}

/**
 * 错误收集器
 */
export class ErrorCollector {
  private errors: CompileErrorEntry[] = []

  /**
   * 添加错误
   */
  addError(file: string, error: Error): void {
    this.errors.push({
      file,
      error,
      timestamp: Date.now()
    })
  }

  /**
   * 获取所有错误
   */
  getErrors(): CompileErrorEntry[] {
    return [...this.errors]
  }

  /**
   * 获取特定文件的错误
   */
  getFileErrors(file: string): Error[] {
    return this.errors
      .filter(item => item.file === file)
      .map(item => item.error)
  }

  /**
   * 清理错误
   */
  clear(): void {
    this.errors = []
  }

  /**
   * 生成错误报告
   */
  generateReport(): string {
    return generateCompileErrorReport(this.errors)
  }
}

/**
 * 性能监控器
 */
export class PerformanceMonitor {
  private marks: Map<string, number> = new Map()
  private measures: Map<string, number> = new Map()

  /**
   * 标记时间点
   */
  mark(name: string): void {
    this.marks.set(name, Date.now())
  }

  /**
   * 测量时间间隔
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
   * 获取测量结果
   */
  getMeasure(name: string): number | undefined {
    return this.measures.get(name)
  }

  /**
   * 获取所有测量结果
   */
  getAllMeasures(): Map<string, number> {
    return new Map(this.measures)
  }

  /**
   * 清理数据
   */
  clear(): void {
    this.marks.clear()
    this.measures.clear()
  }

  /**
   * 生成性能报告
   */
  generateReport(): string {
    return generatePerformanceMeasureReport(this.measures)
  }
}

/**
 * 编译器工具集合
 */
export class CompilerUtils {
  /**
   * 生成文件哈希
   */
  static generateHash(content: string): string {
    return generateHash(content)
  }

  /**
   * 格式化文件大小
   */
  static formatFileSize(bytes: number): string {
    return formatFileSize(bytes)
  }

  /**
   * 格式化时间
   */
  static formatTime(ms: number): string {
    return formatTime(ms)
  }

  /**
   * 验证文件路径
   */
  static validateFilePath(filePath: string): boolean {
    return validateFilePath(filePath)
  }

  /**
   * 获取相对路径
   */
  static getRelativePath(from: string, to: string): string {
    return getRelativePath(from, to)
  }

  /**
   * 创建编译结果
   */
  static createCompileResult(): CompileResult {
    return createCompileResult()
  }

  /**
   * 合并编译结果
   */
  static mergeCompileResults(results: CompileResult[]): CompileResult {
    return mergeCompileResults(results)
  }
}
