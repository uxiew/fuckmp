/**
 * 运行时库集成
 * 将运行时库自动注入到编译后的小程序代码中
 */

import type { CompilerOptions } from '../types/compiler'
import { logger } from '@/utils/logger'
import { createDefaultPluginRegistry } from '@/plugins/registry'
import { EnhancedScriptTransformer } from '@/transformer/enhanced-script-transformer'

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
    return {
      enableRuntime: true,
      runtimePath: './runtime/index.js',
      autoInject: true,
      runtimeConfig: {
        debug: this.compilerOptions.mode === 'development',
        performance: false
      },
      plugins: {
        enableAll: true,
        include: [],
        exclude: []
      }
    }
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
    if (!this.config.enableRuntime) {
      return ''
    }

    const runtimeConfig = JSON.stringify(this.config.runtimeConfig, null, 2)

    return `
// Vue3 小程序运行时库自动注入
const { initVue3Runtime, definePage, defineComponent } = require('${this.config.runtimePath}')

// 初始化运行时
const runtimeConfig = ${runtimeConfig}
let runtimeInstance = null

// 运行时初始化函数
async function initRuntime() {
  if (!runtimeInstance) {
    try {
      runtimeInstance = await initVue3Runtime(runtimeConfig)
      console.log('Vue3 小程序运行时初始化成功')
    } catch (error) {
      console.error('Vue3 小程序运行时初始化失败:', error)
    }
  }
  return runtimeInstance
}

// 页面创建包装器
function createPage(config) {
  return definePage(config)
}

// 组件创建包装器
function createComponent(config) {
  return defineComponent(config)
}

// 导出运行时API
module.exports = {
  initRuntime,
  createPage,
  createComponent,
  runtime: runtimeInstance
}
`
  }

  /**
   * 生成页面运行时代码
   */
  generatePageRuntimeCode(pageConfig: any): string {
    if (!this.config.enableRuntime) {
      return this.generateLegacyPageCode(pageConfig)
    }

    return `
// 引入运行时
const { createPage } = require('./runtime-injection.js')

// 页面配置
const pageConfig = ${JSON.stringify(pageConfig, null, 2)}

// 创建页面
Page(createPage(pageConfig))
`
  }

  /**
   * 生成组件运行时代码
   */
  generateComponentRuntimeCode(componentConfig: any): string {
    if (!this.config.enableRuntime) {
      return this.generateLegacyComponentCode(componentConfig)
    }

    return `
// 引入运行时
const { createComponent } = require('./runtime-injection.js')

// 组件配置
const componentConfig = ${JSON.stringify(componentConfig, null, 2)}

// 创建组件
Component(createComponent(componentConfig))
`
  }

  /**
   * 生成应用入口代码
   */
  generateAppRuntimeCode(appConfig: any): string {
    if (!this.config.enableRuntime) {
      return this.generateLegacyAppCode(appConfig)
    }

    return `
// 引入运行时
const { initRuntime } = require('./runtime-injection.js')

// 应用配置
const appConfig = ${JSON.stringify(appConfig, null, 2)}

// 应用入口
App({
  ...appConfig,
  
  async onLaunch(options) {
    // 初始化运行时
    await initRuntime()
    
    // 调用原始的onLaunch
    if (appConfig.onLaunch) {
      appConfig.onLaunch.call(this, options)
    }
  }
})
`
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
      logger.error('运行时库注入失败:', error)
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
          content = this.transpileTypeScript(content)
          const jsName = entry.name.replace('.ts', '.js')
          await fs.writeFile(path.join(dest, jsName), content, 'utf-8')
        } else {
          await fs.writeFile(destPath, content, 'utf-8')
        }
      }
    }
  }

  /**
   * 简单的TypeScript转换
   */
  private transpileTypeScript(content: string): string {
    // 简单的TS到JS转换
    // 在实际实现中，应该使用TypeScript编译器API
    return content
      .replace(/import\s+.*?\s+from\s+['"](.+?)['"];?/g, "const $1 = require('$1');")
      .replace(/export\s+\{([^}]+)\}/g, 'module.exports = { $1 }')
      .replace(/export\s+default\s+/g, 'module.exports = ')
      .replace(/export\s+/g, 'module.exports.')
      .replace(/:\s*[A-Za-z<>[\]|&\s]+(?=\s*[=,)])/g, '') // 移除类型注解
      .replace(/interface\s+\w+\s*\{[^}]*\}/g, '') // 移除接口定义
      .replace(/type\s+\w+\s*=\s*[^;]+;/g, '') // 移除类型别名
  }

  /**
   * 生成传统页面代码（不使用运行时）
   */
  private generateLegacyPageCode(pageConfig: any): string {
    return `Page(${JSON.stringify(pageConfig, null, 2)})`
  }

  /**
   * 生成传统组件代码（不使用运行时）
   */
  private generateLegacyComponentCode(componentConfig: any): string {
    return `Component(${JSON.stringify(componentConfig, null, 2)})`
  }

  /**
   * 生成传统应用代码（不使用运行时）
   */
  private generateLegacyAppCode(appConfig: any): string {
    return `App(${JSON.stringify(appConfig, null, 2)})`
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
