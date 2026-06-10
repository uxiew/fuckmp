/**
 * 运行时库集成
 * 将运行时库自动注入到编译后的小程序代码中
 */

import type { CompilerOptions } from '../types/compiler'
import { logger } from '@/utils/logger'
import { createDefaultPluginRegistry } from '@/plugins/registry'
import { EnhancedScriptTransformer } from '@/transformer/enhanced-script-transformer'
import {
  createDefaultRuntimeIntegrationConfig,
  generateAppRuntimeCode as generateRuntimeAppCode,
  generateComponentRuntimeCode as generateRuntimeComponentCode,
  generatePageRuntimeCode as generateRuntimePageCode,
  generateRuntimeInjectionCode,
  transpileRuntimeTypeScript
} from './runtime-integration-utils.js'

/**
 * 运行时集成配置
 */
export interface RuntimeIntegrationConfig {
  /** 是否启用运行时库 */
  enableRuntime: boolean
  /** 运行时库路径 */
  runtimePath: string
  /** 是否自动注入 */
  autoInject: boolean
  /** 运行时配置 */
  runtimeConfig: {
    debug: boolean
    performance: boolean
  }
  /** 插件配置 */
  plugins: {
    enableAll: boolean
    include: string[]
    exclude: string[]
  }
}

/**
 * 运行时集成器
 */
export class RuntimeIntegration {
  private config: RuntimeIntegrationConfig
  private compilerOptions: CompilerOptions

  constructor(compilerOptions: CompilerOptions) {
    this.compilerOptions = compilerOptions
    this.config = this.createDefaultConfig()
  }

  /**
   * 创建默认配置
   */
  private createDefaultConfig(): RuntimeIntegrationConfig {
    return createDefaultRuntimeIntegrationConfig(this.compilerOptions)
  }

  /**
   * 更新配置
   */
  updateConfig(config: Partial<RuntimeIntegrationConfig>): void {
    this.config = { ...this.config, ...config }
  }

  /**
   * 生成运行时注入代码
   */
  generateRuntimeInjection(): string {
    return generateRuntimeInjectionCode(this.config)
  }

  /**
   * 生成页面运行时代码
   */
  generatePageRuntimeCode(pageConfig: any): string {
    return generateRuntimePageCode(this.config, pageConfig)
  }

  /**
   * 生成组件运行时代码
   */
  generateComponentRuntimeCode(componentConfig: any): string {
    return generateRuntimeComponentCode(this.config, componentConfig)
  }

  /**
   * 生成应用入口代码
   */
  generateAppRuntimeCode(appConfig: any): string {
    return generateRuntimeAppCode(this.config, appConfig)
  }

  /**
   * 注入运行时到文件系统
   */
  async injectRuntimeFiles(outputDir: string): Promise<void> {
    if (!this.config.enableRuntime || !this.config.autoInject) {
      return
    }

    const fs = await import('fs/promises')
    const path = await import('path')

    try {
      // 创建运行时注入文件
      const injectionCode = this.generateRuntimeInjection()
      const injectionPath = path.join(outputDir, 'runtime-injection.js')
      await fs.writeFile(injectionPath, injectionCode, 'utf-8')

      // 复制运行时库文件
      await this.copyRuntimeLibrary(outputDir)

      logger.info('运行时库注入完成')
    } catch (error) {
      logger.error('运行时库注入失败:', error instanceof Error ? error : new Error(String(error)))
      throw error
    }
  }

  /**
   * 复制运行时库文件
   */
  private async copyRuntimeLibrary(outputDir: string): Promise<void> {
    const fs = await import('fs/promises')
    const path = await import('path')

    // 运行时库源文件路径
    const runtimeSrcDir = path.resolve(__dirname, '../runtime')
    const runtimeDestDir = path.join(outputDir, 'runtime')

    // 确保目标目录存在
    await fs.mkdir(runtimeDestDir, { recursive: true })

    // 复制运行时文件
    await this.copyDirectory(runtimeSrcDir, runtimeDestDir)
  }

  /**
   * 递归复制目录
   */
  private async copyDirectory(src: string, dest: string): Promise<void> {
    const fs = await import('fs/promises')
    const path = await import('path')

    const entries = await fs.readdir(src, { withFileTypes: true })

    for (const entry of entries) {
      const srcPath = path.join(src, entry.name)
      const destPath = path.join(dest, entry.name)

      if (entry.isDirectory()) {
        await fs.mkdir(destPath, { recursive: true })
        await this.copyDirectory(srcPath, destPath)
      } else if (entry.isFile() && (entry.name.endsWith('.js') || entry.name.endsWith('.ts'))) {
        // 只复制JS和TS文件
        let content = await fs.readFile(srcPath, 'utf-8')

        // 如果是TS文件，需要转换为JS
        if (entry.name.endsWith('.ts')) {
          content = transpileRuntimeTypeScript(content)
          const jsName = entry.name.replace('.ts', '.js')
          await fs.writeFile(path.join(dest, jsName), content, 'utf-8')
        } else {
          await fs.writeFile(destPath, content, 'utf-8')
        }
      }
    }
  }

  /**
   * 检查是否启用运行时
   */
  isRuntimeEnabled(): boolean {
    return this.config.enableRuntime
  }

  /**
   * 获取运行时配置
   */
  getRuntimeConfig(): RuntimeIntegrationConfig {
    return { ...this.config }
  }

  /**
   * 创建增强的脚本转换器
   */
  createEnhancedTransformer(): EnhancedScriptTransformer {
    const pluginRegistry = createDefaultPluginRegistry()

    // 根据配置过滤插件
    if (!this.config.plugins.enableAll) {
      // TODO: 实现插件过滤逻辑
    }

    return new EnhancedScriptTransformer(this.compilerOptions, pluginRegistry)
  }
}
