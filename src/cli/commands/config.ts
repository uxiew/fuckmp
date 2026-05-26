/**
 * 配置命令。
 */

import { Command } from 'commander'
import { ConfigManager } from '@/compiler/index.js'
import { logger } from '@/utils/index.js'

/**
 * 配置命令选项。
 */
interface ConfigCommandOptions {
  init?: boolean
  show?: boolean
  validate?: boolean
}

const DEFAULT_CONFIG_FILE = 'vue3mp.config.js'

/**
 * 创建配置管理命令。
 *
 * @returns Commander config 子命令。
 */
export function createConfigCommand(): Command {
  return new Command('config')
    .description('管理编译器配置')
    .option('--init', '初始化配置文件')
    .option('--show', '显示当前配置')
    .option('--validate', '验证配置文件')
    .action(async (options: ConfigCommandOptions) => {
      await handleConfigCommand(options)
    })
}

/**
 * 处理配置命令。
 *
 * @param options 配置命令选项。
 */
async function handleConfigCommand(options: ConfigCommandOptions): Promise<void> {
  try {
    if (options.init) {
      const configManager = new ConfigManager()
      await configManager.saveToFile(DEFAULT_CONFIG_FILE)
      logger.success(`配置文件已创建: ${DEFAULT_CONFIG_FILE}`)
    } else if (options.show) {
      await showConfig()
    } else if (options.validate) {
      await validateConfig()
    } else {
      logger.info('请指定配置操作: --init, --show, 或 --validate')
    }
  } catch (error) {
    logger.error('配置操作失败', error as Error)
    process.exit(1)
  }
}

/**
 * 显示当前配置；配置文件缺失时回退默认配置。
 */
async function showConfig(): Promise<void> {
  try {
    const configManager = await ConfigManager.fromFile(DEFAULT_CONFIG_FILE)
    console.log(configManager.toJSON())
  } catch {
    logger.warn('未找到配置文件，显示默认配置:')
    const configManager = new ConfigManager()
    console.log(configManager.toJSON())
  }
}

/**
 * 验证默认配置文件。
 */
async function validateConfig(): Promise<void> {
  try {
    await ConfigManager.fromFile(DEFAULT_CONFIG_FILE)
    logger.success('配置文件验证通过')
  } catch (error) {
    logger.error('配置文件验证失败', error as Error)
    process.exit(1)
  }
}
