/**
 * CodeGenerator 轻量代码片段工具。
 */
import type { RuntimeInjectionConfig } from '../runtime-injector'

/**
 * 代码文件头生成所需选项。
 */
export interface CodeFileHeaderOptions {
  /** 目标平台。 */
  target: string
  /** 是否启用严格模式。 */
  strict: boolean
}

/**
 * 生成编译产物文件头。
 */
export function generateCodeFileHeader(
  config: Pick<RuntimeInjectionConfig, 'runtimeVersion'>,
  options: CodeFileHeaderOptions
): string {
  const timestamp = new Date().toISOString()
  return `// 由 Vue3 微信小程序编译器自动生成
// 编译时间: ${timestamp}
// 运行时版本: ${config.runtimeVersion}
// 目标平台: ${options.target}
${options.strict ? "'use strict';" : ''}
`
}

/**
 * 根据页面/组件输出路径计算运行时注入文件相对路径。
 */
export function getRelativeRuntimePath(filePath: string): string {
  const depth = filePath.split('/').length - 1
  const prefix = depth > 0 ? '../'.repeat(depth) : './'
  return `${prefix}runtime-injection.js`
}
