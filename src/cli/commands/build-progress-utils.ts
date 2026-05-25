/**
 * 构建进度和统计辅助工具。
 */

import { logger } from '@/utils/index.js'

/**
 * 格式化时间。
 */
export function formatTime(ms: number): string {
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
 * 显示构建进度。
 */
export class BuildProgress {
  private total: number = 0
  private current: number = 0
  private startTime: number = 0

  start(total: number): void {
    this.total = total
    this.current = 0
    this.startTime = Date.now()
    this.update()
  }

  increment(): void {
    this.current++
    this.update()
  }

  private update(): void {
    const percentage = Math.round((this.current / this.total) * 100)
    const elapsed = Date.now() - this.startTime
    const eta = this.current > 0 ? (elapsed / this.current) * (this.total - this.current) : 0

    const progressBar = this.createProgressBar(percentage)

    process.stdout.write(`\r${progressBar} ${percentage}% (${this.current}/${this.total}) ETA: ${formatTime(eta)}`)

    if (this.current === this.total) {
      process.stdout.write('\n')
    }
  }

  private createProgressBar(percentage: number): string {
    const width = 20
    const filled = Math.round((percentage / 100) * width)
    const empty = width - filled

    return `[${'█'.repeat(filled)}${' '.repeat(empty)}]`
  }
}

/**
 * 构建统计信息。
 */
export class BuildStats {
  private files: Map<string, { size: number; time: number }> = new Map()
  private startTime: number = 0

  start(): void {
    this.startTime = Date.now()
  }

  addFile(path: string, size: number, time: number): void {
    this.files.set(path, { size, time })
  }

  getStats(): {
    totalFiles: number
    totalSize: number
    totalTime: number
    averageTime: number
    largestFile: { path: string; size: number } | null
    slowestFile: { path: string; time: number } | null
  } {
    const totalTime = Date.now() - this.startTime
    const files = Array.from(this.files.entries())

    const totalSize = files.reduce((sum, [, stat]) => sum + stat.size, 0)
    const averageTime = files.length > 0 ? totalTime / files.length : 0

    const largestFile = files.reduce((largest, [path, stat]) => {
      return !largest || stat.size > largest.size ? { path, size: stat.size } : largest
    }, null as { path: string; size: number } | null)

    const slowestFile = files.reduce((slowest, [path, stat]) => {
      return !slowest || stat.time > slowest.time ? { path, time: stat.time } : slowest
    }, null as { path: string; time: number } | null)

    return {
      totalFiles: files.length,
      totalSize,
      totalTime,
      averageTime,
      largestFile,
      slowestFile
    }
  }

  printSummary(): void {
    const stats = this.getStats()

    logger.info('\n构建统计:')
    logger.info(`📁 文件数量: ${stats.totalFiles}`)
    logger.info(`📦 总大小: ${formatFileSize(stats.totalSize)}`)
    logger.info(`⏱️  总耗时: ${formatTime(stats.totalTime)}`)
    logger.info(`⚡ 平均耗时: ${formatTime(stats.averageTime)}`)

    if (stats.largestFile) {
      logger.info(`📈 最大文件: ${stats.largestFile.path} (${formatFileSize(stats.largestFile.size)})`)
    }

    if (stats.slowestFile) {
      logger.info(`🐌 最慢文件: ${stats.slowestFile.path} (${formatTime(stats.slowestFile.time)})`)
    }
  }
}

function formatFileSize(bytes: number): string {
  const units = ['B', 'KB', 'MB', 'GB']
  let size = bytes
  let unitIndex = 0

  while (size >= 1024 && unitIndex < units.length - 1) {
    size /= 1024
    unitIndex++
  }

  return `${size.toFixed(1)} ${units[unitIndex]}`
}
