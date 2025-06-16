/**
 * 路径处理工具
 */

import { resolve, relative, dirname, basename, extname, join, normalize, sep } from 'path'
import { fileURLToPath } from 'url'

/**
 * 规范化路径分隔符
 */
export function normalizePath(path: string): string {
  return path.replace(/\\/g, '/')
}

/**
 * 解析路径
 */
export function resolvePath(...paths: string[]): string {
  return resolve(...paths)
}

/**
 * 获取相对路径
 */
export function getRelativePath(from: string, to: string): string {
  return normalizePath(relative(from, to))
}

/**
 * 获取目录名
 */
export function getDirname(path: string): string {
  return dirname(path)
}

/**
 * 获取文件名
 */
export function getBasename(path: string, ext?: string): string {
  return basename(path, ext)
}

/**
 * 获取文件扩展名
 */
export function getExtname(path: string): string {
  return extname(path)
}

/**
 * 连接路径
 */
export function joinPath(...paths: string[]): string {
  return join(...paths)
}

/**
 * 标准化路径
 */
export function normalizePlatformPath(path: string): string {
  return normalize(path)
}

/**
 * 获取路径分隔符
 */
export function getPathSeparator(): string {
  return sep
}

/**
 * 从 import.meta.url 获取当前文件路径
 */
export function getCurrentFilePath(importMetaUrl: string): string {
  return fileURLToPath(importMetaUrl)
}

/**
 * 从 import.meta.url 获取当前目录路径
 */
export function getCurrentDirPath(importMetaUrl: string): string {
  return dirname(fileURLToPath(importMetaUrl))
}

/**
 * 检查路径是否为绝对路径
 */
export function isAbsolutePath(path: string): boolean {
  return resolve(path) === normalize(path)
}

/**
 * 检查路径是否为相对路径
 */
export function isRelativePath(path: string): boolean {
  return !isAbsolutePath(path)
}

/**
 * 将路径转换为 POSIX 格式
 */
export function toPosixPath(path: string): string {
  return path.replace(/\\/g, '/')
}

/**
 * 将路径转换为 Windows 格式
 */
export function toWindowsPath(path: string): string {
  return path.replace(/\//g, '\\')
}

/**
 * 获取文件的输出路径
 */
export function getOutputPath(
  inputPath: string,
  inputDir: string,
  outputDir: string,
  newExt?: string
): string {
  const relativePath = getRelativePath(inputDir, inputPath)
  let outputPath = resolvePath(outputDir, relativePath)

  if (newExt) {
    const ext = getExtname(outputPath)
    outputPath = outputPath.replace(new RegExp(`${ext}$`), newExt)
  }

  return outputPath
}

/**
 * 获取小程序页面路径
 */
export function getMiniprogramPagePath(filePath: string, pagesDir: string): string {
  const relativePath = getRelativePath(pagesDir, filePath)
  return normalizePath(relativePath.replace(/\.vue$/, ''))
}

/**
 * 检查是否为页面文件
 */
export function isPageFile(filePath: string): boolean {
  const normalizedPath = normalizePath(filePath)
  return normalizedPath.includes('/pages/') || normalizedPath.includes('\\pages\\')
}

/**
 * 检查是否为组件文件
 */
export function isComponentFile(filePath: string): boolean {
  const normalizedPath = normalizePath(filePath)
  return normalizedPath.includes('/components/') || normalizedPath.includes('\\components\\')
}

/**
 * 获取组件的相对路径
 */
export function getComponentRelativePath(
  componentPath: string,
  fromPath: string,
  componentsDir: string
): string {
  const componentRelative = getRelativePath(componentsDir, componentPath)
  const fromDir = getDirname(fromPath)
  const relativePath = getRelativePath(fromDir, resolvePath(componentsDir, componentRelative))

  // 移除 .vue 扩展名
  return normalizePath(relativePath.replace(/\.vue$/, ''))
}

/**
 * 解析模块路径
 */
export function resolveModulePath(modulePath: string, fromPath: string): string {
  if (modulePath.startsWith('./') || modulePath.startsWith('../')) {
    // 相对路径
    return resolvePath(getDirname(fromPath), modulePath)
  } else if (modulePath.startsWith('/')) {
    // 绝对路径
    return modulePath
  } else {
    // 模块路径
    return modulePath
  }
}

/**
 * 获取文件的目录层级
 */
export function getPathDepth(path: string): number {
  const normalizedPath = normalizePath(path)
  return normalizedPath.split('/').filter(Boolean).length
}

/**
 * 检查路径是否在指定目录下
 */
export function isPathUnder(path: string, dir: string): boolean {
  const relativePath = getRelativePath(dir, path)
  return !relativePath.startsWith('../') && !isAbsolutePath(relativePath)
}

/**
 * 获取两个路径的公共父目录
 */
export function getCommonParentDir(path1: string, path2: string): string {
  const parts1 = normalizePath(path1).split('/')
  const parts2 = normalizePath(path2).split('/')

  const commonParts: string[] = []
  const minLength = Math.min(parts1.length, parts2.length)

  for (let i = 0; i < minLength; i++) {
    const part1 = parts1[i]
    const part2 = parts2[i]
    if (part1 && part2 && part1 === part2) {
      commonParts.push(part1)
    } else {
      break
    }
  }

  return commonParts.join('/')
}
