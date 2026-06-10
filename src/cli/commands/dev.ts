/**
 * 开发命令。
 */

import { Command } from 'commander'
import { createBuildCommand } from './build.js'

/**
 * 获取 dev 命令收到的用户原始参数。
 */
type DevArgvProvider = (command: Command) => string[]

/**
 * 创建开发命令。
 *
 * dev 是 build --watch 的别名，只转发用户显式输入的参数，避免 dev 命令自身默认值覆盖
 * build --config 中的配置值。
 */
export function createDevCommand(argvProvider: DevArgvProvider = getDevUserArgs): Command {
  return new Command('dev')
    .description('开发模式 (build --watch 的别名)')
    .option('-i, --input <dir>', '输入目录')
    .option('-o, --output <dir>', '输出目录')
    .option('--app-id <id>', '小程序 AppID')
    .option('-c, --config <file>', '配置文件路径')
    .option('--minify', '启用代码压缩')
    .option('--no-minify', '禁用代码压缩')
    .option('--sourcemap', '启用 source map')
    .option('--no-sourcemap', '禁用 source map')
    .option('--clean', '构建前清理输出目录')
    .option('-w, --watch', '监听模式 (dev 默认启用)')
    .option('-v, --verbose', '详细输出')
    .action(async (_options, command) => {
      const buildCommand = createBuildCommand()
      await buildCommand.parseAsync(buildDevForwardArgs(argvProvider(command)), { from: 'user' })
    })
}

/**
 * 构造 dev 转发给 build 命令的参数。
 *
 * @param userArgs dev 命令收到的用户原始参数，不包含 node、bin 和 dev。
 * @returns 可传给 build 命令的参数，固定包含 watch。
 */
export function buildDevForwardArgs(userArgs: readonly string[]): string[] {
  return ['--watch', ...userArgs.filter(arg => arg !== '--watch' && arg !== '-w')]
}

/**
 * 从 Commander 上下文提取 dev 后面的用户参数。
 *
 * @param command 当前 dev 子命令实例。
 * @returns 不包含 node、bin 与 dev 自身的用户参数。
 */
function getDevUserArgs(command: Command): string[] {
  const parentArgs = command.parent?.args
  if (parentArgs?.length) {
    return stripDevCommandName(parentArgs)
  }

  const rawArgs = (command as Command & { rawArgs?: string[] }).rawArgs
  return stripDevCommandName(rawArgs ?? process.argv.slice(2))
}

/**
 * 移除参数列表中的 dev 命令名及其之前的内容。
 */
function stripDevCommandName(args: readonly string[]): string[] {
  const commandIndex = args.indexOf('dev')
  return commandIndex >= 0 ? args.slice(commandIndex + 1) : [...args]
}
