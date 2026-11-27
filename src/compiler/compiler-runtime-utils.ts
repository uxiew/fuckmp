/**
 * 编译器运行时注入数据转换工具。
 */
import type { TransformContext } from '@/types/index.js'
import type { TemplateTransformResult } from '@/transformer/index.js'
import { getRelativePath, isAppComponent } from '@/utils/index.js'

/**
 * 编译过程中为运行时注入保留的单文件数据。
 */
export interface CompiledRuntimeRecord {
  config: any
  context: TransformContext
  template?: TemplateTransformResult
}

/**
 * 编译记录收集参数。
 */
export interface CollectCompiledRuntimeRecordOptions {
  /** 当前编译文件路径。 */
  filePath: string
  /** 当前转换上下文。 */
  context: TransformContext
  /** 生成结果，至少包含 JSON 配置。 */
  generateResult: { json: any }
  /** 模板转换结果。 */
  template?: TemplateTransformResult
  /** 应用入口的全局 WXSS。 */
  appStyles?: string
  /** 当前 app 配置记录。 */
  currentAppConfig: any
  /** 页面编译记录集合。 */
  compiledPages: Map<string, CompiledRuntimeRecord>
  /** 组件编译记录集合。 */
  compiledComponents: Map<string, CompiledRuntimeRecord>
}

/**
 * 将单文件编译结果收集到运行时注入所需的 app/page/component 状态中。
 */
export function collectCompiledRuntimeRecord(options: CollectCompiledRuntimeRecordOptions): any {
  const record = createCompiledRuntimeRecord(options.generateResult, options.context, options.template)

  options.compiledPages.delete(options.filePath)
  options.compiledComponents.delete(options.filePath)

  if (isAppComponent(options.filePath)) {
    return { ...record, appStyles: options.appStyles ?? '' }
  }

  if (options.context.isPage) {
    options.compiledPages.set(options.filePath, record)
    return options.currentAppConfig
  }

  options.compiledComponents.set(options.filePath, record)
  return options.currentAppConfig
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

/**
 * 创建单文件运行时编译记录，避免可选字段写入 undefined。
 */
function createCompiledRuntimeRecord(
  generateResult: { json: any },
  context: TransformContext,
  template?: TemplateTransformResult
): CompiledRuntimeRecord {
  const record: CompiledRuntimeRecord = {
    config: generateResult.json,
    context
  }

  if (template) {
    record.template = template
  }

  return record
}
