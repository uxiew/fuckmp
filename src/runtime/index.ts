/**
 * Runtime 模块入口文件
 */

export * from './reactivity.js'
export * from './lifecycle.js'
export * from './event-system.js'

import { setupReactivity, cleanupReactivity } from './reactivity.js'
import { setupLifecycle, cleanupLifecycle } from './lifecycle.js'
import { setupEventSystem, cleanupEventSystem } from './event-system.js'

/**
 * 运行时初始化
 */
export function setupRuntime(context: any, isPage: boolean = false): void {
  // 设置响应式系统
  setupReactivity(context)
  
  // 设置生命周期系统
  setupLifecycle(context, isPage)
  
  // 设置事件系统
  setupEventSystem(context)
}

/**
 * 运行时清理
 */
export function cleanupRuntime(context: any): void {
  // 清理响应式系统
  cleanupReactivity(context)
  
  // 清理生命周期系统
  cleanupLifecycle(context)
  
  // 清理事件系统
  cleanupEventSystem(context)
}
