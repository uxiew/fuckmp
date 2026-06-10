#!/usr/bin/env node

/**
 * FuckMP - Vue3 微信小程序编译器 CLI
 */

import { Command } from 'commander'
import { createAnalyzeCommand } from './commands/analyze.js'
import { createBuildCommand } from './commands/build.js'
import { createCleanCommand } from './commands/clean.js'
import { createConfigCommand } from './commands/config.js'
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
  program.addCommand(createConfigCommand())
  program.addCommand(createCleanCommand())
  program.addCommand(createAnalyzeCommand())

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
