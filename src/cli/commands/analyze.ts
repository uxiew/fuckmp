/**
 * 项目分析命令。
 */

import { Command } from 'commander'
import { logger, scanVueFiles } from '@/utils/index.js'

/**
 * 项目分析命令选项。
 */
interface AnalyzeCommandOptions {
  input: string
  outputFormat: string
}

/**
 * 项目分析结果。
 */
interface ProjectAnalysis {
  totalFiles: number
  pages: number
  components: number
  files: string[]
}

/**
 * 创建项目结构分析命令。
 *
 * @returns Commander analyze 子命令。
 */
export function createAnalyzeCommand(): Command {
  return new Command('analyze')
    .description('分析项目结构和依赖')
    .option('-i, --input <dir>', '输入目录', 'src')
    .option('--output-format <format>', '输出格式 (json|text)', 'text')
    .action(async (options: AnalyzeCommandOptions) => {
      await handleAnalyzeCommand(options)
    })
}

/**
 * 处理项目结构分析命令。
 *
 * @param options 项目分析命令选项。
 */
async function handleAnalyzeCommand(options: AnalyzeCommandOptions): Promise<void> {
  try {
    logger.info('分析项目结构...')

    const vueFiles = await scanVueFiles(options.input)
    const analysis = createProjectAnalysis(vueFiles)

    if (options.outputFormat === 'json') {
      console.log(JSON.stringify(analysis, null, 2))
    } else {
      logTextAnalysis(analysis)
    }
  } catch (error) {
    logger.error('项目分析失败', error as Error)
    process.exit(1)
  }
}

/**
 * 根据 Vue 文件列表生成项目分析摘要。
 *
 * @param vueFiles 扫描得到的 Vue 文件路径列表。
 * @returns 项目分析摘要。
 */
function createProjectAnalysis(vueFiles: string[]): ProjectAnalysis {
  return {
    totalFiles: vueFiles.length,
    pages: vueFiles.filter(file => file.includes('/pages/')).length,
    components: vueFiles.filter(file => file.includes('/components/')).length,
    files: vueFiles
  }
}

/**
 * 输出文本格式项目分析结果。
 *
 * @param analysis 项目分析摘要。
 */
function logTextAnalysis(analysis: ProjectAnalysis): void {
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
