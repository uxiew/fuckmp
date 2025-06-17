/**
 * 智能运行时注入器
 * 分析项目依赖，按需注入运行时库
 */

import type { CompilerOptions } from '../types/compiler'
import { logger } from '@/utils/logger'
import { RuntimeIntegration } from './runtime-integration'
import type { RuntimeIntegrationConfig } from './runtime-integration'

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
    return {
      ...baseConfig,
      treeshaking: true,
      minify: this.compilerOptions.mode === 'production',
      codeSplitting: true,
      chunkStrategy: 'feature',
      runtimeVersion: '1.0.0',
      customModules: []
    }
  }

  /**
   * 创建空的特性使用情况
   */
  private createEmptyFeatureUsage(): Vue3FeatureUsage {
    return {
      reactivity: {
        ref: false,
        reactive: false,
        computed: false,
        watch: false,
        watchEffect: false
      },
      composition: {
        setup: false,
        defineProps: false,
        defineEmits: false,
        defineExpose: false,
        provide: false,
        inject: false
      },
      directives: {
        vIf: false,
        vFor: false,
        vModel: false,
        vShow: false,
        vOn: false,
        vBind: false
      },
      lifecycle: {
        onMounted: false,
        onUnmounted: false,
        onUpdated: false,
        onBeforeMount: false,
        onBeforeUnmount: false,
        onBeforeUpdate: false
      },
      advanced: {
        slots: false,
        teleport: false,
        suspense: false,
        keepAlive: false,
        transition: false
      }
    }
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
    // 分析响应式API
    if (content.includes('ref(')) usage.reactivity.ref = true
    if (content.includes('reactive(')) usage.reactivity.reactive = true
    if (content.includes('computed(')) usage.reactivity.computed = true
    if (content.includes('watch(')) usage.reactivity.watch = true
    if (content.includes('watchEffect(')) usage.reactivity.watchEffect = true

    // 分析组合式API
    if (content.includes('<script setup>') || content.includes('<script lang="ts" setup>')) {
      usage.composition.setup = true
    }
    if (content.includes('defineProps')) usage.composition.defineProps = true
    if (content.includes('defineEmits')) usage.composition.defineEmits = true
    if (content.includes('defineExpose')) usage.composition.defineExpose = true
    if (content.includes('provide(')) usage.composition.provide = true
    if (content.includes('inject(')) usage.composition.inject = true

    // 分析模板指令
    if (content.includes('v-if') || content.includes('v-else')) usage.directives.vIf = true
    if (content.includes('v-for')) usage.directives.vFor = true
    if (content.includes('v-model')) usage.directives.vModel = true
    if (content.includes('v-show')) usage.directives.vShow = true
    if (content.includes('@') || content.includes('v-on:')) usage.directives.vOn = true
    if (content.includes(':') || content.includes('v-bind:')) usage.directives.vBind = true

    // 分析生命周期钩子
    if (content.includes('onMounted')) usage.lifecycle.onMounted = true
    if (content.includes('onUnmounted')) usage.lifecycle.onUnmounted = true
    if (content.includes('onUpdated')) usage.lifecycle.onUpdated = true
    if (content.includes('onBeforeMount')) usage.lifecycle.onBeforeMount = true
    if (content.includes('onBeforeUnmount')) usage.lifecycle.onBeforeUnmount = true
    if (content.includes('onBeforeUpdate')) usage.lifecycle.onBeforeUpdate = true

    // 分析高级特性
    if (content.includes('<slot') || content.includes('useSlots')) usage.advanced.slots = true
    if (content.includes('<teleport')) usage.advanced.teleport = true
    if (content.includes('<suspense')) usage.advanced.suspense = true
    if (content.includes('<keep-alive')) usage.advanced.keepAlive = true
    if (content.includes('<transition')) usage.advanced.transition = true
  }

  /**
   * 记录特性使用情况
   */
  private logFeatureUsage(usage: Vue3FeatureUsage): void {
    const usedFeatures: string[] = []

    Object.entries(usage).forEach(([category, features]) => {
      Object.entries(features).forEach(([feature, used]) => {
        if (used) {
          usedFeatures.push(`${category}.${feature}`)
        }
      })
    })

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
      await this.writeGeneratedFiles(outputDir, generatedFiles)

      // 7. 生成统计报告
      this.generateInjectionReport(featureUsage, bundleResult, generatedFiles)

      logger.info('运行时注入流程完成')
    } catch (error) {
      logger.error('运行时注入失败:', error)
      throw error
    }
  }

  /**
   * 写入生成的文件
   */
  private async writeGeneratedFiles(outputDir: string, files: any[]): Promise<void> {
    const fs = await import('fs/promises')
    const path = await import('path')

    for (const file of files) {
      const filePath = path.join(outputDir, file.path)
      const fileDir = path.dirname(filePath)

      // 确保目录存在
      await fs.mkdir(fileDir, { recursive: true })

      // 写入文件
      await fs.writeFile(filePath, file.content, 'utf-8')

      logger.debug(`生成文件: ${file.path} (${file.content.length} 字节)`)
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
    const usedFeatures = this.countUsedFeatures(featureUsage)
    const totalSize = generatedFiles.reduce((sum, file) => sum + file.content.length, 0)
    const runtimeFiles = generatedFiles.filter(file => file.isRuntime)

    logger.info('=== 运行时注入报告 ===')
    logger.info(`使用的Vue3特性: ${usedFeatures} 个`)
    logger.info(`包含的运行时模块: ${bundleResult.modules.join(', ')}`)
    logger.info(`运行时库大小: ${bundleResult.totalSize} 字节`)
    if (this.config.minify) {
      logger.info(`压缩后大小: ${bundleResult.minifiedSize} 字节`)
    }
    logger.info(`生成的文件: ${generatedFiles.length} 个`)
    logger.info(`运行时文件: ${runtimeFiles.length} 个`)
    logger.info(`总代码大小: ${totalSize} 字节`)
    logger.info('========================')
  }

  /**
   * 统计使用的特性数量
   */
  private countUsedFeatures(usage: Vue3FeatureUsage): number {
    let count = 0
    Object.values(usage).forEach(category => {
      Object.values(category).forEach(used => {
        if (used) count++
      })
    })
    return count
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
