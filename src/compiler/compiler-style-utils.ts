/**
 * 编译器样式处理辅助函数。
 */

import path from 'path'
import type { TransformContext } from '@/types/index.js'
import { logger, readFile } from '@/utils/index.js'

/**
 * SFC style block 的最小输入形态。
 */
export interface CompilerStyleBlock {
  /** 样式源码。 */
  content?: string
  /** 样式语言。 */
  lang?: string
  /** 是否启用 scoped 样式。 */
  scoped?: boolean
}

/** 编译器样式解析器所需的最小接口。 */
export interface CompilerStyleParserLike {
  parseStyle(content: string, lang: string | undefined, filename: string, options: any): Promise<any>
}

/** 编译器样式转换器所需的最小接口。 */
export interface CompilerStyleTransformerLike {
  transformStyle(parseResult: any, context: TransformContext, options: any): Promise<any>
}

/** 样式处理依赖。 */
export interface CompilerStylePipelineDependencies {
  /** 样式解析器。 */
  styleParser: CompilerStyleParserLike
  /** 样式转换器。 */
  styleTransformer: CompilerStyleTransformerLike
}

/** 样式处理选项。 */
export interface CompilerStylePipelineOptions {
  /** 是否压缩输出。 */
  minify: boolean
  /** 是否生成 sourcemap。 */
  sourcemap: boolean
}

/**
 * 解析并转换 Vue SFC style blocks。
 */
export async function transformVueStyleBlocks(
  styles: CompilerStyleBlock[],
  context: TransformContext,
  dependencies: CompilerStylePipelineDependencies,
  options: CompilerStylePipelineOptions
): Promise<any[]> {
  const results: any[] = []

  for (const style of styles) {
    const styleParseResult = await dependencies.styleParser.parseStyle(
      style.content || '',
      style.lang,
      context.filename,
      createVueStyleParseOptions(style, context.filename, options.sourcemap)
    )
    const styleTransformResult = await dependencies.styleTransformer.transformStyle(
      styleParseResult,
      context,
      createVueStyleTransformOptions(style, options.minify)
    )
    results.push(styleTransformResult)
  }

  return results
}

/**
 * 解析并转换从 JavaScript 导入的样式文件。
 */
export async function transformImportedStyleFiles(
  styleImports: string[] | undefined,
  context: TransformContext,
  dependencies: CompilerStylePipelineDependencies,
  options: CompilerStylePipelineOptions
): Promise<any[]> {
  const results: any[] = []

  if (!styleImports?.length) {
    return results
  }

  for (const styleImportPath of styleImports) {
    try {
      const resolvedStylePath = path.resolve(path.dirname(context.filename), styleImportPath)
      const styleContent = await readFile(resolvedStylePath)

      const styleParseResult = await dependencies.styleParser.parseStyle(
        styleContent,
        inferStyleLanguage(styleImportPath),
        resolvedStylePath,
        createImportedStyleParseOptions(resolvedStylePath, options.sourcemap)
      )

      const styleTransformResult = await dependencies.styleTransformer.transformStyle(
        styleParseResult,
        context,
        createImportedStyleTransformOptions(options.minify, options.sourcemap)
      )

      results.push(styleTransformResult)
    } catch (error) {
      logger.error(`处理导入的样式文件失败: ${styleImportPath}`, error as Error)
    }
  }

  return results
}

/**
 * 创建 Vue SFC style block 解析选项。
 */
export function createVueStyleParseOptions(
  style: CompilerStyleBlock,
  filename: string,
  sourcemap: boolean
): {
  scoped?: boolean
  sourcemap: boolean
  baseDir: string
} {
  const parseOptions = {
    sourcemap,
    baseDir: path.dirname(filename)
  }

  return withOptionalScoped(parseOptions, style)
}

/**
 * 创建 Vue SFC style block 转换选项。
 */
export function createVueStyleTransformOptions(
  style: CompilerStyleBlock,
  minify: boolean
): {
  scoped?: boolean
  minify: boolean
} {
  return withOptionalScoped({ minify }, style)
}

/**
 * 创建 JavaScript 导入样式文件的解析选项。
 */
export function createImportedStyleParseOptions(
  stylePath: string,
  sourcemap: boolean
): {
  scoped: false
  sourcemap: boolean
  baseDir: string
} {
  return {
    scoped: false,
    sourcemap,
    baseDir: path.dirname(stylePath)
  }
}

/**
 * 创建 JavaScript 导入样式文件的转换选项。
 */
export function createImportedStyleTransformOptions(
  minify: boolean,
  sourcemap: boolean
): {
  scoped: false
  minify: boolean
  sourcemap: boolean
} {
  return {
    scoped: false,
    minify,
    sourcemap
  }
}

/**
 * 根据样式文件路径推断样式语言。
 */
export function inferStyleLanguage(stylePath: string): 'scss' | 'sass' | 'css' {
  if (stylePath.endsWith('.scss')) {
    return 'scss'
  }

  if (stylePath.endsWith('.sass')) {
    return 'sass'
  }

  return 'css'
}

/**
 * 仅在 style block 显式声明 scoped 时写入 scoped 选项。
 */
function withOptionalScoped<T extends object>(
  options: T,
  style: CompilerStyleBlock
): T & { scoped?: boolean } {
  if (style.scoped === undefined) {
    return options
  }

  return {
    ...options,
    scoped: style.scoped
  }
}
