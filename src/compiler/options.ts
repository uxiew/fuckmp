/**
 * 编译器选项定义
 */

import type { CompilerOptions } from '@/types/index.js'
import {
  createCompilerOptionsSummary,
  mergeCompilerOptions,
  normalizeCompilerOptions,
  validateCompilerOptions
} from './compiler-options-utils.js'

export { DEFAULT_COMPILER_OPTIONS } from './compiler-options-utils.js'

/**
 * 编译器选项验证器
 */
export class OptionsValidator {
  /**
   * 验证编译器选项
   */
  static validate(options: Partial<CompilerOptions>): { valid: boolean; errors: string[] } {
    return validateCompilerOptions(options)
  }

  /**
   * 规范化选项
   */
  static normalize(options: Partial<CompilerOptions>): CompilerOptions {
    return normalizeCompilerOptions(options)
  }
}

/**
 * 编译器配置管理器
 */
export class ConfigManager {
  private options: CompilerOptions

  constructor(options: Partial<CompilerOptions> = {}) {
    // 验证选项
    const validation = OptionsValidator.validate(options)
    if (!validation.valid) {
      throw new Error(`编译器选项验证失败: ${validation.errors.join(', ')}`)
    }

    // 规范化选项
    this.options = OptionsValidator.normalize(options)
  }

  /**
   * 获取选项
   */
  getOptions(): CompilerOptions {
    return { ...this.options }
  }

  /**
   * 更新选项
   */
  updateOptions(updates: Partial<CompilerOptions>): void {
    const newOptions = mergeCompilerOptions(this.options, updates)

    // 验证新选项
    const validation = OptionsValidator.validate(newOptions)
    if (!validation.valid) {
      throw new Error(`选项更新失败: ${validation.errors.join(', ')}`)
    }

    this.options = OptionsValidator.normalize(newOptions)
  }

  /**
   * 获取特定选项
   */
  getFeature(feature: keyof CompilerOptions['features']): boolean {
    return this.options.features[feature]
  }

  /**
   * 获取优化选项
   */
  getOptimization(option: keyof CompilerOptions['optimization']): boolean {
    return this.options.optimization[option]
  }

  /**
   * 检查是否为开发模式
   */
  isDevelopment(): boolean {
    return !this.options.optimization.minify
  }

  /**
   * 检查是否为生产模式
   */
  isProduction(): boolean {
    return this.options.optimization.minify
  }

  /**
   * 获取输入目录
   */
  getInputDir(): string {
    return this.options.input
  }

  /**
   * 获取输出目录
   */
  getOutputDir(): string {
    return this.options.output
  }

  /**
   * 获取应用 ID
   */
  getAppId(): string {
    return this.options.appId
  }

  /**
   * 获取注入配置
   */
  getInjection(): CompilerOptions['injection'] {
    return this.options.injection
  }

  /**
   * 检查是否启用纯净模式
   */
  isPureMode(): boolean {
    return this.options.injection.pureMode
  }

  /**
   * 获取页面注入配置
   */
  getPageInjection(): CompilerOptions['injection']['page'] {
    return this.options.injection.page
  }

  /**
   * 获取组件注入配置
   */
  getComponentInjection(): CompilerOptions['injection']['component'] {
    return this.options.injection.component
  }

  /**
   * 获取响应式注入配置
   */
  getReactivityInjection(): CompilerOptions['injection']['reactivity'] {
    return this.options.injection.reactivity
  }

  /**
   * 导出配置为 JSON
   */
  toJSON(): string {
    return JSON.stringify(this.options, null, 2)
  }

  /**
   * 从 JSON 导入配置
   */
  static fromJSON(json: string): ConfigManager {
    try {
      const options = JSON.parse(json)
      return new ConfigManager(options)
    } catch (error) {
      throw new Error(`配置 JSON 解析失败: ${error}`)
    }
  }

  /**
   * 从文件加载配置
   */
  static async fromFile(filePath: string): Promise<ConfigManager> {
    try {
      const { readFile } = await import('@/utils/index.js')
      const content = await readFile(filePath)

      if (filePath.endsWith('.json')) {
        return ConfigManager.fromJSON(content)
      } else if (filePath.endsWith('.js') || filePath.endsWith('.ts')) {
        // 动态导入配置文件
        const configModule = await import(filePath)
        const options = configModule.default || configModule
        return new ConfigManager(options)
      } else {
        throw new Error('不支持的配置文件格式')
      }
    } catch (error) {
      throw new Error(`配置文件加载失败: ${error}`)
    }
  }

  /**
   * 保存配置到文件
   */
  async saveToFile(filePath: string): Promise<void> {
    try {
      const { writeFile } = await import('@/utils/index.js')

      if (filePath.endsWith('.json')) {
        await writeFile(filePath, this.toJSON())
      } else if (filePath.endsWith('.js')) {
        const jsContent = `module.exports = ${this.toJSON()}`
        await writeFile(filePath, jsContent)
      } else if (filePath.endsWith('.ts')) {
        const tsContent = `import type { CompilerOptions } from '@vue3-miniprogram/compiler'

const config: CompilerOptions = ${this.toJSON()}

export default config`
        await writeFile(filePath, tsContent)
      } else {
        throw new Error('不支持的配置文件格式')
      }
    } catch (error) {
      throw new Error(`配置文件保存失败: ${error}`)
    }
  }

  /**
   * 克隆配置管理器
   */
  clone(): ConfigManager {
    return new ConfigManager(this.options)
  }

  /**
   * 合并配置
   */
  merge(other: ConfigManager): ConfigManager {
    return new ConfigManager(mergeCompilerOptions(this.options, other.options))
  }

  /**
   * 获取配置摘要
   */
  getSummary(): string {
    return createCompilerOptionsSummary(this.options)
  }
}
