/**
 * 主编译器类
 */

import { SFCParser, ScriptParser, TemplateParser, StyleParser } from '@/parser/index.js'
import { ScriptTransformer, TemplateTransformer, StyleTransformer } from '@/transformer/index.js'
import { ComponentGenerator, PageGenerator, ConfigGenerator } from '@/generator/index.js'
import { ConfigManager } from './options.js'
import { generateAppStyles } from './app-styles.js'
import { createInitialTransformContext } from './transform-context.js'
import { applyUserConfigToJson } from './compiler-config-utils.js'
import { mergeScriptTransformContext } from './compiler-context-utils.js'
import { buildRuntimeInjectionEntries } from './compiler-runtime-utils.js'
import { removeGeneratedOutputFiles } from './compiler-output-utils.js'
import {
  createCompileError,
  createCompileResult,
  createMissingInputMessage,
  createMissingInputResult
} from './compiler-result-utils.js'
import {
  createImportedStyleParseOptions,
  createImportedStyleTransformOptions,
  createVueStyleParseOptions,
  createVueStyleTransformOptions,
  inferStyleLanguage
} from './compiler-style-utils.js'
import { PluginManager, createDefaultPluginManager } from '@/plugins/index.js'
import { UserConfigManager } from '@/config/user-config.js'
import { RuntimeInjector } from './runtime-injector'
import type { CompilerOptions, CompileResult, ParseResult, TransformContext } from '@/types/index.js'
import { logger, scanVueFiles, getOutputPath, isPageComponent, isAppComponent, writeFile, ensureDir, getRelativePath, normalizePath, PathResolver, createPathResolver, readFile, isDirectory } from '@/utils/index.js'
import path from 'path'

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
      const generateResult = await this.generateCode(results, context)

      // 收集页面、组件和应用配置用于运行时注入
      this.compiledPages.delete(filePath)
      this.compiledComponents.delete(filePath)

      if (isAppComponent(filePath)) {
        // 应用入口文件
        this.appConfig = {
          config: generateResult.json,
          context: context,
          template: results.template
        }
      } else if (context.isPage) {
        this.compiledPages.set(filePath, {
          config: generateResult.json,
          context: context,
          template: results.template
        })
      } else {
        this.compiledComponents.set(filePath, {
          config: generateResult.json,
          context: context,
          template: results.template
        })
      }

      // 写入文件（应用入口文件由运行时注入器处理）
      if (!isAppComponent(filePath)) {
        await this.writeFiles(filePath, generateResult)
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
      result.stats.total = vueFiles.length

      logger.info(`发现 ${vueFiles.length} 个 Vue 文件`)

      // 确保输出目录存在
      await ensureDir(options.output)

      // 编译每个文件
      for (const filePath of vueFiles) {
        try {
          await this.compileFile(filePath)
          result.success.push(filePath)
          result.stats.success++
        } catch (error) {
          result.errors.push(createCompileError(filePath, error))
          result.stats.failed++
        }
      }

      await this.refreshProjectOutputs()

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
    const compiledFiles = [
      ...this.compiledPages.keys(),
      ...this.compiledComponents.keys()
    ]

    await this.generateAppConfig(compiledFiles)
    await generateAppStyles(options.output)
    await this.performRuntimeInjection(options.output)
    await this.configGenerator.generateProjectConfig(options.output)
    await this.configGenerator.generateSitemapConfig(options.output)

    if (this.configManager.getFeature('typescript')) {
      await this.configGenerator.generateTSConfig(options.output)
    }
  }

  /** 从增量编译状态中移除源文件并清理对应输出。 */
  async removeSourceFile(filePath: string): Promise<string[]> {
    const options = this.configManager.getOptions()

    this.sourceFiles.delete(filePath)
    this.compiledPages.delete(filePath)
    this.compiledComponents.delete(filePath)

    if (isAppComponent(filePath)) {
      this.appConfig = {}
    }

    const removedFiles = isAppComponent(filePath)
      ? []
      : await removeGeneratedOutputFiles(filePath, options.input, options.output)

    await this.refreshProjectOutputs()

    return removedFiles
  }

  /**
   * 解析和转换
   */
  private async parseAndTransform(parseResult: ParseResult, context: TransformContext) {
    const results: any = {}

    // 解析和转换脚本
    if (parseResult.script) {
      const scriptParseResult = await this.scriptParser.parseScript(
        parseResult.script.content,
        context.filename
      )
      results.script = await this.scriptTransformer.transformScript(
        scriptParseResult,
        context.filename,
        context.isPage
      )

      // 将脚本转换结果中的上下文合并到主上下文中
      if (results.script.context) {
        mergeScriptTransformContext(context, results.script.context)
      }
    }

    // 解析和转换模板
    if (parseResult.template) {
      const templateParseResult = await this.templateParser.parseTemplate(
        parseResult.template.content,
        context.filename
      )
      results.template = await this.templateTransformer.transformTemplate(
        templateParseResult,
        context
      )

      if (results.script?.context && context.templateUnsupported) {
        results.script.context.templateUnsupported = context.templateUnsupported
      }
    }

    // 解析和转换样式
    results.styles = []

    // 处理 Vue 文件中的样式
    if (parseResult.styles.length > 0) {
      for (const style of parseResult.styles) {
        const styleParseResult = await this.styleParser.parseStyle(
          style.content,
          style.lang,
          context.filename,
          createVueStyleParseOptions(
            style,
            context.filename,
            this.configManager.getOptimization('sourcemap')
          )
        )
        const styleTransformResult = await this.styleTransformer.transformStyle(
          styleParseResult,
          context,
          createVueStyleTransformOptions(
            style,
            this.configManager.getOptimization('minify')
          )
        )
        results.styles.push(styleTransformResult)
      }
    }

    // 处理从 JavaScript 导入的样式文件
    if (context.styleImports && context.styleImports.length > 0) {
      for (const styleImportPath of context.styleImports) {
        try {
          // 解析样式文件路径
          const resolvedStylePath = path.resolve(path.dirname(context.filename), styleImportPath)

          // 读取样式文件内容
          const styleContent = await readFile(resolvedStylePath)

          const styleParseResult = await this.styleParser.parseStyle(
            styleContent,
            inferStyleLanguage(styleImportPath),
            resolvedStylePath,
            createImportedStyleParseOptions(
              resolvedStylePath,
              this.configManager.getOptimization('sourcemap')
            )
          )

          const styleTransformResult = await this.styleTransformer.transformStyle(
            styleParseResult,
            context,
            createImportedStyleTransformOptions(
              this.configManager.getOptimization('minify'),
              this.configManager.getOptimization('sourcemap')
            )
          )

          results.styles.push(styleTransformResult)
        } catch (error) {
          logger.error(`处理导入的样式文件失败: ${styleImportPath}`, error as Error)
        }
      }
    }

    return results
  }

  /**
   * 生成代码
   */
  private async generateCode(results: any, context: TransformContext) {
    if (context.isPage) {
      return await this.pageGenerator.generatePage(
        results.script,
        results.template,
        results.styles || [],
        context
      )
    } else {
      return await this.componentGenerator.generateComponent(
        results.script,
        results.template,
        results.styles || [],
        context
      )
    }
  }

  /**
   * 写入文件
   */
  private async writeFiles(inputPath: string, generateResult: any): Promise<void> {
    const options = this.configManager.getOptions()
    let outputPath = getOutputPath(inputPath, options.input, options.output)

    // 移除 .vue 扩展名
    outputPath = outputPath.replace(/\.vue$/, '')

    // 写入 JavaScript 文件
    await writeFile(`${outputPath}.js`, generateResult.js)

    // 应用用户自定义配置到 JSON 文件
    const finalJsonConfig = applyUserConfigToJson({
      inputPath,
      defaultConfig: generateResult.json,
      inputRoot: options.input,
      userConfig: this.userConfigManager.getConfig(),
      pathResolver: this.pathResolver
    })
    logger.debug(`最终 JSON 配置 (${inputPath}):`, finalJsonConfig)
    await writeFile(`${outputPath}.json`, JSON.stringify(finalJsonConfig, null, 2))

    // 写入 WXML 模板文件
    await writeFile(`${outputPath}.wxml`, generateResult.wxml)

    // 写入 WXSS 样式文件
    await writeFile(`${outputPath}.wxss`, generateResult.wxss)

    // 如果有 Source Map，写入 Source Map 文件
    if (generateResult.sourceMap) {
      await writeFile(`${outputPath}.js.map`, generateResult.sourceMap)
    }
  }

  /**
   * 执行运行时注入
   */
  private async performRuntimeInjection(outputDir: string): Promise<void> {
    try {
      logger.info('开始执行运行时注入...')

      const inputRoot = this.configManager.getOptions().input
      const pages = buildRuntimeInjectionEntries(this.compiledPages, inputRoot)
      const components = buildRuntimeInjectionEntries(this.compiledComponents, inputRoot)

      // 执行运行时注入
      await this.runtimeInjector.injectRuntime(
        this.sourceFiles,
        outputDir,
        this.appConfig,
        pages,
        components
      )

      logger.success('运行时注入完成')
    } catch (error) {
      logger.error('运行时注入失败:', error as Error)
      // 不抛出错误，让编译继续进行
    }
  }

  /**
   * 生成应用配置
   */
  private async generateAppConfig(successFiles: string[]): Promise<void> {
    const options = this.configManager.getOptions()

    logger.debug(`生成应用配置，成功文件: ${successFiles.length} 个`)

    // 提取页面路径
    const pageFiles = successFiles.filter(file => isPageComponent(file))
    logger.debug(`页面文件: ${pageFiles.length} 个`, pageFiles)

    const pages = pageFiles.map(file => {
      // 获取相对于输入目录的路径，并移除 .vue 后缀
      const relativePath = getRelativePath(options.input, file)
      const outputPath = normalizePath(relativePath).replace(/\.vue$/, '')
      logger.debug(`页面路径转换: ${file} -> ${outputPath}`)
      return outputPath
    })

    logger.debug(`最终页面路径:`, pages)

    await this.configGenerator.generateAppConfig(pages, options.output)
  }

  /**
   * 监听模式编译
   */
  async watch(): Promise<void> {
    const options = this.configManager.getOptions()

    logger.info('启动监听模式')

    const chokidar = await import('chokidar')
    const watcher = chokidar.watch(`${options.input}/**/*.vue`, {
      ignored: /node_modules/,
      persistent: true
    })

    watcher.on('change', async (filePath) => {
      logger.info(`文件变更: ${filePath}`)
      try {
        await this.compileFile(filePath)
        await this.refreshProjectOutputs()
        logger.success(`文件重新编译完成: ${filePath}`)
      } catch (error) {
        logger.error(`文件重新编译失败: ${filePath}`, error as Error)
      }
    })

    watcher.on('add', async (filePath) => {
      logger.info(`新增文件: ${filePath}`)
      try {
        await this.compileFile(filePath)
        await this.refreshProjectOutputs()
        logger.success(`新文件编译完成: ${filePath}`)
      } catch (error) {
        logger.error(`新文件编译失败: ${filePath}`, error as Error)
      }
    })

    watcher.on('unlink', async (filePath) => {
      logger.info(`删除文件: ${filePath}`)
      try {
        const removedFiles = await this.removeSourceFile(filePath)
        logger.success(`已清理输出产物: ${removedFiles.length} 个`)
      } catch (error) {
        logger.error(`清理输出产物失败: ${filePath}`, error as Error)
      }
    })

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
    this.sourceFiles.clear()
    this.compiledPages.clear()
    this.compiledComponents.clear()
    this.appConfig = {}
  }
}
