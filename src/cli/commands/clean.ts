/**
 * 清理命令。
 */

import { Command } from 'commander'
import { exists, logger, remove } from '@/utils/index.js'

/**
 * 清理命令选项。
 */
interface CleanCommandOptions {
  output: string
}

/**
 * 创建清理输出目录命令。
 *
 * @returns Commander clean 子命令。
 */
export function createCleanCommand(): Command {
  return new Command('clean')
    .description('清理输出目录')
    .option('-o, --output <dir>', '输出目录', 'dist')
    .action(async (options: CleanCommandOptions) => {
      await handleCleanCommand(options)
    })
}

/**
 * 处理清理命令。
 *
 * @param options 清理命令选项。
 */
async function handleCleanCommand(options: CleanCommandOptions): Promise<void> {
  try {
    logger.info(`清理输出目录: ${options.output}`)

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
