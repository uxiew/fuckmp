/**
 * 构建命令
 */

import { Command } from 'commander'
import { resolve } from 'node:path'
import { Vue3MiniprogramCompiler } from '@/compiler/index.js'
import type { CompilerOptions } from '@/types/index.js'
import { logger } from '@/utils/index.js'
import { formatTime } from './build-progress-utils.js'

export { BuildProgress, BuildStats } from './build-progress-utils.js'

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
    .option('--no-minify', '禁用代码压缩 (默认启用)')
    .option('--sourcemap', '启用 source map (默认禁用)')
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

    const validation = validateBuildOptions(options)
    if (!validation.valid) {
      logger.error('构建参数无效')
      validation.errors.forEach(error => logger.error(error))
      process.exit(1)
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

  // 优化选项 - build 模式默认启用压缩并禁用 sourcemap
  const currentOptimization = compilerOptions.optimization
  compilerOptions.optimization = {
    minify: options.minify !== false,  // 默认启用压缩，除非明确设置 --no-minify
    treeshaking: currentOptimization?.treeshaking ?? true,
    sourcemap: options.sourcemap === true,  // 默认禁用 sourcemap，除非明确设置 --sourcemap
    incremental: currentOptimization?.incremental ?? true
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
  if (options.input && options.output && resolve(options.input) === resolve(options.output)) {
    errors.push('输入目录和输出目录不能相同')
  }

  return {
    valid: errors.length === 0,
    errors
  }
}
