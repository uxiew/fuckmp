/**
 * 插件管理器
 * 负责插件的注册、依赖解析和执行调度
 */

import type { TransformPlugin, TransformResult } from '../base/transform-plugin'
import type { ASTNode } from '../../types/ast'
import type { TransformContext } from '../../types/compiler'
import { logger } from '@/utils/logger'

/**
 * 插件执行结果
 */
export interface PluginExecutionResult {
  /** 插件名称 */
  pluginName: string
  /** 执行结果 */
  result: TransformResult
  /** 执行时间（毫秒） */
  executionTime: number
}

/**
 * 插件管理器
 */
export class PluginManager {
  private plugins: Map<string, TransformPlugin> = new Map()
  private sortedPlugins: TransformPlugin[] = []
  private initialized = false

  /**
   * 注册插件
   */
  register(plugin: TransformPlugin): void {
    if (this.plugins.has(plugin.name)) {
      logger.warn(`插件 ${plugin.name} 已存在，将被覆盖`)
    }

    this.plugins.set(plugin.name, plugin)
    this.sortedPlugins = []
    this.initialized = false

    logger.debug(`注册插件: ${plugin.name} v${plugin.version}`)
  }

  /**
   * 批量注册插件
   */
  registerAll(plugins: TransformPlugin[]): void {
    for (const plugin of plugins) {
      this.register(plugin)
    }
  }

  /**
   * 获取插件
   */
  getPlugin(name: string): TransformPlugin | undefined {
    return this.plugins.get(name)
  }

  /**
   * 获取所有插件
   */
  getAllPlugins(): TransformPlugin[] {
    return Array.from(this.plugins.values())
  }

  /**
   * 初始化所有插件
   */
  async initialize(context: TransformContext): Promise<void> {
    if (this.initialized) {
      return
    }

    // 解析依赖并排序
    this.resolveDependencies()

    // 初始化插件
    for (const plugin of this.sortedPlugins) {
      if (plugin.initialize) {
        try {
          await plugin.initialize(context)
          logger.debug(`插件 ${plugin.name} 初始化完成`)
        } catch (error) {
          logger.error(`插件 ${plugin.name} 初始化失败:`, error instanceof Error ? error : new Error(String(error)))
          throw new Error(`插件初始化失败: ${plugin.name}`)
        }
      }
    }

    this.initialized = true
    logger.info(`插件管理器初始化完成，共加载 ${this.sortedPlugins.length} 个插件`)
  }

  /**
   * 清理所有插件
   */
  async cleanup(): Promise<void> {
    for (const plugin of this.sortedPlugins.reverse()) {
      if (plugin.cleanup) {
        try {
          await plugin.cleanup()
          logger.debug(`插件 ${plugin.name} 清理完成`)
        } catch (error) {
          logger.error(`插件 ${plugin.name} 清理失败:`, error instanceof Error ? error : new Error(String(error)))
        }
      }
    }

    this.initialized = false
    logger.info('插件管理器清理完成')
  }

  /**
   * 转换节点
   */
  async transform(node: ASTNode, context: TransformContext): Promise<PluginExecutionResult[]> {
    if (!this.initialized) {
      throw new Error('插件管理器未初始化，请先调用 initialize()')
    }

    const results: PluginExecutionResult[] = []

    for (const plugin of this.sortedPlugins) {
      if (plugin.supports(node, context)) {
        const startTime = Date.now()

        try {
          const result = await plugin.transform(node, context)
          const executionTime = Date.now() - startTime

          results.push({
            pluginName: plugin.name,
            result,
            executionTime
          })

          // 如果插件处理了节点，更新上下文
          if (result.handled && result.contextUpdates) {
            Object.assign(context, result.contextUpdates)
          }

          // 记录警告和错误
          if (result.warnings?.length) {
            for (const warning of result.warnings) {
              logger.warn(`[${plugin.name}] ${warning}`)
            }
          }

          if (result.errors?.length) {
            for (const error of result.errors) {
              logger.error(`[${plugin.name}] ${error}`)
            }
          }

          logger.debug(`插件 ${plugin.name} 处理完成，耗时 ${executionTime}ms`)

        } catch (error) {
          const executionTime = Date.now() - startTime

          results.push({
            pluginName: plugin.name,
            result: {
              handled: false,
              errors: [`插件执行异常: ${error instanceof Error ? error.message : String(error)}`],
              warnings: []
            },
            executionTime
          })

          logger.error(`插件 ${plugin.name} 执行异常:`, error instanceof Error ? error : new Error(String(error)))
        }
      }
    }

    return results
  }

  /**
   * 查找能处理指定节点的插件
   */
  findSupportingPlugins(node: ASTNode, context: TransformContext): TransformPlugin[] {
    return this.sortedPlugins.filter(plugin => plugin.supports(node, context))
  }

  /**
   * 获取插件统计信息
   */
  getStats(): {
    totalPlugins: number
    pluginsByPriority: { name: string; priority: number }[]
    dependencyGraph: Record<string, string[]>
  } {
    return {
      totalPlugins: this.plugins.size,
      pluginsByPriority: this.sortedPlugins.map(p => ({
        name: p.name,
        priority: p.priority
      })),
      dependencyGraph: Object.fromEntries(
        Array.from(this.plugins.values()).map(p => [p.name, p.dependencies])
      )
    }
  }

  /**
   * 解析依赖并排序插件
   */
  private resolveDependencies(): void {
    const plugins = Array.from(this.plugins.values())
    const resolved: TransformPlugin[] = []
    const resolving: Set<string> = new Set()

    const resolve = (plugin: TransformPlugin): void => {
      if (resolved.includes(plugin)) {
        return
      }

      if (resolving.has(plugin.name)) {
        throw new Error(`检测到循环依赖: ${plugin.name}`)
      }

      resolving.add(plugin.name)

      // 先解析依赖
      for (const depName of plugin.dependencies) {
        const dep = this.plugins.get(depName)
        if (!dep) {
          throw new Error(`插件 ${plugin.name} 依赖的插件 ${depName} 不存在`)
        }
        resolve(dep)
      }

      resolving.delete(plugin.name)
      resolved.push(plugin)
    }

    // 解析所有插件
    for (const plugin of plugins) {
      resolve(plugin)
    }

    // 按优先级排序（优先级高的先执行）
    this.sortedPlugins = resolved.sort((a, b) => b.priority - a.priority)

    logger.debug('插件依赖解析完成:', {
      order: this.sortedPlugins.map(p => p.name),
      priorities: this.sortedPlugins.map(p => ({ name: p.name, priority: p.priority }))
    })
  }

  /**
   * 验证插件兼容性
   */
  private validateCompatibility(plugin: TransformPlugin): void {
    // 检查Vue版本兼容性
    const supportedVersions = plugin.supportedVueVersions
    if (!supportedVersions.includes('3.x')) {
      logger.warn(`插件 ${plugin.name} 可能不支持 Vue 3.x`)
    }

    // 检查插件版本格式
    const versionRegex = /^\d+\.\d+\.\d+$/
    if (!versionRegex.test(plugin.version)) {
      logger.warn(`插件 ${plugin.name} 版本格式不正确: ${plugin.version}`)
    }
  }
}
