/**
 * 编译输出产物清理工具。
 */

import path from 'path'
import { getOutputPath, remove } from '@/utils/index.js'

const GENERATED_OUTPUT_EXTENSIONS = ['.js', '.json', '.wxml', '.wxss', '.js.map'] as const

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
 * 确认待删除文件仍位于输出目录内，避免异常相对路径误删输出目录外文件。
 */
function isInsideOutputRoot(filePath: string, outputRoot: string): boolean {
  const relativePath = path.relative(path.resolve(outputRoot), path.resolve(filePath))

  return relativePath === '' || (!relativePath.startsWith('..') && !path.isAbsolute(relativePath))
}
