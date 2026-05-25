/**
 * 性能优化模块
 */

import { Worker } from 'worker_threads'
import { cpus } from 'os'
import { logger } from '@/utils/index.js'
import {
  formatBytes,
  shouldTriggerGC
} from './performance-utils.js'
import { CacheManager } from './performance-cache-manager.js'
import { PerformanceMonitor } from './performance-monitor.js'
export { CacheManager, type CacheEntry, type CacheStats } from './performance-cache-manager.js'
export { PerformanceMonitor, type PerformanceMetric } from './performance-monitor.js'

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
    
    if (shouldTriggerGC(usage.heapUsed, this.gcThreshold, Date.now(), this.lastGC)) {
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
      
      logger.debug(`垃圾回收完成，释放内存: ${formatBytes(freed)}`)
      this.lastGC = Date.now()
    }
  }

  /**
   * 获取内存使用报告
   */
  getMemoryReport(): string {
    const usage = process.memoryUsage()
    
    return `内存使用报告:
- RSS: ${formatBytes(usage.rss)}
- Heap Total: ${formatBytes(usage.heapTotal)}
- Heap Used: ${formatBytes(usage.heapUsed)}
- External: ${formatBytes(usage.external)}
- Array Buffers: ${formatBytes(usage.arrayBuffers)}`
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
