#!/usr/bin/env node

/**
 * FuckMP - Vue3 微信小程序编译器 CLI
 */

import { Command } from 'commander'
import { createBuildCommand } from './commands/build.js'
import { createCreateCommand } from './commands/create.js'
import { createDevCommand } from './commands/dev.js'
import { logger } from '@/utils/index.js'

/**
 * 主程序
 */
async function main(): Promise<void> {
  const program = new Command()

  // 设置程序信息
  program
    .name('fuckmp')
    .description('FuckMP - 强大的 Vue3 微信小程序编译器，支持完整的 Vue3 语法和 SCSS 导入')
    .version('1.0.0')

  // 添加全局选项
  program
    .option('--no-color', '禁用颜色输出')
    .option('--silent', '静默模式')
    .hook('preAction', (thisCommand) => {
      // 处理全局选项
      const options = thisCommand.opts()

      if (options.silent) {
        logger.setLevel('error')
      }
    })

  // 注册命令
  program.addCommand(createBuildCommand())
  program.addCommand(createCreateCommand())
  program.addCommand(createDevCommand())

  // 添加分析命令
  program
    .command('analyze')
    .description('分析项目结构和依赖')
    .option('-i, --input <dir>', '输入目录', 'src')
    .option('--output-format <format>', '输出格式 (json|text)', 'text')
    .action(async (options) => {
      await handleAnalyzeCommand(options)
    })

  // 添加清理命令
  program
    .command('clean')
    .description('清理输出目录')
    .option('-o, --output <dir>', '输出目录', 'dist')
    .action(async (options) => {
      await handleCleanCommand(options)
    })

  // 添加配置命令
  program
    .command('config')
    .description('管理编译器配置')
    .option('--init', '初始化配置文件')
    .option('--show', '显示当前配置')
    .option('--validate', '验证配置文件')
    .action(async (options) => {
      await handleConfigCommand(options)
    })

  // 错误处理
  program.exitOverride((err) => {
    if (err.code === 'commander.help') {
      process.exit(0)
    } else if (err.code === 'commander.version') {
      process.exit(0)
    } else {
      logger.error('命令执行失败', err)
      process.exit(1)
    }
  })

  // 解析命令行参数
  try {
    await program.parseAsync(process.argv)
  } catch (error) {
    logger.error('程序执行失败', error as Error)
    process.exit(1)
  }
}

/**
 * 处理分析命令
 */
async function handleAnalyzeCommand(options: { input: string; outputFormat: string }): Promise<void> {
  try {
    logger.info('分析项目结构...')

    const { scanVueFiles } = await import('@/utils/index.js')
    const vueFiles = await scanVueFiles(options.input)

    const analysis = {
      totalFiles: vueFiles.length,
      pages: vueFiles.filter(file => file.includes('/pages/')).length,
      components: vueFiles.filter(file => file.includes('/components/')).length,
      files: vueFiles
    }

    if (options.outputFormat === 'json') {
      console.log(JSON.stringify(analysis, null, 2))
    } else {
      logger.info('\n项目分析结果:')
      logger.info(`📁 总文件数: ${analysis.totalFiles}`)
      logger.info(`📄 页面数: ${analysis.pages}`)
      logger.info(`🧩 组件数: ${analysis.components}`)

      if (analysis.files.length > 0) {
        logger.info('\n文件列表:')
        analysis.files.forEach(file => {
          const type = file.includes('/pages/') ? '📄' : '🧩'
          logger.info(`  ${type} ${file}`)
        })
      }
    }

  } catch (error) {
    logger.error('项目分析失败', error as Error)
    process.exit(1)
  }
}

/**
 * 处理清理命令
 */
async function handleCleanCommand(options: { output: string }): Promise<void> {
  try {
    logger.info(`清理输出目录: ${options.output}`)

    const { remove, exists } = await import('@/utils/index.js')

    if (await exists(options.output)) {
      await remove(options.output)
      logger.success('输出目录清理完成')
    } else {
      logger.info('输出目录不存在，无需清理')
    }

  } catch (error) {
    logger.error('清理失败', error as Error)
    process.exit(1)
  }
}

/**
 * 处理配置命令
 */
async function handleConfigCommand(options: { init?: boolean; show?: boolean; validate?: boolean }): Promise<void> {
  try {
    const { ConfigManager } = await import('@/compiler/index.js')

    if (options.init) {
      // 初始化配置文件
      const configManager = new ConfigManager()
      await configManager.saveToFile('vue3mp.config.js')
      logger.success('配置文件已创建: vue3mp.config.js')
    } else if (options.show) {
      // 显示当前配置
      try {
        const configManager = await ConfigManager.fromFile('vue3mp.config.js')
        console.log(configManager.toJSON())
      } catch {
        logger.warn('未找到配置文件，显示默认配置:')
        const configManager = new ConfigManager()
        console.log(configManager.toJSON())
      }
    } else if (options.validate) {
      // 验证配置文件
      try {
        await ConfigManager.fromFile('vue3mp.config.js')
        logger.success('配置文件验证通过')
      } catch (error) {
        logger.error('配置文件验证失败', error as Error)
        process.exit(1)
      }
    } else {
      logger.info('请指定配置操作: --init, --show, 或 --validate')
    }

  } catch (error) {
    logger.error('配置操作失败', error as Error)
    process.exit(1)
  }
}

/**
 * 显示帮助信息
 */
function showHelp(): void {
  console.log(`
FuckMP - 强大的 Vue3 微信小程序编译器

特性:
  ✅ 完整的 Vue3 语法支持 (Composition API, script setup)
  ✅ TypeScript 支持
  ✅ SCSS/Sass 支持和导入功能
  ✅ 智能路径解析和组件引用
  ✅ 作用域样式 (scoped)

用法:
  fuckmp <command> [options]

命令:
  create <name>     创建新项目
  build             构建项目
  dev               开发模式 (监听文件变化)
  analyze           分析项目结构
  clean             清理输出目录
  config            管理配置

选项:
  -h, --help        显示帮助信息
  -V, --version     显示版本号
  --no-color        禁用颜色输出
  --silent          静默模式

示例:
  fuckmp create my-app
  fuckmp build --input src --output dist
  fuckmp dev --watch
  fuckmp analyze --output-format json

SCSS 导入示例:
  // JavaScript 中导入样式
  import './assets/css/global.scss'

  // Style 标签中导入样式
  <style lang="scss">
    @import './assets/css/mixins.scss';
  </style>
`)
}

/**
 * 处理未捕获的异常
 */
process.on('uncaughtException', (error) => {
  logger.error('未捕获的异常', error)
  process.exit(1)
})

process.on('unhandledRejection', (reason) => {
  logger.error('未处理的 Promise 拒绝', reason as Error)
  process.exit(1)
})

// 启动程序
main().catch((error) => {
  logger.error('程序启动失败', error)
  process.exit(1)
})
