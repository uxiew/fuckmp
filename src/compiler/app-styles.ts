/**
 * 应用样式文件生成工具。
 */

import path from 'path'
import { logger, writeFile } from '@/utils/index.js'

/**
 * 生成小程序应用级样式文件。
 */
export async function generateAppStyles(outputDir: string): Promise<void> {
  try {
    logger.debug('生成应用样式文件')

    const appStyles = `/* Vue3 微信小程序编译器生成的应用样式文件 */
/* 如需添加全局样式，请在此文件中编写 */
`

    const appStylesPath = path.join(outputDir, 'app.wxss')
    await writeFile(appStylesPath, appStyles)

    logger.debug('应用样式文件生成完成')

  } catch (error) {
    logger.error('应用样式文件生成失败', error as Error)
    throw error
  }
}
