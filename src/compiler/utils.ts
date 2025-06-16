/**
 * 编译器工具函数
 */

import type { CompilerOptions, CompileResult } from '@/types/index.js'
import { logger } from '@/utils/index.js'

/**
 * 编译统计工具
 */
export class CompileStats {
  private startTime: number = 0
  private endTime: number = 0
  private fileStats: Map<string, { size: number; time: number }> = new Map()

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
    if (this.fileStats.size === 0) return 0
    
    const totalSize = Array.from(this.fileStats.values())
      .reduce((sum, stat) => sum + stat.size, 0)
    
    return Math.round(totalSize / this.fileStats.size)
  }

  /**
   * 获取最慢的文件
   */
  getSlowestFile(): { file: string; time: number } | null {
    if (this.fileStats.size === 0) return null
    
    let slowestFile = ''
    let slowestTime = 0
    
    this.fileStats.forEach((stat, file) => {
      if (stat.time > slowestTime) {
        slowestTime = stat.time
        slowestFile = file
      }
    })
    
    return { file: slowestFile, time: slowestTime }
  }

  /**
   * 生成统计报告
   */
  generateReport(): string {
    const totalTime = this.getTotalTime()
    const fileCount = this.fileStats.size
    const averageSize = this.getAverageFileSize()
    const slowestFile = this.getSlowestFile()
    
    return `编译统计报告:
- 总耗时: ${totalTime}ms
- 文件数量: ${fileCount}
- 平均文件大小: ${averageSize} bytes
- 最慢文件: ${slowestFile?.file || 'N/A'} (${slowestFile?.time || 0}ms)
- 平均编译速度: ${fileCount > 0 ? Math.round(totalTime / fileCount) : 0}ms/file`
  }
}

/**
 * 编译缓存管理器
 */
export class CompileCache {
  private cache: Map<string, { hash: string; result: any; timestamp: number }> = new Map()
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
    
    if (!cached) return null
    
    // 检查哈希是否匹配
    if (cached.hash !== contentHash) {
      this.cache.delete(filePath)
      return null
    }
    
    // 检查是否过期
    if (Date.now() - cached.timestamp > this.maxAge) {
      this.cache.delete(filePath)
      return null
    }
    
    return cached.result
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
  private errors: Array<{ file: string; error: Error; timestamp: number }> = []

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
  getErrors(): Array<{ file: string; error: Error; timestamp: number }> {
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
    if (this.errors.length === 0) {
      return '没有编译错误'
    }

    const errorsByFile = new Map<string, Error[]>()
    
    this.errors.forEach(({ file, error }) => {
      if (!errorsByFile.has(file)) {
        errorsByFile.set(file, [])
      }
      errorsByFile.get(file)!.push(error)
    })

    const reports: string[] = []
    
    errorsByFile.forEach((errors, file) => {
      reports.push(`文件: ${file}`)
      errors.forEach((error, index) => {
        reports.push(`  ${index + 1}. ${error.message}`)
      })
    })

    return `编译错误报告 (${this.errors.length} 个错误):\n${reports.join('\n')}`
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
    if (this.measures.size === 0) {
      return '没有性能数据'
    }

    const reports: string[] = ['性能监控报告:']
    
    this.measures.forEach((duration, name) => {
      reports.push(`- ${name}: ${duration}ms`)
    })

    return reports.join('\n')
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
    let hash = 0
    for (let i = 0; i < content.length; i++) {
      const char = content.charCodeAt(i)
      hash = ((hash << 5) - hash) + char
      hash = hash & hash // 转换为 32 位整数
    }
    return Math.abs(hash).toString(36)
  }

  /**
   * 格式化文件大小
   */
  static formatFileSize(bytes: number): string {
    const units = ['B', 'KB', 'MB', 'GB']
    let size = bytes
    let unitIndex = 0

    while (size >= 1024 && unitIndex < units.length - 1) {
      size /= 1024
      unitIndex++
    }

    return `${size.toFixed(1)} ${units[unitIndex]}`
  }

  /**
   * 格式化时间
   */
  static formatTime(ms: number): string {
    if (ms < 1000) {
      return `${ms}ms`
    } else if (ms < 60000) {
      return `${(ms / 1000).toFixed(1)}s`
    } else {
      const minutes = Math.floor(ms / 60000)
      const seconds = ((ms % 60000) / 1000).toFixed(1)
      return `${minutes}m ${seconds}s`
    }
  }

  /**
   * 验证文件路径
   */
  static validateFilePath(filePath: string): boolean {
    // 检查文件路径是否合法
    const invalidChars = /[<>:"|?*]/
    return !invalidChars.test(filePath)
  }

  /**
   * 获取相对路径
   */
  static getRelativePath(from: string, to: string): string {
    const { relative } = require('path')
    return relative(from, to).replace(/\\/g, '/')
  }

  /**
   * 创建编译结果
   */
  static createCompileResult(): CompileResult {
    return {
      success: [],
      errors: [],
      stats: {
        total: 0,
        success: 0,
        failed: 0,
        duration: 0
      }
    }
  }

  /**
   * 合并编译结果
   */
  static mergeCompileResults(results: CompileResult[]): CompileResult {
    const merged = this.createCompileResult()

    results.forEach(result => {
      merged.success.push(...result.success)
      merged.errors.push(...result.errors)
      merged.stats.total += result.stats.total
      merged.stats.success += result.stats.success
      merged.stats.failed += result.stats.failed
      merged.stats.duration += result.stats.duration
    })

    return merged
  }
}
