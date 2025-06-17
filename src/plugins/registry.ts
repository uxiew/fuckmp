/**
 * 插件注册器
 * 统一管理所有可用的转换插件
 */

import { PluginManager } from './manager/plugin-manager'
import type { TransformPlugin } from './base/transform-plugin'

// 核心插件
import { ReactivePlugin } from './core/reactive-plugin'

// 指令插件
import { VModelPlugin } from './directives/v-model-plugin'
import { VIfPlugin } from './directives/v-if-plugin'
import { VForPlugin } from './directives/v-for-plugin'

// 组合式API插件
import { SlotsPlugin } from './composition/slots-plugin'
import { ProvideInjectPlugin } from './composition/provide-inject-plugin'

/**
 * 插件注册器
 */
export class PluginRegistry {
  private manager: PluginManager
  private registeredPlugins: Map<string, TransformPlugin> = new Map()

  constructor() {
    this.manager = new PluginManager()
  }

  /**
   * 获取插件管理器
   */
  getManager(): PluginManager {
    return this.manager
  }

  /**
   * 注册所有默认插件
   */
  registerDefaultPlugins(): void {
    const defaultPlugins = this.getDefaultPlugins()

    for (const plugin of defaultPlugins) {
      this.registerPlugin(plugin)
    }
  }

  /**
   * 注册单个插件
   */
  registerPlugin(plugin: TransformPlugin): void {
    if (this.registeredPlugins.has(plugin.name)) {
      console.warn(`插件 ${plugin.name} 已注册，将被覆盖`)
    }

    this.registeredPlugins.set(plugin.name, plugin)
    this.manager.register(plugin)

    console.log(`✅ 注册插件: ${plugin.name} v${plugin.version}`)
  }

  /**
   * 批量注册插件
   */
  registerPlugins(plugins: TransformPlugin[]): void {
    for (const plugin of plugins) {
      this.registerPlugin(plugin)
    }
  }

  /**
   * 注册核心插件
   */
  registerCorePlugins(): void {
    const corePlugins: TransformPlugin[] = [
      new ReactivePlugin()
    ]

    this.registerPlugins(corePlugins)
    console.log(`✅ 注册核心插件: ${corePlugins.length} 个`)
  }

  /**
   * 注册指令插件
   */
  registerDirectivePlugins(): void {
    const directivePlugins: TransformPlugin[] = [
      new VModelPlugin() as TransformPlugin,
      new VIfPlugin() as TransformPlugin,
      new VForPlugin() as TransformPlugin
    ]

    this.registerPlugins(directivePlugins)
    console.log(`✅ 注册指令插件: ${directivePlugins.length} 个`)
  }

  /**
   * 注册组合式API插件
   */
  registerCompositionPlugins(): void {
    const compositionPlugins: TransformPlugin[] = [
      new ProvideInjectPlugin() as TransformPlugin,
      new SlotsPlugin() as TransformPlugin
    ]

    this.registerPlugins(compositionPlugins)
    console.log(`✅ 注册组合式API插件: ${compositionPlugins.length} 个`)
  }

  /**
   * 注册高级特性插件
   */
  registerAdvancedPlugins(): void {
    const advancedPlugins: TransformPlugin[] = [
      // 未来添加高级特性插件
      // new SuspensePlugin(),
      // new KeepAlivePlugin(),
      // new TransitionPlugin()
    ]

    this.registerPlugins(advancedPlugins)
    console.log(`✅ 注册高级特性插件: ${advancedPlugins.length} 个`)
  }

  /**
   * 获取默认插件列表
   */
  private getDefaultPlugins(): TransformPlugin[] {
    return [
      // 核心插件（高优先级）
      new ReactivePlugin() as TransformPlugin,

      // 指令插件（中优先级）
      new VModelPlugin() as TransformPlugin,
      new VIfPlugin() as TransformPlugin,
      new VForPlugin() as TransformPlugin,

      // 组合式API插件（中优先级）
      new ProvideInjectPlugin() as TransformPlugin,
      new SlotsPlugin() as TransformPlugin,

      // 高级特性插件（低优先级）
      // new SuspensePlugin(),
      // new KeepAlivePlugin()
    ]
  }

  /**
   * 获取插件统计信息
   */
  getStats(): {
    totalRegistered: number
    pluginsByCategory: Record<string, string[]>
    dependencyGraph: Record<string, string[]>
  } {
    const managerStats = this.manager.getStats()

    // 按类别分组插件
    const pluginsByCategory: Record<string, string[]> = {
      core: [],
      directives: [],
      composition: [],
      advanced: []
    }

    for (const [name] of this.registeredPlugins) {
      if (name.includes('reactive') || name.includes('computed')) {
        pluginsByCategory.core!.push(name)
      } else if (name.includes('v-') || name.includes('directive')) {
        pluginsByCategory.directives!.push(name)
      } else if (name.includes('provide') || name.includes('slot')) {
        pluginsByCategory.composition!.push(name)
      } else {
        pluginsByCategory.advanced!.push(name)
      }
    }

    return {
      totalRegistered: this.registeredPlugins.size,
      pluginsByCategory,
      dependencyGraph: managerStats.dependencyGraph
    }
  }

  /**
   * 检查插件是否已注册
   */
  isPluginRegistered(name: string): boolean {
    return this.registeredPlugins.has(name)
  }

  /**
   * 获取已注册的插件
   */
  getRegisteredPlugin(name: string): TransformPlugin | undefined {
    return this.registeredPlugins.get(name)
  }

  /**
   * 获取所有已注册的插件
   */
  getAllRegisteredPlugins(): TransformPlugin[] {
    return Array.from(this.registeredPlugins.values())
  }

  /**
   * 移除插件
   */
  unregisterPlugin(name: string): boolean {
    const plugin = this.registeredPlugins.get(name)
    if (plugin) {
      this.registeredPlugins.delete(name)
      // 注意：PluginManager 目前没有提供移除插件的方法
      // 这里可能需要重新创建 manager 或添加移除功能
      console.log(`🗑️ 移除插件: ${name}`)
      return true
    }
    return false
  }

  /**
   * 清空所有插件
   */
  clear(): void {
    this.registeredPlugins.clear()
    this.manager = new PluginManager()
    console.log('🧹 清空所有插件')
  }

  /**
   * 验证插件依赖
   */
  validateDependencies(): { valid: boolean; errors: string[] } {
    const errors: string[] = []

    for (const [name, plugin] of this.registeredPlugins) {
      for (const depName of plugin.dependencies) {
        if (!this.registeredPlugins.has(depName)) {
          errors.push(`插件 ${name} 依赖的插件 ${depName} 未注册`)
        }
      }
    }

    return {
      valid: errors.length === 0,
      errors
    }
  }

  /**
   * 打印插件信息
   */
  printInfo(): void {
    const stats = this.getStats()

    console.log('\n📦 插件注册信息:')
    console.log(`总计: ${stats.totalRegistered} 个插件`)

    for (const [category, plugins] of Object.entries(stats.pluginsByCategory)) {
      if (plugins.length > 0) {
        console.log(`${category}: ${plugins.join(', ')}`)
      }
    }

    const validation = this.validateDependencies()
    if (validation.valid) {
      console.log('✅ 所有插件依赖验证通过')
    } else {
      console.log('❌ 插件依赖验证失败:')
      for (const error of validation.errors) {
        console.log(`  - ${error}`)
      }
    }
  }
}

/**
 * 创建默认的插件注册器实例
 */
export function createDefaultPluginRegistry(): PluginRegistry {
  const registry = new PluginRegistry()
  registry.registerDefaultPlugins()
  return registry
}

/**
 * 创建自定义插件注册器
 */
export function createCustomPluginRegistry(plugins: TransformPlugin[]): PluginRegistry {
  const registry = new PluginRegistry()
  registry.registerPlugins(plugins)
  return registry
}
