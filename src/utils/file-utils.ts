/**
 * 文件操作工具
 */

import { promises as fs, Stats } from 'fs'
import { dirname, resolve, relative, extname, basename, join } from 'path'
import { fileURLToPath } from 'url'
import fg from 'fast-glob'
import fse from 'fs-extra'
import { normalizePath } from './path-utils.js'

/**
 * 获取当前文件的目录路径
 */
export function getCurrentDir(importMetaUrl: string): string {
  return dirname(fileURLToPath(importMetaUrl))
}

/**
 * 检查文件是否存在
 */
export async function exists(path: string): Promise<boolean> {
  try {
    await fs.access(path)
    return true
  } catch {
    return false
  }
}

/**
 * 确保目录存在
 */
export async function ensureDir(dir: string): Promise<void> {
  await fse.ensureDir(dir)
}

/**
 * 读取文件内容
 */
export async function readFile(path: string, encoding: BufferEncoding = 'utf-8'): Promise<string> {
  return fs.readFile(path, encoding)
}

/**
 * 写入文件内容
 */
export async function writeFile(path: string, content: string): Promise<void> {
  await ensureDir(dirname(path))
  await fs.writeFile(path, content, 'utf-8')
}

/**
 * 复制文件
 */
export async function copyFile(src: string, dest: string): Promise<void> {
  await ensureDir(dirname(dest))
  await fs.copyFile(src, dest)
}

/**
 * 复制目录
 */
export async function copyDir(src: string, dest: string): Promise<void> {
  await fse.copy(src, dest)
}

/**
 * 删除文件或目录
 */
export async function remove(path: string): Promise<void> {
  await fse.remove(path)
}

/**
 * 获取文件统计信息
 */
export async function stat(path: string): Promise<Stats> {
  return fs.stat(path)
}

/**
 * 检查是否为目录
 */
export async function isDirectory(path: string): Promise<boolean> {
  try {
    const stats = await stat(path)
    return stats.isDirectory()
  } catch {
    return false
  }
}

/**
 * 检查是否为文件
 */
export async function isFile(path: string): Promise<boolean> {
  try {
    const stats = await stat(path)
    return stats.isFile()
  } catch {
    return false
  }
}

/**
 * 读取目录内容
 */
export async function readDir(path: string): Promise<string[]> {
  return fs.readdir(path)
}

/**
 * 扫描文件
 */
export async function glob(pattern: string | string[], options?: fg.Options): Promise<string[]> {
  return fg(pattern, {
    onlyFiles: true,
    ...options
  })
}

/**
 * 扫描 Vue 文件
 */
export async function scanVueFiles(dir: string): Promise<string[]> {
  const allVueFiles = await glob('**/*.vue', {
    cwd: dir,
    absolute: true
  })

  // 过滤掉以 _ 开头的文件或目录（不需要编译的文件）
  return allVueFiles.filter(filePath => {
    const fileName = basename(filePath)
    const pathParts = filePath.split(/[/\\]/)

    // 检查文件名是否以 _ 开头
    if (fileName.startsWith('_')) {
      return false
    }

    // 检查路径中是否有以 _ 开头的目录
    return !pathParts.some(part => part.startsWith('_'))
  })
}

/**
 * 获取文件扩展名
 */
export function getExtension(path: string): string {
  return extname(path)
}

// getBasename 已在 path-utils.ts 中定义，这里移除重复定义
// getRelativePath 已在 path-utils.ts 中定义，这里移除重复定义
// resolvePath 已在 path-utils.ts 中定义，这里移除重复定义
// joinPath 已在 path-utils.ts 中定义，这里移除重复定义

// normalizePath 已在 path-utils.ts 中定义，这里移除重复定义

// getOutputPath 已在 path-utils.ts 中定义，这里移除重复定义

/**
 * 判断是否为页面组件
 */
export function isPageComponent(filePath: string): boolean {
  const normalizedPath = normalizePath(filePath)
  return normalizedPath.includes('/pages/') || normalizedPath.includes('\\pages\\')
}

/**
 * 获取文件的修改时间
 */
export async function getModifiedTime(path: string): Promise<number> {
  try {
    const stats = await stat(path)
    return stats.mtime.getTime()
  } catch {
    return 0
  }
}

/**
 * 比较文件修改时间
 */
export async function isNewer(sourcePath: string, targetPath: string): Promise<boolean> {
  if (!(await exists(targetPath))) {
    return true
  }

  const sourceTime = await getModifiedTime(sourcePath)
  const targetTime = await getModifiedTime(targetPath)

  return sourceTime > targetTime
}
