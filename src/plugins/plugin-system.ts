/**
 * 插件系统
 */

import type { CompilerOptions, TransformContext } from '@/types/index.js'
import { logger } from '@/utils/index.js'

/**
 * 插件接口
 */
export interface Plugin {
  /** 插件名称 */
  name: string
  /** 插件版本 */
  version?: string
  /** 插件描述 */
  description?: string
  /** 插件初始化 */
  setup?: (options: CompilerOptions) => void | Promise<void>
  /** 插件清理 */
  cleanup?: () => void | Promise<void>
  /** 编译前钩子 */
  beforeCompile?: (context: TransformContext) => void | Promise<void>
  /** 编译后钩子 */
  afterCompile?: (context: TransformContext, result: any) => void | Promise<void>
  /** 文件处理钩子 */
  transformFile?: (filePath: string, content: string) => string | Promise<string>
  /** 错误处理钩子 */
  onError?: (error: Error, context: TransformContext) => void | Promise<void>
}

/**
 * 插件管理器
 */
export class PluginManager {
  private plugins: Map<string, Plugin> = new Map()
  private hooks: Map<string, Function[]> = new Map()

  /**
   * 注册插件
   */
  register(plugin: Plugin): void {
    if (this.plugins.has(plugin.name)) {
      throw new Error(`插件 ${plugin.name} 已经注册`)
    }

    this.plugins.set(plugin.name, plugin)
    logger.debug(`插件已注册: ${plugin.name}`)

    // 注册钩子
    this.registerHooks(plugin)
  }

  /**
   * 注销插件
   */
  unregister(name: string): void {
    const plugin = this.plugins.get(name)
    if (!plugin) {
      throw new Error(`插件 ${name} 未找到`)
    }

    // 清理插件
    if (plugin.cleanup) {
      plugin.cleanup()
    }

    this.plugins.delete(name)
    this.unregisterHooks(plugin)
    logger.debug(`插件已注销: ${name}`)
  }

  /**
   * 获取插件
   */
  get(name: string): Plugin | undefined {
    return this.plugins.get(name)
  }

  /**
   * 获取所有插件
   */
  getAll(): Plugin[] {
    return Array.from(this.plugins.values())
  }

  /**
   * 初始化所有插件
   */
  async setup(options: CompilerOptions): Promise<void> {
    for (const plugin of this.plugins.values()) {
      if (plugin.setup) {
        try {
          await plugin.setup(options)
          logger.debug(`插件初始化完成: ${plugin.name}`)
        } catch (error) {
          logger.error(`插件初始化失败: ${plugin.name}`, error as Error)
        }
      }
    }
  }

  /**
   * 清理所有插件
   */
  async cleanup(): Promise<void> {
    for (const plugin of this.plugins.values()) {
      if (plugin.cleanup) {
        try {
          await plugin.cleanup()
          logger.debug(`插件清理完成: ${plugin.name}`)
        } catch (error) {
          logger.error(`插件清理失败: ${plugin.name}`, error as Error)
        }
      }
    }
  }

  /**
   * 执行钩子
   */
  async executeHook(hookName: string, ...args: any[]): Promise<any[]> {
    const hooks = this.hooks.get(hookName) || []
    const results: any[] = []

    for (const hook of hooks) {
      try {
        const result = await hook(...args)
        results.push(result)
      } catch (error) {
        logger.error(`钩子执行失败: ${hookName}`, error as Error)
      }
    }

    return results
  }

  /**
   * 注册钩子
   */
  private registerHooks(plugin: Plugin): void {
    const hookMethods = [
      'beforeCompile',
      'afterCompile',
      'transformFile',
      'onError'
    ] as const

    hookMethods.forEach(method => {
      if (plugin[method]) {
        if (!this.hooks.has(method)) {
          this.hooks.set(method, [])
        }
        this.hooks.get(method)!.push(plugin[method]!.bind(plugin))
      }
    })
  }

  /**
   * 注销钩子
   */
  private unregisterHooks(plugin: Plugin): void {
    this.hooks.forEach((hooks, hookName) => {
      this.hooks.set(hookName, hooks.filter(hook => 
        !hook.toString().includes(plugin.name)
      ))
    })
  }
}

/**
 * 内置插件：性能监控
 */
export class PerformancePlugin implements Plugin {
  name = 'performance'
  version = '1.0.0'
  description = '性能监控插件'

  private startTimes: Map<string, number> = new Map()
  private metrics: Map<string, number[]> = new Map()

  async beforeCompile(context: TransformContext): Promise<void> {
    this.startTimes.set(context.filename, Date.now())
  }

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

  getMetrics(): Record<string, any> {
    const compileTimes = this.metrics.get('compile-times') || []
    
    return {
      totalFiles: compileTimes.length,
      averageTime: compileTimes.length > 0 
        ? compileTimes.reduce((a, b) => a + b, 0) / compileTimes.length 
        : 0,
      maxTime: compileTimes.length > 0 ? Math.max(...compileTimes) : 0,
      minTime: compileTimes.length > 0 ? Math.min(...compileTimes) : 0
    }
  }

  cleanup(): void {
    const metrics = this.getMetrics()
    logger.info('性能统计:', metrics)
    this.startTimes.clear()
    this.metrics.clear()
  }
}

/**
 * 内置插件：代码质量检查
 */
export class CodeQualityPlugin implements Plugin {
  name = 'code-quality'
  version = '1.0.0'
  description = '代码质量检查插件'

  private issues: Array<{ file: string; type: string; message: string }> = []

  async transformFile(filePath: string, content: string): Promise<string> {
    // 检查代码质量问题
    this.checkCodeQuality(filePath, content)
    return content
  }

  private checkCodeQuality(filePath: string, content: string): void {
    // 检查文件大小
    if (content.length > 10000) {
      this.issues.push({
        file: filePath,
        type: 'warning',
        message: '文件过大，建议拆分'
      })
    }

    // 检查 TODO 注释
    const todoMatches = content.match(/\/\/\s*TODO/gi)
    if (todoMatches && todoMatches.length > 5) {
      this.issues.push({
        file: filePath,
        type: 'info',
        message: `发现 ${todoMatches.length} 个 TODO 注释`
      })
    }

    // 检查 console.log
    const consoleMatches = content.match(/console\.log/g)
    if (consoleMatches && consoleMatches.length > 0) {
      this.issues.push({
        file: filePath,
        type: 'warning',
        message: `发现 ${consoleMatches.length} 个 console.log，建议移除`
      })
    }

    // 检查长行
    const lines = content.split('\n')
    lines.forEach((line, index) => {
      if (line.length > 120) {
        this.issues.push({
          file: filePath,
          type: 'warning',
          message: `第 ${index + 1} 行过长 (${line.length} 字符)`
        })
      }
    })
  }

  cleanup(): void {
    if (this.issues.length > 0) {
      logger.info(`代码质量检查完成，发现 ${this.issues.length} 个问题:`)
      
      const grouped = this.groupIssuesByType()
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

  private groupIssuesByType(): Record<string, typeof this.issues> {
    return this.issues.reduce((groups, issue) => {
      if (!groups[issue.type]) {
        groups[issue.type] = []
      }
      groups[issue.type].push(issue)
      return groups
    }, {} as Record<string, typeof this.issues>)
  }
}

/**
 * 内置插件：缓存管理
 */
export class CachePlugin implements Plugin {
  name = 'cache'
  version = '1.0.0'
  description = '编译缓存插件'

  private cache: Map<string, { hash: string; result: any; timestamp: number }> = new Map()
  private maxAge = 24 * 60 * 60 * 1000 // 24小时

  async beforeCompile(context: TransformContext): Promise<void> {
    // 检查缓存
    const cached = this.getFromCache(context.filename)
    if (cached) {
      logger.debug(`使用缓存: ${context.filename}`)
      // 这里可以跳过编译，但需要编译器支持
    }
  }

  async afterCompile(context: TransformContext, result: any): Promise<void> {
    // 保存到缓存
    this.saveToCache(context.filename, result)
  }

  private getFromCache(filePath: string): any | null {
    const cached = this.cache.get(filePath)
    if (!cached) return null

    // 检查是否过期
    if (Date.now() - cached.timestamp > this.maxAge) {
      this.cache.delete(filePath)
      return null
    }

    return cached.result
  }

  private saveToCache(filePath: string, result: any): void {
    this.cache.set(filePath, {
      hash: this.generateHash(JSON.stringify(result)),
      result,
      timestamp: Date.now()
    })
  }

  private generateHash(content: string): string {
    let hash = 0
    for (let i = 0; i < content.length; i++) {
      const char = content.charCodeAt(i)
      hash = ((hash << 5) - hash) + char
      hash = hash & hash
    }
    return Math.abs(hash).toString(36)
  }

  cleanup(): void {
    logger.info(`缓存统计: ${this.cache.size} 个文件`)
    this.cache.clear()
  }
}

/**
 * 创建默认插件管理器
 */
export function createDefaultPluginManager(): PluginManager {
  const manager = new PluginManager()
  
  // 注册内置插件
  manager.register(new PerformancePlugin())
  manager.register(new CodeQualityPlugin())
  manager.register(new CachePlugin())
  
  return manager
}

/**
 * 插件工厂函数
 */
export function createPlugin(config: Partial<Plugin> & { name: string }): Plugin {
  return {
    version: '1.0.0',
    description: '',
    ...config
  }
}
