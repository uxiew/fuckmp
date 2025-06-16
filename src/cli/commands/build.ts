/**
 * 构建命令
 */

import { Command } from 'commander'
import { Vue3MiniprogramCompiler } from '@/compiler/index.js'
import type { CompilerOptions } from '@/types/index.js'
import { logger } from '@/utils/index.js'

/**
 * 构建命令选项
 */
interface BuildOptions {
  input?: string
  output?: string
  appId?: string
  config?: string
  minify?: boolean
  sourcemap?: boolean
  clean?: boolean
  watch?: boolean
  verbose?: boolean
}

/**
 * 创建构建命令
 */
export function createBuildCommand(): Command {
  const command = new Command('build')
    .description('构建 Vue3 项目为微信小程序')
    .option('-i, --input <dir>', '输入目录', 'src')
    .option('-o, --output <dir>', '输出目录', 'dist')
    .option('--app-id <id>', '小程序 AppID')
    .option('-c, --config <file>', '配置文件路径')
    .option('--minify', '压缩代码')
    .option('--no-sourcemap', '禁用 source map')
    .option('--clean', '构建前清理输出目录')
    .option('-w, --watch', '监听模式')
    .option('-v, --verbose', '详细输出')
    .action(async (options: BuildOptions) => {
      await handleBuildCommand(options)
    })

  return command
}

/**
 * 处理构建命令
 */
async function handleBuildCommand(options: BuildOptions): Promise<void> {
  try {
    // 设置日志级别
    if (options.verbose) {
      logger.setLevel('debug')
    }

    logger.info('开始构建项目...')

    // 构建编译器选项
    const compilerOptions = await buildCompilerOptions(options)

    // 创建编译器实例
    const compiler = new Vue3MiniprogramCompiler(compilerOptions)

    // 清理输出目录
    if (options.clean) {
      await compiler.clean()
    }

    // 执行构建
    if (options.watch) {
      await compiler.watch()
    } else {
      const result = await compiler.compile()
      
      // 输出构建结果
      printBuildResult(result)
      
      // 如果有错误，退出进程
      if (result.errors.length > 0) {
        process.exit(1)
      }
    }

  } catch (error) {
    logger.error('构建失败', error as Error)
    process.exit(1)
  }
}

/**
 * 构建编译器选项
 */
async function buildCompilerOptions(options: BuildOptions): Promise<Partial<CompilerOptions>> {
  let compilerOptions: Partial<CompilerOptions> = {}

  // 从配置文件加载选项
  if (options.config) {
    try {
      const { ConfigManager } = await import('@/compiler/index.js')
      const configManager = await ConfigManager.fromFile(options.config)
      compilerOptions = configManager.getOptions()
      logger.info(`已加载配置文件: ${options.config}`)
    } catch (error) {
      logger.warn(`配置文件加载失败: ${options.config}`, error as Error)
    }
  }

  // 命令行选项覆盖配置文件
  if (options.input) {
    compilerOptions.input = options.input
  }

  if (options.output) {
    compilerOptions.output = options.output
  }

  if (options.appId) {
    compilerOptions.appId = options.appId
  }

  // 优化选项
  if (options.minify !== undefined) {
    compilerOptions.optimization = {
      ...compilerOptions.optimization,
      minify: options.minify
    }
  }

  if (options.sourcemap !== undefined) {
    compilerOptions.optimization = {
      ...compilerOptions.optimization,
      sourcemap: options.sourcemap
    }
  }

  return compilerOptions
}

/**
 * 打印构建结果
 */
function printBuildResult(result: any): void {
  const { stats } = result

  logger.info('\n构建完成!')
  logger.info(`✅ 成功: ${stats.success} 个文件`)
  
  if (stats.failed > 0) {
    logger.warn(`❌ 失败: ${stats.failed} 个文件`)
  }
  
  logger.info(`⏱️  耗时: ${formatTime(stats.duration)}`)

  // 输出错误详情
  if (result.errors.length > 0) {
    logger.error('\n编译错误:')
    result.errors.forEach((error: any, index: number) => {
      logger.error(`${index + 1}. ${error.file}`)
      logger.error(`   ${error.message}`)
    })
  }

  // 输出成功文件列表（在详细模式下）
  if (logger.getLevel() === 'debug' && result.success.length > 0) {
    logger.debug('\n成功编译的文件:')
    result.success.forEach((file: string) => {
      logger.debug(`✓ ${file}`)
    })
  }
}

/**
 * 格式化时间
 */
function formatTime(ms: number): string {
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
 * 验证构建选项
 */
function validateBuildOptions(options: BuildOptions): { valid: boolean; errors: string[] } {
  const errors: string[] = []

  // 验证必需的选项
  if (!options.input) {
    errors.push('输入目录不能为空')
  }

  if (!options.output) {
    errors.push('输出目录不能为空')
  }

  // 验证路径格式
  if (options.input && options.input === options.output) {
    errors.push('输入目录和输出目录不能相同')
  }

  return {
    valid: errors.length === 0,
    errors
  }
}

/**
 * 显示构建进度
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
 * 构建统计信息
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

/**
 * 格式化文件大小
 */
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
