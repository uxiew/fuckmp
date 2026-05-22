/**
 * 创建项目命令
 */

import { Command } from 'commander'
import { logger, writeFile, ensureDir, joinPath } from '@/utils/index.js'
import { getProjectTemplate, type ProjectTemplate } from './create-templates.js'

/**
 * 创建命令选项
 */
interface CreateOptions {
  template?: string
  typescript?: boolean
  scss?: boolean
  force?: boolean
}

/**
 * 创建创建命令
 */
export function createCreateCommand(): Command {
  const command = new Command('create')
    .description('创建新的 Vue3 小程序项目')
    .argument('<project-name>', '项目名称')
    .option('-t, --template <name>', '项目模板', 'basic')
    .option('--typescript', '使用 TypeScript')
    .option('--scss', '使用 SCSS')
    .option('-f, --force', '强制覆盖已存在的目录')
    .action(async (projectName: string, options: CreateOptions) => {
      await handleCreateCommand(projectName, options)
    })

  return command
}

/**
 * 处理创建命令
 */
async function handleCreateCommand(projectName: string, options: CreateOptions): Promise<void> {
  try {
    logger.info(`创建项目: ${projectName}`)

    // 验证项目名称
    if (!isValidProjectName(projectName)) {
      throw new Error('项目名称只能包含字母、数字、连字符和下划线')
    }

    // 检查目录是否存在
    const projectDir = joinPath(process.cwd(), projectName)
    const { exists } = await import('@/utils/index.js')
    
    if (await exists(projectDir) && !options.force) {
      throw new Error(`目录 ${projectName} 已存在，使用 --force 强制覆盖`)
    }

    // 获取项目模板
    const template = getProjectTemplate(options.template || 'basic', {
      typescript: options.typescript || false,
      scss: options.scss || false
    })

    // 创建项目
    await createProject(projectDir, projectName, template)

    logger.success(`项目 ${projectName} 创建成功!`)
    logger.info('\n下一步:')
    logger.info(`  cd ${projectName}`)
    logger.info('  pnpm install')
    logger.info('  pnpm dev')

  } catch (error) {
    logger.error('项目创建失败', error as Error)
    process.exit(1)
  }
}

/**
 * 验证项目名称
 */
function isValidProjectName(name: string): boolean {
  return /^[a-zA-Z0-9_-]+$/.test(name)
}

/**
 * 创建项目。
 */
async function createProject(projectDir: string, projectName: string, template: ProjectTemplate): Promise<void> {
  await ensureDir(projectDir)

  logger.info(`使用模板: ${template.description}`)
  logger.info(`特性: ${template.features.join(', ')}`)

  for (const [filePath, content] of Object.entries(template.files)) {
    if (content) {
      const fullPath = joinPath(projectDir, filePath)
      await writeFile(fullPath, content.replace(/{{PROJECT_NAME}}/g, projectName))
      logger.debug(`创建文件: ${filePath}`)
    }
  }
}
