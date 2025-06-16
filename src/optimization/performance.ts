/**
 * 性能优化模块
 */

import { Worker } from 'worker_threads'
import { cpus } from 'os'
import { logger } from '@/utils/index.js'

/**
 * 性能监控器
 */
export class PerformanceMonitor {
  private metrics: Map<string, PerformanceMetric> = new Map()
  private startTime: number = 0

  /**
   * 开始监控
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
   * 结束监控
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
   * 获取所有指标
   */
  getMetrics(): PerformanceMetric[] {
    return Array.from(this.metrics.values())
  }

  /**
   * 生成性能报告
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
        reports.push(`  内存增长: ${this.formatBytes(memoryGrowth)}`)
      }
    })

    return reports.join('\n')
  }

  /**
   * 清理数据
   */
  clear(): void {
    this.metrics.clear()
  }

  /**
   * 格式化字节数
   */
  private formatBytes(bytes: number): string {
    const units = ['B', 'KB', 'MB', 'GB']
    let size = Math.abs(bytes)
    let unitIndex = 0

    while (size >= 1024 && unitIndex < units.length - 1) {
      size /= 1024
      unitIndex++
    }

    const sign = bytes < 0 ? '-' : ''
    return `${sign}${size.toFixed(1)} ${units[unitIndex]}`
  }
}

/**
 * 性能指标接口
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
 * 并发编译管理器
 */
export class ConcurrentCompiler {
  private maxWorkers: number
  private workers: Worker[] = []
  private taskQueue: CompileTask[] = []
  private activeJobs: Map<Worker, CompileTask> = new Map()

  constructor(maxWorkers?: number) {
    this.maxWorkers = maxWorkers || Math.max(1, cpus().length - 1)
  }

  /**
   * 添加编译任务
   */
  addTask(task: CompileTask): Promise<any> {
    return new Promise((resolve, reject) => {
      task.resolve = resolve
      task.reject = reject
      this.taskQueue.push(task)
      this.processQueue()
    })
  }

  /**
   * 处理任务队列
   */
  private async processQueue(): Promise<void> {
    if (this.taskQueue.length === 0) return

    // 创建工作线程
    while (this.workers.length < this.maxWorkers && this.taskQueue.length > 0) {
      const worker = await this.createWorker()
      this.workers.push(worker)
    }

    // 分配任务
    for (const worker of this.workers) {
      if (!this.activeJobs.has(worker) && this.taskQueue.length > 0) {
        const task = this.taskQueue.shift()!
        this.activeJobs.set(worker, task)
        this.executeTask(worker, task)
      }
    }
  }

  /**
   * 创建工作线程
   */
  private async createWorker(): Promise<Worker> {
    const worker = new Worker(`
      const { parentPort } = require('worker_threads')
      
      parentPort.on('message', async (task) => {
        try {
          // 这里执行实际的编译任务
          const result = await compileFile(task.filePath, task.options)
          parentPort.postMessage({ success: true, result })
        } catch (error) {
          parentPort.postMessage({ success: false, error: error.message })
        }
      })
    `, { eval: true })

    worker.on('error', (error) => {
      logger.error('工作线程错误:', error)
    })

    return worker
  }

  /**
   * 执行任务
   */
  private executeTask(worker: Worker, task: CompileTask): void {
    worker.postMessage({
      filePath: task.filePath,
      options: task.options
    })

    worker.once('message', (result) => {
      this.activeJobs.delete(worker)
      
      if (result.success) {
        task.resolve!(result.result)
      } else {
        task.reject!(new Error(result.error))
      }

      // 处理下一个任务
      this.processQueue()
    })
  }

  /**
   * 关闭所有工作线程
   */
  async shutdown(): Promise<void> {
    await Promise.all(this.workers.map(worker => worker.terminate()))
    this.workers = []
    this.activeJobs.clear()
  }
}

/**
 * 编译任务接口
 */
export interface CompileTask {
  filePath: string
  options: any
  resolve?: (result: any) => void
  reject?: (error: Error) => void
}

/**
 * 缓存管理器
 */
export class CacheManager {
  private cache: Map<string, CacheEntry> = new Map()
  private maxSize: number
  private maxAge: number

  constructor(maxSize: number = 1000, maxAge: number = 24 * 60 * 60 * 1000) {
    this.maxSize = maxSize
    this.maxAge = maxAge
  }

  /**
   * 获取缓存
   */
  get(key: string): any | null {
    const entry = this.cache.get(key)
    if (!entry) return null

    // 检查是否过期
    if (Date.now() - entry.timestamp > this.maxAge) {
      this.cache.delete(key)
      return null
    }

    // 更新访问时间
    entry.lastAccess = Date.now()
    return entry.value
  }

  /**
   * 设置缓存
   */
  set(key: string, value: any): void {
    // 检查缓存大小
    if (this.cache.size >= this.maxSize) {
      this.evictOldest()
    }

    this.cache.set(key, {
      value,
      timestamp: Date.now(),
      lastAccess: Date.now()
    })
  }

  /**
   * 删除缓存
   */
  delete(key: string): boolean {
    return this.cache.delete(key)
  }

  /**
   * 清空缓存
   */
  clear(): void {
    this.cache.clear()
  }

  /**
   * 获取缓存统计
   */
  getStats(): CacheStats {
    return {
      size: this.cache.size,
      maxSize: this.maxSize,
      hitRate: 0, // 需要实现命中率统计
      memoryUsage: this.estimateMemoryUsage()
    }
  }

  /**
   * 清理过期缓存
   */
  cleanup(): void {
    const now = Date.now()
    for (const [key, entry] of this.cache.entries()) {
      if (now - entry.timestamp > this.maxAge) {
        this.cache.delete(key)
      }
    }
  }

  /**
   * 驱逐最旧的缓存项
   */
  private evictOldest(): void {
    let oldestKey = ''
    let oldestTime = Date.now()

    for (const [key, entry] of this.cache.entries()) {
      if (entry.lastAccess < oldestTime) {
        oldestTime = entry.lastAccess
        oldestKey = key
      }
    }

    if (oldestKey) {
      this.cache.delete(oldestKey)
    }
  }

  /**
   * 估算内存使用量
   */
  private estimateMemoryUsage(): number {
    let size = 0
    for (const [key, entry] of this.cache.entries()) {
      size += key.length * 2 // 字符串大小
      size += JSON.stringify(entry.value).length * 2 // 值大小估算
      size += 64 // 对象开销
    }
    return size
  }
}

/**
 * 缓存条目接口
 */
export interface CacheEntry {
  value: any
  timestamp: number
  lastAccess: number
}

/**
 * 缓存统计接口
 */
export interface CacheStats {
  size: number
  maxSize: number
  hitRate: number
  memoryUsage: number
}

/**
 * 内存优化器
 */
export class MemoryOptimizer {
  private gcThreshold: number
  private lastGC: number = 0

  constructor(gcThreshold: number = 100 * 1024 * 1024) { // 100MB
    this.gcThreshold = gcThreshold
  }

  /**
   * 检查内存使用并触发 GC
   */
  checkMemory(): void {
    const usage = process.memoryUsage()
    
    if (usage.heapUsed > this.gcThreshold && Date.now() - this.lastGC > 5000) {
      this.forceGC()
    }
  }

  /**
   * 强制垃圾回收
   */
  forceGC(): void {
    if (global.gc) {
      const before = process.memoryUsage().heapUsed
      global.gc()
      const after = process.memoryUsage().heapUsed
      const freed = before - after
      
      logger.debug(`垃圾回收完成，释放内存: ${this.formatBytes(freed)}`)
      this.lastGC = Date.now()
    }
  }

  /**
   * 获取内存使用报告
   */
  getMemoryReport(): string {
    const usage = process.memoryUsage()
    
    return `内存使用报告:
- RSS: ${this.formatBytes(usage.rss)}
- Heap Total: ${this.formatBytes(usage.heapTotal)}
- Heap Used: ${this.formatBytes(usage.heapUsed)}
- External: ${this.formatBytes(usage.external)}
- Array Buffers: ${this.formatBytes(usage.arrayBuffers)}`
  }

  /**
   * 格式化字节数
   */
  private formatBytes(bytes: number): string {
    const units = ['B', 'KB', 'MB', 'GB']
    let size = bytes
    let unitIndex = 0

    while (size >= 1024 && unitIndex < units.length - 1) {
      size /= 1024
      unitIndex++
    }

    return `${size.toFixed(1)} ${units[unitIndex]}`
  }
}

/**
 * 性能优化工具集合
 */
export class PerformanceOptimizer {
  private monitor: PerformanceMonitor
  private cache: CacheManager
  private memoryOptimizer: MemoryOptimizer
  private concurrentCompiler: ConcurrentCompiler

  constructor() {
    this.monitor = new PerformanceMonitor()
    this.cache = new CacheManager()
    this.memoryOptimizer = new MemoryOptimizer()
    this.concurrentCompiler = new ConcurrentCompiler()
  }

  /**
   * 获取性能监控器
   */
  getMonitor(): PerformanceMonitor {
    return this.monitor
  }

  /**
   * 获取缓存管理器
   */
  getCache(): CacheManager {
    return this.cache
  }

  /**
   * 获取内存优化器
   */
  getMemoryOptimizer(): MemoryOptimizer {
    return this.memoryOptimizer
  }

  /**
   * 获取并发编译器
   */
  getConcurrentCompiler(): ConcurrentCompiler {
    return this.concurrentCompiler
  }

  /**
   * 生成完整的性能报告
   */
  generateReport(): string {
    const reports = [
      this.monitor.generateReport(),
      '',
      `缓存统计: ${JSON.stringify(this.cache.getStats(), null, 2)}`,
      '',
      this.memoryOptimizer.getMemoryReport()
    ]

    return reports.join('\n')
  }

  /**
   * 清理所有资源
   */
  async cleanup(): Promise<void> {
    this.monitor.clear()
    this.cache.clear()
    await this.concurrentCompiler.shutdown()
  }
}
