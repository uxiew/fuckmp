/**
 * 主编译器类
 */

import { SFCParser, ScriptParser, TemplateParser, StyleParser } from '@/parser/index.js'
import { ScriptTransformer, TemplateTransformer, StyleTransformer } from '@/transformer/index.js'
import { ComponentGenerator, PageGenerator, ConfigGenerator } from '@/generator/index.js'
import { ConfigManager } from './options.js'
import { PluginManager, createDefaultPluginManager } from '@/plugins/index.js'
import { UserConfigManager } from '@/config/user-config.js'
import { RuntimeInjector } from './runtime-injector'
import type { CompilerOptions, CompileResult, ParseResult, TransformContext } from '@/types/index.js'
import { logger, scanVueFiles, getOutputPath, isPageComponent, isAppComponent, writeFile, ensureDir, getRelativePath, normalizePath, PathResolver, createPathResolver, readFile } from '@/utils/index.js'
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
      const context: TransformContext = {
        filename: filePath,
        isPage: isPageComponent(filePath),
        hasScoped,
        props: {},
        emits: [],
        expose: {},
        data: {},
        methods: {},
        computed: {},
        watch: {},
        lifecycle: {},
        imports: new Set(),
        components: new Map()
      }

      // 解析和转换各个部分
      const results = await this.parseAndTransform(parseResult, context)

      // 生成代码
      const generateResult = await this.generateCode(results, context)

      // 收集页面、组件和应用配置用于运行时注入
      if (isAppComponent(filePath)) {
        // 应用入口文件
        this.appConfig = {
          config: generateResult.json,
          context: context
        }
      } else if (context.isPage) {
        this.compiledPages.set(filePath, {
          config: generateResult.json,
          context: context
        })
      } else {
        this.compiledComponents.set(filePath, {
          config: generateResult.json,
          context: context
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

    const result: CompileResult = {
      success: [],
      errors: [],
      stats: {
        total: 0,
        success: 0,
        failed: 0,
        duration: 0
      }
    }

    try {
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
          const errorObj: any = {
            file: filePath,
            message: (error as Error).message
          }

          if ((error as Error).stack) {
            errorObj.stack = (error as Error).stack
          }

          result.errors.push(errorObj)
          result.stats.failed++
        }
      }

      // 生成应用配置
      await this.generateAppConfig(result.success)

      // 执行运行时注入
      await this.performRuntimeInjection(options.output)

      // 生成项目配置
      await this.configGenerator.generateProjectConfig(options.output)
      await this.configGenerator.generateSitemapConfig(options.output)

      if (this.configManager.getFeature('typescript')) {
        await this.configGenerator.generateTSConfig(options.output)
      }

      result.stats.duration = Date.now() - startTime

      logger.success(`项目编译完成! 成功: ${result.stats.success}, 失败: ${result.stats.failed}, 耗时: ${result.stats.duration}ms`)

      return result

    } catch (error) {
      logger.error('项目编译失败', error as Error)
      throw error
    }
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
        const scriptContext = results.script.context

        // 合并数据
        Object.assign(context.data, scriptContext.data)

        // 合并方法
        Object.assign(context.methods, scriptContext.methods)

        // 合并计算属性
        Object.assign(context.computed, scriptContext.computed)

        // 合并生命周期
        Object.assign(context.lifecycle, scriptContext.lifecycle)

        // 合并监听器
        Object.assign(context.watch, scriptContext.watch)

        // 合并props和emits
        Object.assign(context.props, scriptContext.props)
        context.emits = [...context.emits, ...scriptContext.emits]

        // 合并导入和组件
        scriptContext.imports.forEach((imp: string) => context.imports.add(imp))
        scriptContext.components.forEach((path: string, name: string) => context.components.set(name, path))

        // 合并样式导入
        if (scriptContext.styleImports) {
          context.styleImports = scriptContext.styleImports
        }
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
    }

    // 解析和转换样式
    results.styles = []

    // 处理 Vue 文件中的样式
    if (parseResult.styles.length > 0) {
      for (const style of parseResult.styles) {
        const parseOptions: any = {
          sourcemap: this.configManager.getOptimization('sourcemap'),
          baseDir: path.dirname(context.filename)
        }

        if (style.scoped !== undefined) {
          parseOptions.scoped = style.scoped
        }

        const styleParseResult = await this.styleParser.parseStyle(
          style.content,
          style.lang,
          context.filename,
          parseOptions
        )
        const transformOptions: any = {
          minify: this.configManager.getOptimization('minify')
        }

        if (style.scoped !== undefined) {
          transformOptions.scoped = style.scoped
        }

        const styleTransformResult = await this.styleTransformer.transformStyle(
          styleParseResult,
          context,
          transformOptions
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

          // 确定样式语言
          const styleLang = styleImportPath.endsWith('.scss') ? 'scss' :
            styleImportPath.endsWith('.sass') ? 'sass' : 'css'

          // 解析样式
          const parseOptions = {
            scoped: false, // 导入的样式文件默认不使用 scoped
            sourcemap: this.configManager.getOptimization('sourcemap'),
            baseDir: path.dirname(resolvedStylePath)
          }
          const styleParseResult = await this.styleParser.parseStyle(
            styleContent,
            styleLang,
            resolvedStylePath,
            parseOptions
          )

          // 转换样式
          const transformOptions = {
            scoped: false,
            minify: this.configManager.getOptimization('minify'),
            sourcemap: this.configManager.getOptimization('sourcemap')
          }
          const styleTransformResult = await this.styleTransformer.transformStyle(
            styleParseResult,
            context,
            transformOptions
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
    const finalJsonConfig = this.applyUserConfigToJson(inputPath, generateResult.json)
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
   * 应用用户配置到 JSON 文件
   */
  private applyUserConfigToJson(inputPath: string, defaultConfig: any): any {
    const options = this.configManager.getOptions()
    const relativePath = getRelativePath(options.input, inputPath).replace(/\.vue$/, '')

    // 获取用户配置
    const userConfig = this.userConfigManager.getConfig()

    logger.debug(`应用用户配置: ${inputPath} -> ${relativePath}`)

    if (!userConfig) {
      logger.debug('没有用户配置')
      return this.processComponentPaths(defaultConfig, inputPath)
    }

    let finalConfig = defaultConfig

    // 检查是否为页面
    if (isPageComponent(inputPath)) {
      // 应用页面配置
      const pageConfig = userConfig.pages?.[relativePath]
      logger.debug(`页面配置查找: ${relativePath}`, pageConfig ? '找到' : '未找到')
      if (pageConfig) {
        finalConfig = { ...defaultConfig, ...pageConfig }
      }
    } else {
      // 应用组件配置
      const componentConfig = userConfig.components?.[relativePath]
      logger.debug(`组件配置查找: ${relativePath}`, componentConfig ? '找到' : '未找到')
      logger.debug('可用的组件配置键:', Object.keys(userConfig.components || {}))
      if (componentConfig) {
        logger.debug('默认配置:', defaultConfig)
        logger.debug('用户配置:', componentConfig)
        finalConfig = { ...defaultConfig, ...componentConfig }
        logger.debug('合并后配置:', finalConfig)
      }
    }

    // 处理组件路径
    return this.processComponentPaths(finalConfig, inputPath)
  }

  /**
   * 处理组件路径，将别名路径转换为相对路径
   */
  private processComponentPaths(config: any, fromFile: string): any {
    if (!config.usingComponents) {
      return config
    }

    const processedConfig = { ...config }
    const processedComponents: Record<string, string> = {}

    logger.debug(`处理组件路径，源文件: ${fromFile}`)
    logger.debug(`原始组件配置:`, config.usingComponents)

    Object.entries(config.usingComponents).forEach(([name, path]) => {
      try {
        let actualPath = path as string

        // 检查是否需要添加 .vue 扩展名
        if (!actualPath.endsWith('.vue') && !actualPath.endsWith('.js') && !actualPath.endsWith('.ts')) {
          actualPath = actualPath + '.vue'
        }

        // 检查是否需要添加路径前缀
        if (!actualPath.includes('/') && !actualPath.startsWith('@') && !actualPath.startsWith('./') && !actualPath.startsWith('../')) {
          // 这可能是一个组件名，尝试构造路径
          actualPath = `@/components/${actualPath}`
          logger.debug(`推断组件路径: ${name} -> ${actualPath}`)
        }

        const resolvedPath = this.pathResolver.resolveComponentPath(fromFile, actualPath)
        processedComponents[name] = resolvedPath
        logger.debug(`组件路径解析: ${name}: ${path} -> ${actualPath} -> ${resolvedPath}`)
      } catch (error) {
        logger.error(`组件路径解析失败: ${name}: ${path}`, error as Error)
        processedComponents[name] = path as string
      }
    })

    processedConfig.usingComponents = processedComponents
    return processedConfig
  }

  /**
   * 执行运行时注入
   */
  private async performRuntimeInjection(outputDir: string): Promise<void> {
    try {
      logger.info('开始执行运行时注入...')

      // 准备页面配置（包含配置和上下文）
      const pages = new Map<string, any>()
      for (const [filePath, pageData] of this.compiledPages) {
        const relativePath = getRelativePath(this.configManager.getOptions().input, filePath)
          .replace(/\.vue$/, '')
        pages.set(relativePath, {
          config: pageData.config,
          context: pageData.context
        })
      }

      // 准备组件配置（包含配置和上下文）
      const components = new Map<string, any>()
      for (const [filePath, componentData] of this.compiledComponents) {
        const relativePath = getRelativePath(this.configManager.getOptions().input, filePath)
          .replace(/\.vue$/, '')
        components.set(relativePath, {
          config: componentData.config,
          context: componentData.context
        })
      }

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
        logger.success(`文件重新编译完成: ${filePath}`)
      } catch (error) {
        logger.error(`文件重新编译失败: ${filePath}`, error as Error)
      }
    })

    watcher.on('add', async (filePath) => {
      logger.info(`新增文件: ${filePath}`)
      try {
        await this.compileFile(filePath)
        logger.success(`新文件编译完成: ${filePath}`)
      } catch (error) {
        logger.error(`新文件编译失败: ${filePath}`, error as Error)
      }
    })

    watcher.on('unlink', (filePath) => {
      logger.info(`删除文件: ${filePath}`)
      // TODO: 清理对应的输出文件
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
}
