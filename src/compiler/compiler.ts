/**
 * 主编译器类
 */

import { SFCParser, ScriptParser, TemplateParser, StyleParser } from '@/parser/index.js'
import { ScriptTransformer, TemplateTransformer, StyleTransformer } from '@/transformer/index.js'
import { ComponentGenerator, PageGenerator, ConfigGenerator } from '@/generator/index.js'
import { ConfigManager } from './options.js'
import { createInitialTransformContext } from './transform-context.js'
import { collectCompiledRuntimeRecord } from './compiler-runtime-utils.js'
import {
  removeGeneratedOutputFiles,
  writeGeneratedOutputFiles
} from './compiler-output-utils.js'
import {
  compileFilesWithResult,
  createCompileError,
  createCompileResult,
  createMissingInputMessage,
  createMissingInputResult
} from './compiler-result-utils.js'
import { parseAndTransformSfcSections } from './compiler-transform-pipeline.js'
import { refreshProjectOutputFiles, RuntimeInjectionError } from './compiler-project-output-utils.js'
import { removeFileFromCompilationState, resetCompilationState } from './compiler-state-utils.js'
import { generateTargetCode } from './compiler-generate-utils.js'
import {
  createCompilerWatchHandlers,
  createVueFileWatchOptions,
  createVueFileWatchPattern
} from './compiler-watch-utils.js'
import { PluginManager, createDefaultPluginManager } from '@/plugins/index.js'
import { UserConfigManager } from '@/config/user-config.js'
import { RuntimeInjector } from './runtime-injector'
import type { CompilerOptions, CompileResult, ParseResult, TransformContext } from '@/types/index.js'
import { logger, scanVueFiles, isAppComponent, ensureDir, PathResolver, createPathResolver, readFile, isDirectory } from '@/utils/index.js'

/**
 * 主编译器类
 */
export class Vue3MiniprogramCompiler {
  private configManager: ConfigManager
  private pluginManager: PluginManager
  private userConfigManager: UserConfigManager
  private runtimeInjector: RuntimeInjector
  private sfcParser: SFCParser
  private scriptParser: ScriptParser
  private templateParser: TemplateParser
  private styleParser: StyleParser
  private scriptTransformer: ScriptTransformer
  private templateTransformer: TemplateTransformer
  private styleTransformer: StyleTransformer
  private componentGenerator: ComponentGenerator
  private pageGenerator: PageGenerator
  private configGenerator: ConfigGenerator
  private pathResolver: PathResolver

  // 编译过程中收集的数据
  private sourceFiles: Map<string, string> = new Map()
  private compiledPages: Map<string, any> = new Map()
  private compiledComponents: Map<string, any> = new Map()
  private appConfig: any = {}

  constructor(options: Partial<CompilerOptions> = {}) {
    this.configManager = new ConfigManager(options)
    this.pluginManager = createDefaultPluginManager()

    // 初始化路径解析器
    const projectRoot = this.configManager.getOptions().input
    this.pathResolver = createPathResolver(projectRoot)

    // 初始化用户配置管理器
    this.userConfigManager = new UserConfigManager()
    this.userConfigManager.loadConfig(process.cwd()) // 从当前工作目录加载配置

    // 初始化运行时注入器
    this.runtimeInjector = new RuntimeInjector(this.configManager.getOptions())

    // 初始化解析器
    this.sfcParser = new SFCParser(this.configManager.getOptions())
    this.scriptParser = new ScriptParser()
    this.templateParser = new TemplateParser()
    this.styleParser = new StyleParser()

    // 初始化转换器
    this.scriptTransformer = new ScriptTransformer()
    this.scriptTransformer.setPathResolver(projectRoot)
    this.templateTransformer = new TemplateTransformer()
    this.styleTransformer = new StyleTransformer()

    // 初始化生成器
    const injectionOptions = this.configManager.getInjection()
    this.componentGenerator = new ComponentGenerator(injectionOptions)
    this.pageGenerator = new PageGenerator(injectionOptions)
    this.configGenerator = new ConfigGenerator(this.configManager.getOptions())
  }

  /**
   * 编译单个文件
   */
  async compileFile(filePath: string): Promise<void> {
    try {
      logger.info(`编译文件: ${filePath}`)

      // 读取文件内容
      const content = await readFile(filePath)

      // 收集源文件内容用于运行时分析
      this.sourceFiles.set(filePath, content)

      // 解析 SFC
      const parseResult = await this.sfcParser.parseSFC(content, filePath)

      // 验证 SFC
      const validation = this.sfcParser.validateSFC(parseResult)
      if (!validation.valid) {
        throw new Error(`SFC 验证失败: ${validation.errors.join(', ')}`)
      }

      // 检查是否使用了 scoped 样式
      const hasScoped = parseResult.styles.some(style => style.scoped)

      // 创建转换上下文
      const context = createInitialTransformContext(filePath, hasScoped)

      // 解析和转换各个部分
      const results = await this.parseAndTransform(parseResult, context)

      // 生成代码
      const isApp = isAppComponent(filePath)
      const generateResult = isApp ? { json: {} } : await this.generateCode(results, context)

      this.appConfig = collectCompiledRuntimeRecord({
        filePath,
        context,
        generateResult,
        template: results.template,
        ...(isApp && {
          appStyles: results.styles.map(style => style?.wxss).filter(Boolean).join('\n\n')
        }),
        currentAppConfig: this.appConfig,
        compiledPages: this.compiledPages,
        compiledComponents: this.compiledComponents
      })

      // 写入文件（应用入口文件由运行时注入器处理）
      if (!isApp) {
        const options = this.configManager.getOptions()
        await writeGeneratedOutputFiles({
          inputPath: filePath,
          inputRoot: options.input,
          outputRoot: options.output,
          generateResult,
          userConfig: this.userConfigManager.getConfig(),
          pathResolver: this.pathResolver
        })
      }

      logger.success(`文件编译完成: ${filePath}`)

    } catch (error) {
      logger.error(`文件编译失败: ${filePath}`, error as Error)
      throw error
    }
  }

  /**
   * 编译整个项目
   */
  async compile(): Promise<CompileResult> {
    const startTime = Date.now()
    const options = this.configManager.getOptions()

    logger.info('开始编译项目')
    logger.info(this.configManager.getSummary())

    const result = createCompileResult()

    try {
      if (!(await isDirectory(options.input))) {
        const message = createMissingInputMessage(options.input)
        logger.error(message)
        return createMissingInputResult(options.input, Date.now() - startTime)
      }

      this.resetCompilationState()

      // 扫描 Vue 文件
      const vueFiles = await scanVueFiles(options.input)

      logger.info(`发现 ${vueFiles.length} 个 Vue 文件`)

      // 确保输出目录存在
      await ensureDir(options.output)

      // 编译每个文件
      await compileFilesWithResult(vueFiles, result, filePath => this.compileFile(filePath))

      try {
        await this.refreshProjectOutputs()
      } catch (error) {
        if (!(error instanceof RuntimeInjectionError)) throw error
        result.errors.push(createCompileError(options.output, error))
        result.stats.duration = Date.now() - startTime
        logger.error('项目输出生成失败', error)
        return result
      }

      result.stats.duration = Date.now() - startTime

      logger.success(`项目编译完成! 成功: ${result.stats.success}, 失败: ${result.stats.failed}, 耗时: ${result.stats.duration}ms`)

      return result

    } catch (error) {
      logger.error('项目编译失败', error as Error)
      throw error
    }
  }

  /** 刷新依赖全局编译状态的项目级输出文件。 */
  async refreshProjectOutputs(): Promise<void> {
    const options = this.configManager.getOptions()

    await refreshProjectOutputFiles({
      inputRoot: options.input,
      outputRoot: options.output,
      sourceFiles: this.sourceFiles,
      appConfig: this.appConfig,
      compiledPages: this.compiledPages,
      compiledComponents: this.compiledComponents,
      configGenerator: this.configGenerator,
      runtimeInjector: this.runtimeInjector,
      typescript: this.configManager.getFeature('typescript')
    })
  }

  /** 从增量编译状态中移除源文件并清理对应输出。 */
  async removeSourceFile(filePath: string): Promise<string[]> {
    const options = this.configManager.getOptions()
    const appFile = isAppComponent(filePath)

    const removal = removeFileFromCompilationState(
      this.sourceFiles, this.compiledPages, this.compiledComponents, this.appConfig, filePath, appFile
    )
    this.appConfig = removal.appConfig

    const removedFiles = removal.shouldRemoveGeneratedOutputs
      ? await removeGeneratedOutputFiles(filePath, options.input, options.output)
      : []

    await this.refreshProjectOutputs()

    return removedFiles
  }

  /**
   * 解析和转换
   */
  private async parseAndTransform(parseResult: ParseResult, context: TransformContext) {
    return parseAndTransformSfcSections(
      parseResult,
      context,
      {
        scriptParser: this.scriptParser,
        scriptTransformer: this.scriptTransformer,
        templateParser: this.templateParser,
        templateTransformer: this.templateTransformer,
        styleParser: this.styleParser,
        styleTransformer: this.styleTransformer
      },
      {
        minify: this.configManager.getOptimization('minify'),
        sourcemap: this.configManager.getOptimization('sourcemap')
      }
    )
  }

  /**
   * 生成代码
   */
  private async generateCode(results: any, context: TransformContext) {
    return await generateTargetCode(results, context, {
      pageGenerator: this.pageGenerator,
      componentGenerator: this.componentGenerator
    })
  }

  /**
   * 监听模式编译
   */
  async watch(): Promise<void> {
    const options = this.configManager.getOptions()

    logger.info('启动监听模式')

    const chokidar = await import('chokidar')
    const watcher = chokidar.watch(
      createVueFileWatchPattern(options.input),
      createVueFileWatchOptions()
    )
    const handlers = createCompilerWatchHandlers(this)

    watcher.on('change', handlers.change)
    watcher.on('add', handlers.add)
    watcher.on('unlink', handlers.unlink)

    logger.info('监听模式已启动，等待文件变更...')
  }

  /**
   * 获取编译器版本
   */
  getVersion(): string {
    return '1.0.0'
  }

  /**
   * 获取配置管理器
   */
  getConfigManager(): ConfigManager {
    return this.configManager
  }

  /**
   * 更新配置
   */
  updateConfig(updates: Partial<CompilerOptions>): void {
    this.configManager.updateOptions(updates)
  }

  /**
   * 清理输出目录
   */
  async clean(): Promise<void> {
    const options = this.configManager.getOptions()
    const { remove } = await import('@/utils/index.js')

    logger.info(`清理输出目录: ${options.output}`)
    await remove(options.output)
    logger.success('输出目录清理完成')
  }

  /** 重置当前编译器持有的项目级状态。 */
  private resetCompilationState(): void {
    this.appConfig = resetCompilationState(this.sourceFiles, this.compiledPages, this.compiledComponents)
  }
}
