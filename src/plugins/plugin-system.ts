/**
 * 插件系统
 */

import type { CompilerOptions, TransformContext } from '@/types/index.js'
import { logger } from '@/utils/index.js'
import {
  registerPluginHooks,
  unregisterPluginHooks
} from './plugin-system-utils.js'
import { createBuiltinPlugins } from './plugin-system-builtins.js'

export {
  CachePlugin,
  CodeQualityPlugin,
  PerformancePlugin,
  createBuiltinPlugins
} from './plugin-system-builtins.js'

/**
 * 插件接口
 */
export interface Plugin {
  /** 插件名称 */
  name: string
  /** 插件版本 */
  version?: string
  /** 插件描述 */
  description?: string
  /** 插件初始化 */
  setup?: (options: CompilerOptions) => void | Promise<void>
  /** 插件清理 */
  cleanup?: () => void | Promise<void>
  /** 编译前钩子 */
  beforeCompile?: (context: TransformContext) => void | Promise<void>
  /** 编译后钩子 */
  afterCompile?: (context: TransformContext, result: any) => void | Promise<void>
  /** 文件处理钩子 */
  transformFile?: (filePath: string, content: string) => string | Promise<string>
  /** 错误处理钩子 */
  onError?: (error: Error, context: TransformContext) => void | Promise<void>
}

/**
 * 插件管理器
 */
export class PluginManager {
  private plugins: Map<string, Plugin> = new Map()
  private hooks: Map<string, Function[]> = new Map()

  /**
   * 注册插件
   */
  register(plugin: Plugin): void {
    if (this.plugins.has(plugin.name)) {
      throw new Error(`插件 ${plugin.name} 已经注册`)
    }

    this.plugins.set(plugin.name, plugin)
    logger.debug(`插件已注册: ${plugin.name}`)

    // 注册钩子
    this.registerHooks(plugin)
  }

  /**
   * 注销插件
   */
  unregister(name: string): void {
    const plugin = this.plugins.get(name)
    if (!plugin) {
      throw new Error(`插件 ${name} 未找到`)
    }

    // 清理插件
    if (plugin.cleanup) {
      plugin.cleanup()
    }

    this.plugins.delete(name)
    this.unregisterHooks(plugin)
    logger.debug(`插件已注销: ${name}`)
  }

  /**
   * 获取插件
   */
  get(name: string): Plugin | undefined {
    return this.plugins.get(name)
  }

  /**
   * 获取所有插件
   */
  getAll(): Plugin[] {
    return Array.from(this.plugins.values())
  }

  /**
   * 初始化所有插件
   */
  async setup(options: CompilerOptions): Promise<void> {
    for (const plugin of this.plugins.values()) {
      if (plugin.setup) {
        try {
          await plugin.setup(options)
          logger.debug(`插件初始化完成: ${plugin.name}`)
        } catch (error) {
          logger.error(`插件初始化失败: ${plugin.name}`, error as Error)
        }
      }
    }
  }

  /**
   * 清理所有插件
   */
  async cleanup(): Promise<void> {
    for (const plugin of this.plugins.values()) {
      if (plugin.cleanup) {
        try {
          await plugin.cleanup()
          logger.debug(`插件清理完成: ${plugin.name}`)
        } catch (error) {
          logger.error(`插件清理失败: ${plugin.name}`, error as Error)
        }
      }
    }
  }

  /**
   * 执行钩子
   */
  async executeHook(hookName: string, ...args: any[]): Promise<any[]> {
    const hooks = this.hooks.get(hookName) || []
    const results: any[] = []

    for (const hook of hooks) {
      try {
        const result = await hook(...args)
        results.push(result)
      } catch (error) {
        logger.error(`钩子执行失败: ${hookName}`, error as Error)
      }
    }

    return results
  }

  /**
   * 注册钩子
   */
  private registerHooks(plugin: Plugin): void {
    registerPluginHooks(this.hooks, plugin)
  }

  /**
   * 注销钩子
   */
  private unregisterHooks(plugin: Plugin): void {
    unregisterPluginHooks(this.hooks, plugin)
  }
}

/**
 * 创建默认插件管理器
 */
export function createDefaultPluginManager(): PluginManager {
  const manager = new PluginManager()

  // 注册内置插件
  createBuiltinPlugins().forEach(plugin => manager.register(plugin))

  return manager
}

/**
 * 插件工厂函数
 */
export function createPlugin(config: Partial<Plugin> & { name: string }): Plugin {
  return {
    version: '1.0.0',
    description: '',
    ...config
  }
}
