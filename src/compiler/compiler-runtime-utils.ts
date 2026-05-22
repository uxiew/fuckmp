/**
 * 编译器运行时注入数据转换工具。
 */
import type { TransformContext } from '@/types/index.js'
import type { TemplateTransformResult } from '@/transformer/index.js'
import { getRelativePath } from '@/utils/index.js'

/**
 * 编译过程中为运行时注入保留的单文件数据。
 */
export interface CompiledRuntimeRecord {
  config: any
  context: TransformContext
  template?: TemplateTransformResult
}

/**
 * 将以绝对文件路径索引的编译结果转换为运行时注入所需的输出路径索引。
 */
export function buildRuntimeInjectionEntries(
  compiledRecords: Map<string, CompiledRuntimeRecord>,
  inputRoot: string
): Map<string, CompiledRuntimeRecord> {
  const entries = new Map<string, CompiledRuntimeRecord>()

  for (const [filePath, record] of compiledRecords) {
    const relativePath = getRelativePath(inputRoot, filePath).replace(/\.vue$/, '')
    const entry: CompiledRuntimeRecord = {
      config: record.config,
      context: record.context
    }
    if (record.template) {
      entry.template = record.template
    }
    entries.set(relativePath, entry)
  }

  return entries
}
