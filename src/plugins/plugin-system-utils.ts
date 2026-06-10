/**
 * 插件系统纯函数工具。
 */

import type { Plugin } from './plugin-system.js'

/** 插件问题记录。 */
export interface PluginQualityIssue {
  file: string
  type: string
  message: string
}

/** 插件钩子方法名。 */
export const PLUGIN_HOOK_METHODS = [
  'beforeCompile',
  'afterCompile',
  'transformFile',
  'onError'
] as const

/** 注册插件钩子。 */
export function registerPluginHooks(hooks: Map<string, Function[]>, plugin: Plugin): void {
  PLUGIN_HOOK_METHODS.forEach(method => {
    if (plugin[method]) {
      if (!hooks.has(method)) {
        hooks.set(method, [])
      }
      hooks.get(method)!.push(plugin[method]!.bind(plugin))
    }
  })
}

/** 注销插件钩子。 */
export function unregisterPluginHooks(hooksMap: Map<string, Function[]>, plugin: Plugin): void {
  hooksMap.forEach((hooks, hookName) => {
    hooksMap.set(hookName, hooks.filter(hook =>
      !hook.toString().includes(plugin.name)
    ))
  })
}

/** 收集代码质量问题。 */
export function collectCodeQualityIssues(filePath: string, content: string): PluginQualityIssue[] {
  const issues: PluginQualityIssue[] = []

  // 检查文件大小
  if (content.length > 10000) {
    issues.push({
      file: filePath,
      type: 'warning',
      message: '文件过大，建议拆分'
    })
  }

  // 检查 TODO 注释
  const todoMatches = content.match(/\/\/\s*TODO/gi)
  if (todoMatches && todoMatches.length > 5) {
    issues.push({
      file: filePath,
      type: 'info',
      message: `发现 ${todoMatches.length} 个 TODO 注释`
    })
  }

  // 检查 console.log
  const consoleMatches = content.match(/console\.log/g)
  if (consoleMatches && consoleMatches.length > 0) {
    issues.push({
      file: filePath,
      type: 'warning',
      message: `发现 ${consoleMatches.length} 个 console.log，建议移除`
    })
  }

  // 检查长行
  const lines = content.split('\n')
  lines.forEach((line, index) => {
    if (line.length > 120) {
      issues.push({
        file: filePath,
        type: 'warning',
        message: `第 ${index + 1} 行过长 (${line.length} 字符)`
      })
    }
  })

  return issues
}

/** 按类型分组代码质量问题。 */
export function groupIssuesByType<T extends { type: string }>(issues: T[]): Record<string, T[]> {
  return issues.reduce((groups, issue) => {
    const group = groups[issue.type] ?? (groups[issue.type] = [])
    group.push(issue)
    return groups
  }, {} as Record<string, T[]>)
}

/** 创建编译耗时摘要。 */
export function createCompileMetricsSummary(compileTimes: number[]): Record<string, any> {
  return {
    totalFiles: compileTimes.length,
    averageTime: compileTimes.length > 0
      ? compileTimes.reduce((a, b) => a + b, 0) / compileTimes.length
      : 0,
    maxTime: compileTimes.length > 0 ? Math.max(...compileTimes) : 0,
    minTime: compileTimes.length > 0 ? Math.min(...compileTimes) : 0
  }
}

/** 判断缓存是否过期。 */
export function isCacheExpired(timestamp: number, maxAge: number, now = Date.now()): boolean {
  return now - timestamp > maxAge
}

/** 生成缓存内容 hash。 */
export function createCacheEntryHash(content: string): string {
  let hash = 0
  for (let i = 0; i < content.length; i++) {
    const char = content.charCodeAt(i)
    hash = ((hash << 5) - hash) + char
    hash = hash & hash
  }
  return Math.abs(hash).toString(36)
}
