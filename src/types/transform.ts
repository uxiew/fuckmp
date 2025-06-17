/**
 * 转换相关的类型定义
 */

// 导入 TransformContext（已在 compiler.ts 中定义）
import type { TransformContext } from './compiler.js'

/**
 * 转换结果
 */
export interface TransformResult {
  /** 是否处理成功 */
  handled: boolean
  /** 生成的代码 */
  code?: string
  /** 上下文更新 */
  contextUpdates?: Partial<TransformContext>
  /** 依赖 */
  dependencies?: string[]
  /** 错误信息 */
  errors?: string[]
  /** 警告信息 */
  warnings?: string[]
}

/**
 * 插件执行结果
 */
export interface PluginExecutionResult {
  /** 插件名称 */
  pluginName: string
  /** 执行结果 */
  result: TransformResult
  /** 执行时间 */
  executionTime: number
}

/**
 * 转换统计信息
 */
export interface TransformStats {
  /** 处理的节点数量 */
  processedNodes: number
  /** 使用的插件数量 */
  usedPlugins: number
  /** 转换耗时 */
  transformTime: number
  /** 插件执行详情 */
  pluginExecutions: Array<{
    pluginName: string
    nodeType: string
    executionTime: number
    success: boolean
  }>
}
