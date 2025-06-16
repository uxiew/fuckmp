/**
 * 编译器选项定义
 */

import type { CompilerOptions, LogLevel } from '@/types/index.js'

/**
 * 默认编译器选项
 */
export const DEFAULT_COMPILER_OPTIONS: CompilerOptions = {
  input: 'src',
  output: 'dist',
  appId: 'your-app-id',
  framework: 'vue3',
  features: {
    scriptSetup: true,
    scss: true,
    typescript: true,
    compositionApi: true,
    emits: true,
    slots: true,
    provide: true
  },
  optimization: {
    minify: false,
    treeshaking: true,
    sourcemap: true,
    incremental: true
  }
}

/**
 * 编译器选项验证器
 */
export class OptionsValidator {
  /**
   * 验证编译器选项
   */
  static validate(options: Partial<CompilerOptions>): { valid: boolean; errors: string[] } {
    const errors: string[] = []

    // 验证必需字段
    if (!options.input) {
      errors.push('input 选项是必需的')
    }

    if (!options.output) {
      errors.push('output 选项是必需的')
    }

    if (!options.appId) {
      errors.push('appId 选项是必需的')
    }

    // 验证框架
    if (options.framework && options.framework !== 'vue3') {
      errors.push('目前只支持 vue3 框架')
    }

    // 验证特性配置
    if (options.features) {
      const { features } = options
      
      if (features.typescript && !features.scriptSetup) {
        errors.push('使用 TypeScript 时建议启用 scriptSetup')
      }
    }

    return {
      valid: errors.length === 0,
      errors
    }
  }

  /**
   * 规范化选项
   */
  static normalize(options: Partial<CompilerOptions>): CompilerOptions {
    return {
      ...DEFAULT_COMPILER_OPTIONS,
      ...options,
      features: {
        ...DEFAULT_COMPILER_OPTIONS.features,
        ...options.features
      },
      optimization: {
        ...DEFAULT_COMPILER_OPTIONS.optimization,
        ...options.optimization
      }
    }
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
    const newOptions = {
      ...this.options,
      ...updates,
      features: {
        ...this.options.features,
        ...updates.features
      },
      optimization: {
        ...this.options.optimization,
        ...updates.optimization
      }
    }

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
    const mergedOptions = {
      ...this.options,
      ...other.options,
      features: {
        ...this.options.features,
        ...other.options.features
      },
      optimization: {
        ...this.options.optimization,
        ...other.options.optimization
      }
    }

    return new ConfigManager(mergedOptions)
  }

  /**
   * 获取配置摘要
   */
  getSummary(): string {
    const { input, output, framework, features, optimization } = this.options
    
    const enabledFeatures = Object.entries(features)
      .filter(([, enabled]) => enabled)
      .map(([feature]) => feature)
      .join(', ')

    const enabledOptimizations = Object.entries(optimization)
      .filter(([, enabled]) => enabled)
      .map(([opt]) => opt)
      .join(', ')

    return `编译器配置摘要:
- 输入目录: ${input}
- 输出目录: ${output}
- 框架: ${framework}
- 启用特性: ${enabledFeatures}
- 启用优化: ${enabledOptimizations}`
  }
}
