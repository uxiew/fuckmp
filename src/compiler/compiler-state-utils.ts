/**
 * 编译器状态与报告纯函数工具。
 */

export interface CompileFileStat {
  size: number
  time: number
}

export interface CompileCacheEntry<T = any> {
  hash: string
  result: T
  timestamp: number
}

export type CompileCacheMissReason = 'missing' | 'hash' | 'expired'

export interface CompileErrorEntry {
  file: string
  error: Error
  timestamp: number
}

export interface RemovedCompilationState {
  appConfig: any
  shouldRemoveGeneratedOutputs: boolean
}

/**
 * 获取平均文件大小。
 */
export function getAverageCompileFileSize(fileStats: Map<string, CompileFileStat>): number {
  if (fileStats.size === 0) return 0

  const totalSize = Array.from(fileStats.values())
    .reduce((sum, stat) => sum + stat.size, 0)

  return Math.round(totalSize / fileStats.size)
}

/**
 * 重置编译器持有的项目级状态，并返回新的 appConfig。
 */
export function resetCompilationState(
  sourceFiles: Map<string, string>,
  compiledPages: Map<string, any>,
  compiledComponents: Map<string, any>
): any {
  sourceFiles.clear()
  compiledPages.clear()
  compiledComponents.clear()
  return {}
}

/**
 * 从编译器项目级状态中移除源文件，并返回后续输出清理决策。
 */
export function removeFileFromCompilationState(
  sourceFiles: Map<string, string>,
  compiledPages: Map<string, any>,
  compiledComponents: Map<string, any>,
  appConfig: any,
  filePath: string,
  isAppFile: boolean
): RemovedCompilationState {
  sourceFiles.delete(filePath)
  compiledPages.delete(filePath)
  compiledComponents.delete(filePath)

  return {
    appConfig: isAppFile ? {} : appConfig,
    shouldRemoveGeneratedOutputs: !isAppFile
  }
}

/**
 * 获取编译耗时最慢的文件。
 */
export function getSlowestCompileFile(fileStats: Map<string, CompileFileStat>): { file: string; time: number } | null {
  if (fileStats.size === 0) return null

  let slowestFile = ''
  let slowestTime = 0

  fileStats.forEach((stat, file) => {
    if (stat.time > slowestTime) {
      slowestTime = stat.time
      slowestFile = file
    }
  })

  return { file: slowestFile, time: slowestTime }
}

/**
 * 生成编译统计报告。
 */
export function createCompileStatsReport(totalTime: number, fileStats: Map<string, CompileFileStat>): string {
  const fileCount = fileStats.size
  const averageSize = getAverageCompileFileSize(fileStats)
  const slowestFile = getSlowestCompileFile(fileStats)

  return `编译统计报告:
- 总耗时: ${totalTime}ms
- 文件数量: ${fileCount}
- 平均文件大小: ${averageSize} bytes
- 最慢文件: ${slowestFile?.file || 'N/A'} (${slowestFile?.time || 0}ms)
- 平均编译速度: ${fileCount > 0 ? Math.round(totalTime / fileCount) : 0}ms/file`
}

/**
 * 判断缓存条目未命中的原因。
 */
export function getCompileCacheMissReason<T>(
  cached: CompileCacheEntry<T> | undefined,
  contentHash: string,
  now: number,
  maxAge: number
): CompileCacheMissReason | null {
  if (!cached) return 'missing'
  if (cached.hash !== contentHash) return 'hash'
  if (now - cached.timestamp > maxAge) return 'expired'
  return null
}

/**
 * 按文件收集编译错误。
 */
export function collectCompileErrorsByFile(errors: CompileErrorEntry[]): Map<string, Error[]> {
  const errorsByFile = new Map<string, Error[]>()

  errors.forEach(({ file, error }) => {
    if (!errorsByFile.has(file)) {
      errorsByFile.set(file, [])
    }
    errorsByFile.get(file)!.push(error)
  })

  return errorsByFile
}

/**
 * 生成编译错误报告。
 */
export function generateCompileErrorReport(errors: CompileErrorEntry[]): string {
  if (errors.length === 0) {
    return '没有编译错误'
  }

  const errorsByFile = collectCompileErrorsByFile(errors)
  const reports: string[] = []

  errorsByFile.forEach((fileErrors, file) => {
    reports.push(`文件: ${file}`)
    fileErrors.forEach((error, index) => {
      reports.push(`  ${index + 1}. ${error.message}`)
    })
  })

  return `编译错误报告 (${errors.length} 个错误):\n${reports.join('\n')}`
}

/**
 * 生成性能测量报告。
 */
export function generatePerformanceMeasureReport(measures: Map<string, number>): string {
  if (measures.size === 0) {
    return '没有性能数据'
  }

  const reports: string[] = ['性能监控报告:']

  measures.forEach((duration, name) => {
    reports.push(`- ${name}: ${duration}ms`)
  })

  return reports.join('\n')
}
