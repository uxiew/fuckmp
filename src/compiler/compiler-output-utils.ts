/**
 * 编译输出产物清理工具。
 */

import path from 'path'
import type { UserConfig } from '@/config/user-config.js'
import {
  getOutputPath,
  getRelativePath,
  isPageComponent,
  normalizePath,
  remove,
  writeFile,
  type PathResolver
} from '@/utils/index.js'
import { applyUserConfigToJson } from './compiler-config-utils.js'

const GENERATED_OUTPUT_EXTENSIONS = ['.js', '.json', '.wxml', '.wxss', '.js.map'] as const

/**
 * 写入单个 Vue 文件对应的小程序生成产物时所需的上下文。
 */
export interface WriteGeneratedOutputFilesOptions {
  /** 当前输入 Vue 文件路径。 */
  inputPath: string
  /** 编译输入根目录。 */
  inputRoot: string
  /** 编译输出根目录。 */
  outputRoot: string
  /** 生成器输出结果。 */
  generateResult: {
    js: string
    json: any
    wxml: string
    wxss: string
    sourceMap?: string
  }
  /** 用户配置对象。 */
  userConfig?: UserConfig
  /** 组件路径解析器。 */
  pathResolver: PathResolver
}

/**
 * 获取 Vue 源文件对应的小程序生成产物路径列表。
 */
export function getGeneratedOutputFilePaths(
  inputPath: string,
  inputRoot: string,
  outputRoot: string
): string[] {
  const outputPath = getOutputPath(inputPath, inputRoot, outputRoot).replace(/\.vue$/, '')

  return GENERATED_OUTPUT_EXTENSIONS.map(extension => `${outputPath}${extension}`)
}

/**
 * 删除 Vue 源文件对应的小程序生成产物。
 */
export async function removeGeneratedOutputFiles(
  inputPath: string,
  inputRoot: string,
  outputRoot: string
): Promise<string[]> {
  const files = getGeneratedOutputFilePaths(inputPath, inputRoot, outputRoot)
    .filter(file => isInsideOutputRoot(file, outputRoot))

  await Promise.all(files.map(file => remove(file)))

  return files
}

/**
 * 合并页面和组件编译记录路径，用于刷新依赖项目全局状态的输出文件。
 */
export function buildCompiledFileList(
  compiledPages: Map<string, unknown>,
  compiledComponents: Map<string, unknown>
): string[] {
  return [
    ...compiledPages.keys(),
    ...compiledComponents.keys()
  ]
}

/**
 * 从编译成功文件列表中构造 app.json 需要的页面路由。
 * 包含 "index" 的页面优先排列（微信小程序 pages 首项为首页）。
 */
export function buildPageRoutesFromFiles(successFiles: string[], inputRoot: string): string[] {
  return successFiles
    .filter(file => isPageComponent(file))
    .map(file => normalizePath(getRelativePath(inputRoot, file)).replace(/\.vue$/, ''))
    .sort((a, b) => {
      const aIsIndex = a.endsWith('/index') || a === 'index'
      const bIsIndex = b.endsWith('/index') || b === 'index'
      if (aIsIndex && !bIsIndex) return -1
      if (!aIsIndex && bIsIndex) return 1
      return a.localeCompare(b)
    })
}

/**
 * 写入单个 Vue 文件生成出的 JS/JSON/WXML/WXSS/SourceMap 产物。
 */
export async function writeGeneratedOutputFiles({
  inputPath,
  inputRoot,
  outputRoot,
  generateResult,
  userConfig,
  pathResolver
}: WriteGeneratedOutputFilesOptions): Promise<void> {
  const outputPath = getOutputPath(inputPath, inputRoot, outputRoot).replace(/\.vue$/, '')
  const finalJsonConfig = applyUserConfigToJson({
    inputPath,
    defaultConfig: generateResult.json,
    inputRoot,
    ...(userConfig && { userConfig }),
    pathResolver
  })

  await writeFile(`${outputPath}.js`, generateResult.js)
  await writeFile(`${outputPath}.json`, JSON.stringify(finalJsonConfig, null, 2))
  await writeFile(`${outputPath}.wxml`, generateResult.wxml)
  await writeFile(`${outputPath}.wxss`, generateResult.wxss)

  if (generateResult.sourceMap) {
    await writeFile(`${outputPath}.js.map`, generateResult.sourceMap)
  }
}

/**
 * 确认待删除文件仍位于输出目录内，避免异常相对路径误删输出目录外文件。
 */
function isInsideOutputRoot(filePath: string, outputRoot: string): boolean {
  const relativePath = path.relative(path.resolve(outputRoot), path.resolve(filePath))

  return relativePath === '' || (!relativePath.startsWith('..') && !path.isAbsolute(relativePath))
}
