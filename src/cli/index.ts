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
