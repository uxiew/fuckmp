/**
 * 智能运行时注入器
 * 分析项目依赖，按需注入运行时库
 */

import type { CompilerOptions } from '../types/compiler'
import { logger } from '@/utils/logger'
import { RuntimeIntegration } from './runtime-integration'
import {
  buildRuntimeInjectionReportLines,
  getUsedRuntimeFeatureNames
} from './runtime-injector-report-utils.js'
import type { RuntimeIntegrationConfig } from './runtime-integration'
import {
  analyzeFeatureUsageFromContent,
  countUsedRuntimeFeatures,
  createEmptyFeatureUsage
} from './runtime-injector-usage-utils.js'
import {
  createRuntimeInjectionConfig,
  writeRuntimeGeneratedFiles
} from './runtime-injector-utils.js'

/**
 * Vue3特性使用情况分析
 */
export interface Vue3FeatureUsage {
  /** 响应式API使用情况 */
  reactivity: {
    ref: boolean
    reactive: boolean
    computed: boolean
    watch: boolean
    watchEffect: boolean
  }
  /** 组合式API使用情况 */
  composition: {
    setup: boolean
    defineProps: boolean
    defineEmits: boolean
    defineExpose: boolean
    provide: boolean
    inject: boolean
  }
  /** 模板指令使用情况 */
  directives: {
    vIf: boolean
    vFor: boolean
    vModel: boolean
    vShow: boolean
    vOn: boolean
    vBind: boolean
  }
  /** 生命周期钩子使用情况 */
  lifecycle: {
    onMounted: boolean
    onUnmounted: boolean
    onUpdated: boolean
    onBeforeMount: boolean
    onBeforeUnmount: boolean
    onBeforeUpdate: boolean
  }
  /** 高级特性使用情况 */
  advanced: {
    slots: boolean
    teleport: boolean
    suspense: boolean
    keepAlive: boolean
    transition: boolean
  }
}

/**
 * 运行时注入配置
 */
export interface RuntimeInjectionConfig extends RuntimeIntegrationConfig {
  /** 是否启用按需注入 */
  treeshaking: boolean
  /** 是否启用代码压缩 */
  minify: boolean
  /** 是否启用代码分割 */
  codeSplitting: boolean
  /** 分包策略 */
  chunkStrategy: 'page' | 'component' | 'feature' | 'all'
  /** 运行时库版本 */
  runtimeVersion: string
  /** 自定义运行时模块 */
  customModules: string[]
}

/**
 * 智能运行时注入器
 */
export class RuntimeInjector {
  private config: RuntimeInjectionConfig
  private compilerOptions: CompilerOptions
  private runtimeIntegration: RuntimeIntegration
  private featureUsage: Vue3FeatureUsage

  constructor(compilerOptions: CompilerOptions) {
    this.compilerOptions = compilerOptions
    this.runtimeIntegration = new RuntimeIntegration(compilerOptions)
    this.config = this.createDefaultConfig()
    this.featureUsage = this.createEmptyFeatureUsage()
  }

  /**
   * 创建默认配置
   */
  private createDefaultConfig(): RuntimeInjectionConfig {
    const baseConfig = this.runtimeIntegration.getRuntimeConfig()
    return createRuntimeInjectionConfig(baseConfig, this.compilerOptions)
  }

  /**
   * 创建空的特性使用情况
   */
  private createEmptyFeatureUsage(): Vue3FeatureUsage {
    return createEmptyFeatureUsage()
  }

  /**
   * 更新配置
   */
  updateConfig(config: Partial<RuntimeInjectionConfig>): void {
    this.config = { ...this.config, ...config }
    this.runtimeIntegration.updateConfig(config)
  }

  /**
   * 分析项目中的Vue3特性使用情况
   */
  analyzeFeatureUsage(sourceFiles: Map<string, string>): Vue3FeatureUsage {
    logger.info('开始分析Vue3特性使用情况...')

    const usage = this.createEmptyFeatureUsage()

    for (const [filePath, content] of sourceFiles) {
      this.analyzeFileFeatures(content, usage)
    }

    this.featureUsage = usage
    this.logFeatureUsage(usage)

    return usage
  }

  /**
   * 分析单个文件的特性使用情况
   */
  private analyzeFileFeatures(content: string, usage: Vue3FeatureUsage): void {
    analyzeFeatureUsageFromContent(content, usage)
  }

  /**
   * 记录特性使用情况
   */
  private logFeatureUsage(usage: Vue3FeatureUsage): void {
    const usedFeatures = getUsedRuntimeFeatureNames(usage)

    logger.info(`检测到使用的Vue3特性: ${usedFeatures.join(', ')}`)
    logger.info(`特性使用统计: ${usedFeatures.length} 个特性被使用`)
  }

  /**
   * 获取特性使用情况
   */
  getFeatureUsage(): Vue3FeatureUsage {
    return { ...this.featureUsage }
  }

  /**
   * 获取配置
   */
  getConfig(): RuntimeInjectionConfig {
    return { ...this.config }
  }

  /**
   * 执行完整的运行时注入流程
   */
  async injectRuntime(
    sourceFiles: Map<string, string>,
    outputDir: string,
    appConfig: any,
    pages: Map<string, any>,
    components: Map<string, any>
  ): Promise<void> {
    logger.info('开始执行运行时注入流程...')

    try {
      // 1. 分析特性使用情况
      const featureUsage = this.analyzeFeatureUsage(sourceFiles)
      for (const record of [appConfig, ...pages.values(), ...components.values()]) {
        for (const variable of record?.context?.reactiveVariables?.values() ?? []) {
          const { type } = variable
          if (type === 'ref' || type === 'reactive' || type === 'computed') {
            featureUsage.reactivity[type as 'ref' | 'reactive' | 'computed'] = true
          }
        }
      }

      // 2. 创建运行时打包器
      const { RuntimeBundler } = await import('./runtime-bundler')
      const bundler = new RuntimeBundler(this.config)

      // 3. 打包运行时库
      const bundleResult = await bundler.bundle(featureUsage)

      // 4. 创建代码生成器
      const { CodeGenerator } = await import('./code-generator')
      const generator = new CodeGenerator(this.config, {
        target: 'wechat',
        sourceMap: this.config.runtimeConfig.debug,
        strict: true
      })

      // 5. 生成所有文件
      const generatedFiles = generator.generateAllFiles(
        bundleResult,
        featureUsage,
        appConfig,
        pages,
        components
      )

      // 6. 写入文件
      await writeRuntimeGeneratedFiles(
        outputDir,
        generatedFiles,
        message => logger.debug(message)
      )

      // 7. 生成统计报告
      this.generateInjectionReport(featureUsage, bundleResult, generatedFiles)

      logger.info('运行时注入流程完成')
    } catch (error) {
      logger.error('运行时注入失败:', error instanceof Error ? error : new Error(String(error)))
      throw error
    }
  }

  /**
   * 生成注入报告
   */
  private generateInjectionReport(
    featureUsage: Vue3FeatureUsage,
    bundleResult: any,
    generatedFiles: any[]
  ): void {
    buildRuntimeInjectionReportLines(
      this.config,
      featureUsage,
      bundleResult,
      generatedFiles
    ).forEach(line => logger.info(line))
  }

  /**
   * 统计使用的特性数量
   */
  private countUsedFeatures(usage: Vue3FeatureUsage): number {
    return countUsedRuntimeFeatures(usage)
  }

  /**
   * 检查是否需要注入运行时
   */
  shouldInjectRuntime(featureUsage: Vue3FeatureUsage): boolean {
    if (!this.config.enableRuntime) {
      return false
    }

    // 如果使用了任何Vue3特性，就需要注入运行时
    return this.countUsedFeatures(featureUsage) > 0
  }

  /**
   * 获取运行时库版本信息
   */
  getRuntimeVersion(): string {
    return this.config.runtimeVersion
  }

  /**
   * 更新特性使用情况
   */
  updateFeatureUsage(usage: Partial<Vue3FeatureUsage>): void {
    this.featureUsage = { ...this.featureUsage, ...usage }
  }

  /**
   * 重置特性使用情况
   */
  resetFeatureUsage(): void {
    this.featureUsage = this.createEmptyFeatureUsage()
  }
}
