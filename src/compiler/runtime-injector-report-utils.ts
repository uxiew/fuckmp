import type { BundleResult } from './runtime-bundler.js'
import type { RuntimeInjectionConfig, Vue3FeatureUsage } from './runtime-injector.js'
import { countUsedRuntimeFeatures } from './runtime-injector-usage-utils.js'

/**
 * 运行时注入报告所需的最小生成文件信息。
 */
export interface RuntimeInjectionReportFile {
  /** 生成文件内容。 */
  content: string
  /** 是否为运行时文件。 */
  isRuntime?: boolean
}

/**
 * 按 RuntimeInjector 旧日志顺序收集已使用的 Vue3 特性名称。
 */
export function getUsedRuntimeFeatureNames(usage: Vue3FeatureUsage): string[] {
  const usedFeatures: string[] = []

  Object.entries(usage).forEach(([category, features]) => {
    Object.entries(features).forEach(([feature, used]) => {
      if (used) {
        usedFeatures.push(`${category}.${feature}`)
      }
    })
  })

  return usedFeatures
}

/**
 * 统计生成文件总代码大小。
 */
export function getGeneratedFilesTotalSize(files: RuntimeInjectionReportFile[]): number {
  return files.reduce((sum, file) => sum + file.content.length, 0)
}

/**
 * 统计生成文件中的运行时文件数量。
 */
export function getRuntimeGeneratedFileCount(files: RuntimeInjectionReportFile[]): number {
  return files.filter(file => file.isRuntime).length
}

/**
 * 构造运行时注入报告行，供 RuntimeInjector 统一输出。
 */
export function buildRuntimeInjectionReportLines(
  config: Pick<RuntimeInjectionConfig, 'minify'>,
  featureUsage: Vue3FeatureUsage,
  bundleResult: Pick<BundleResult, 'modules' | 'totalSize' | 'minifiedSize'>,
  generatedFiles: RuntimeInjectionReportFile[]
): string[] {
  const usedFeatures = countUsedRuntimeFeatures(featureUsage)
  const totalSize = getGeneratedFilesTotalSize(generatedFiles)
  const runtimeFiles = getRuntimeGeneratedFileCount(generatedFiles)
  const lines = [
    '=== 运行时注入报告 ===',
    `使用的Vue3特性: ${usedFeatures} 个`,
    `包含的运行时模块: ${bundleResult.modules.join(', ')}`,
    `运行时库大小: ${bundleResult.totalSize} 字节`
  ]

  if (config.minify) {
    lines.push(`压缩后大小: ${bundleResult.minifiedSize} 字节`)
  }

  lines.push(
    `生成的文件: ${generatedFiles.length} 个`,
    `运行时文件: ${runtimeFiles} 个`,
    `总代码大小: ${totalSize} 字节`,
    '========================'
  )

  return lines
}
