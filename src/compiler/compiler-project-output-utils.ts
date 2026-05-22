/**
 * 项目级编译输出刷新工具。
 */

import { generateAppStyles } from './app-styles.js'
import { buildCompiledFileList, buildPageRoutesFromFiles } from './compiler-output-utils.js'
import { buildRuntimeInjectionEntries, type CompiledRuntimeRecord } from './compiler-runtime-utils.js'
import { logger } from '@/utils/index.js'

/**
 * 生成项目级输出所需的最小配置生成器接口。
 */
export interface ProjectConfigGeneratorLike {
  generateAppConfig(pages: string[], outputDir: string): Promise<void>
  generateProjectConfig(outputDir: string): Promise<void>
  generateSitemapConfig(outputDir: string): Promise<void>
  generateTSConfig(outputDir: string): Promise<void>
}

/**
 * 执行运行时注入所需的最小接口。
 */
export interface RuntimeInjectorLike {
  injectRuntime(
    sourceFiles: Map<string, string>,
    outputDir: string,
    appConfig: any,
    pages: Map<string, CompiledRuntimeRecord>,
    components: Map<string, CompiledRuntimeRecord>
  ): Promise<void>
}

/**
 * 刷新依赖全局编译状态的 app/runtime/project/sitemap/tsconfig 输出。
 */
export async function refreshProjectOutputFiles(options: {
  inputRoot: string
  outputRoot: string
  sourceFiles: Map<string, string>
  appConfig: any
  compiledPages: Map<string, CompiledRuntimeRecord>
  compiledComponents: Map<string, CompiledRuntimeRecord>
  configGenerator: ProjectConfigGeneratorLike
  runtimeInjector: RuntimeInjectorLike
  typescript: boolean
}): Promise<void> {
  const compiledFiles = buildCompiledFileList(options.compiledPages, options.compiledComponents)

  await generateAppConfigFromCompiledFiles(
    options.configGenerator,
    compiledFiles,
    options.inputRoot,
    options.outputRoot
  )
  await generateAppStyles(options.outputRoot)
  await performRuntimeInjection(options)
  await options.configGenerator.generateProjectConfig(options.outputRoot)
  await options.configGenerator.generateSitemapConfig(options.outputRoot)

  if (options.typescript) {
    await options.configGenerator.generateTSConfig(options.outputRoot)
  }
}

/**
 * 从已编译文件生成 app.json 页面列表。
 */
async function generateAppConfigFromCompiledFiles(
  configGenerator: ProjectConfigGeneratorLike,
  compiledFiles: string[],
  inputRoot: string,
  outputRoot: string
): Promise<void> {
  logger.debug(`生成应用配置，成功文件: ${compiledFiles.length} 个`)

  const pages = buildPageRoutesFromFiles(compiledFiles, inputRoot)
  logger.debug(`页面文件: ${pages.length} 个`, pages)
  logger.debug(`最终页面路径:`, pages)

  await configGenerator.generateAppConfig(pages, outputRoot)
}

/**
 * 注入运行时。注入失败时保留既有策略：记录错误但不中断项目输出刷新。
 */
async function performRuntimeInjection(options: {
  inputRoot: string
  outputRoot: string
  sourceFiles: Map<string, string>
  appConfig: any
  compiledPages: Map<string, CompiledRuntimeRecord>
  compiledComponents: Map<string, CompiledRuntimeRecord>
  runtimeInjector: RuntimeInjectorLike
}): Promise<void> {
  try {
    logger.info('开始执行运行时注入...')

    const pages = buildRuntimeInjectionEntries(options.compiledPages, options.inputRoot)
    const components = buildRuntimeInjectionEntries(options.compiledComponents, options.inputRoot)

    await options.runtimeInjector.injectRuntime(
      options.sourceFiles,
      options.outputRoot,
      options.appConfig,
      pages,
      components
    )

    logger.success('运行时注入完成')
  } catch (error) {
    logger.error('运行时注入失败:', error as Error)
  }
}
