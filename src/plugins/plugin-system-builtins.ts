/**
 * 插件系统内置插件。
 */

import { logger } from '@/utils/index.js'
import {
  collectCodeQualityIssues,
  createCacheEntryHash,
  createCompileMetricsSummary,
  groupIssuesByType,
  isCacheExpired
} from './plugin-system-utils.js'
import type { TransformContext } from '@/types/index.js'
import type { Plugin } from './plugin-system.js'

/**
 * 内置插件：性能监控。
 */
export class PerformancePlugin implements Plugin {
  name = 'performance'
  version = '1.0.0'
  description = '性能监控插件'

  private startTimes: Map<string, number> = new Map()
  private metrics: Map<string, number[]> = new Map()

  /** 记录单文件编译开始时间。 */
  async beforeCompile(context: TransformContext): Promise<void> {
    this.startTimes.set(context.filename, Date.now())
  }

  /** 记录单文件编译耗时。 */
  async afterCompile(context: TransformContext, result: any): Promise<void> {
    const startTime = this.startTimes.get(context.filename)
    if (startTime) {
      const duration = Date.now() - startTime

      if (!this.metrics.has('compile-times')) {
        this.metrics.set('compile-times', [])
      }

      this.metrics.get('compile-times')!.push(duration)
      this.startTimes.delete(context.filename)

      if (duration > 1000) {
        logger.warn(`文件编译耗时较长: ${context.filename} (${duration}ms)`)
      }
    }
  }

  /** 获取编译耗时摘要。 */
  getMetrics(): Record<string, any> {
    const compileTimes = this.metrics.get('compile-times') || []

    return createCompileMetricsSummary(compileTimes)
  }

  /** 输出并清理性能统计。 */
  cleanup(): void {
    const metrics = this.getMetrics()
    logger.info('性能统计:', metrics)
    this.startTimes.clear()
    this.metrics.clear()
  }
}

/**
 * 内置插件：代码质量检查。
 */
export class CodeQualityPlugin implements Plugin {
  name = 'code-quality'
  version = '1.0.0'
  description = '代码质量检查插件'

  private issues: Array<{ file: string; type: string; message: string }> = []

  /** 检查并透传文件内容。 */
  async transformFile(filePath: string, content: string): Promise<string> {
    // 检查代码质量问题
    this.checkCodeQuality(filePath, content)
    return content
  }

  private checkCodeQuality(filePath: string, content: string): void {
    this.issues.push(...collectCodeQualityIssues(filePath, content))
  }

  /** 输出并清理质量检查问题。 */
  cleanup(): void {
    if (this.issues.length > 0) {
      logger.info(`代码质量检查完成，发现 ${this.issues.length} 个问题:`)

      const grouped = groupIssuesByType(this.issues)
      Object.entries(grouped).forEach(([type, issues]) => {
        logger.info(`${type}: ${issues.length} 个`)
        issues.slice(0, 5).forEach(issue => {
          logger.info(`  ${issue.file}: ${issue.message}`)
        })
        if (issues.length > 5) {
          logger.info(`  ... 还有 ${issues.length - 5} 个`)
        }
      })
    }

    this.issues = []
  }
}

/**
 * 内置插件：缓存管理。
 */
export class CachePlugin implements Plugin {
  name = 'cache'
  version = '1.0.0'
  description = '编译缓存插件'

  private cache: Map<string, { hash: string; result: any; timestamp: number }> = new Map()
  private maxAge = 24 * 60 * 60 * 1000 // 24小时

  /** 编译前检查缓存。 */
  async beforeCompile(context: TransformContext): Promise<void> {
    // 检查缓存
    const cached = this.getFromCache(context.filename)
    if (cached) {
      logger.debug(`使用缓存: ${context.filename}`)
      // 这里可以跳过编译，但需要编译器支持
    }
  }

  /** 编译后写入缓存。 */
  async afterCompile(context: TransformContext, result: any): Promise<void> {
    // 保存到缓存
    this.saveToCache(context.filename, result)
  }

  private getFromCache(filePath: string): any | null {
    const cached = this.cache.get(filePath)
    if (!cached) return null

    // 检查是否过期
    if (isCacheExpired(cached.timestamp, this.maxAge)) {
      this.cache.delete(filePath)
      return null
    }

    return cached.result
  }

  private saveToCache(filePath: string, result: any): void {
    this.cache.set(filePath, {
      hash: createCacheEntryHash(JSON.stringify(result)),
      result,
      timestamp: Date.now()
    })
  }

  /** 输出并清理缓存统计。 */
  cleanup(): void {
    logger.info(`缓存统计: ${this.cache.size} 个文件`)
    this.cache.clear()
  }
}

/**
 * 创建默认内置插件实例列表。
 */
export function createBuiltinPlugins(): Plugin[] {
  return [
    new PerformancePlugin(),
    new CodeQualityPlugin(),
    new CachePlugin()
  ]
}
