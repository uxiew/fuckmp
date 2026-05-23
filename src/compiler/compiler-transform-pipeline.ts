/**
 * 编译器 SFC 分段解析与转换管线。
 *
 * 主编译器只负责生命周期编排；script/template/style 三段转换的细节集中在这里，
 * 便于独立测试上下文合并、模板降级信息回填与样式选项透传。
 */

import { mergeScriptTransformContext } from './compiler-context-utils.js'
import {
  transformImportedStyleFiles,
  transformVueStyleBlocks,
  type CompilerStyleParserLike,
  type CompilerStylePipelineOptions,
  type CompilerStyleTransformerLike
} from './compiler-style-utils.js'
import type { ParseResult, TransformContext } from '@/types/index.js'

/** 编译器脚本解析器所需的最小接口。 */
export interface CompilerScriptParserLike {
  /** 解析 `<script>` 或 `<script setup>` 源码。 */
  parseScript(content: string, filename: string): Promise<any>
}

/** 编译器脚本转换器所需的最小接口。 */
export interface CompilerScriptTransformerLike {
  /** 将脚本 AST 转换为小程序生成阶段可消费的结构。 */
  transformScript(parseResult: any, filename: string, isPage: boolean): Promise<any>
}

/** 编译器模板解析器所需的最小接口。 */
export interface CompilerTemplateParserLike {
  /** 解析 Vue template 源码。 */
  parseTemplate(content: string, filename: string): Promise<any>
}

/** 编译器模板转换器所需的最小接口。 */
export interface CompilerTemplateTransformerLike {
  /** 将 Vue template AST 转换为微信小程序模板结构。 */
  transformTemplate(parseResult: any, context: TransformContext): Promise<any>
}

/** SFC 分段转换所需依赖。 */
export interface CompilerTransformPipelineDependencies {
  /** 脚本解析器。 */
  scriptParser: CompilerScriptParserLike
  /** 脚本转换器。 */
  scriptTransformer: CompilerScriptTransformerLike
  /** 模板解析器。 */
  templateParser: CompilerTemplateParserLike
  /** 模板转换器。 */
  templateTransformer: CompilerTemplateTransformerLike
  /** 样式解析器。 */
  styleParser: CompilerStyleParserLike
  /** 样式转换器。 */
  styleTransformer: CompilerStyleTransformerLike
}

/** SFC 分段转换选项。 */
export type CompilerTransformPipelineOptions = CompilerStylePipelineOptions

/** SFC 分段转换结果。 */
export interface CompilerTransformPipelineResult {
  /** 脚本转换结果。 */
  script?: any
  /** 模板转换结果。 */
  template?: any
  /** 样式转换结果列表。 */
  styles: any[]
}

/**
 * 解析并转换 Vue SFC 的 script/template/style 分段。
 */
export async function parseAndTransformSfcSections(
  parseResult: ParseResult,
  context: TransformContext,
  dependencies: CompilerTransformPipelineDependencies,
  options: CompilerTransformPipelineOptions
): Promise<CompilerTransformPipelineResult> {
  const results: CompilerTransformPipelineResult = { styles: [] }

  if (parseResult.script) {
    const scriptParseResult = await dependencies.scriptParser.parseScript(
      parseResult.script.content,
      context.filename
    )
    results.script = await dependencies.scriptTransformer.transformScript(
      scriptParseResult,
      context.filename,
      context.isPage
    )

    if (results.script.context) {
      mergeScriptTransformContext(context, results.script.context)
    }
  }

  if (parseResult.template) {
    const templateParseResult = await dependencies.templateParser.parseTemplate(
      parseResult.template.content,
      context.filename
    )
    results.template = await dependencies.templateTransformer.transformTemplate(
      templateParseResult,
      context
    )

    if (results.script?.context && context.templateUnsupported) {
      results.script.context.templateUnsupported = context.templateUnsupported
    }
  }

  results.styles.push(
    ...(await transformVueStyleBlocks(parseResult.styles, context, dependencies, options)),
    ...(await transformImportedStyleFiles(context.styleImports, context, dependencies, options))
  )

  return results
}
