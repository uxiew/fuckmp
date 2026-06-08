/**
 * 项目静态资源输出工具。
 */

import path from 'path'
import { copyDir, isDirectory, logger, remove } from '@/utils/index.js'

/** 默认复制到小程序根目录的静态资源目录。 */
export const DEFAULT_STATIC_ASSET_DIRECTORIES = ['images', 'static'] as const

/** 静态资源复制配置。 */
export interface CopyStaticAssetDirectoriesOptions {
  /** 编译输入根目录。 */
  inputRoot: string
  /** 编译输出根目录。 */
  outputRoot: string
  /** 需要按根目录名称复制的静态资源目录。 */
  directories?: readonly string[]
}

/**
 * 复制根级静态资源目录到输出目录，确保 app.json 图标和运行时资源可被 DevTools 解析。
 */
export async function copyStaticAssetDirectories(
  options: CopyStaticAssetDirectoriesOptions
): Promise<string[]> {
  const copiedDirectories: string[] = []
  const directories = options.directories ?? DEFAULT_STATIC_ASSET_DIRECTORIES

  for (const directory of directories) {
    if (!isRootStaticAssetDirectoryName(directory)) {
      logger.warn(`跳过非法静态资源目录名: ${directory}`)
      continue
    }

    const source = path.join(options.inputRoot, directory)
    const target = path.join(options.outputRoot, directory)

    if (!(await isDirectory(source))) {
      continue
    }

    if (!canSafelyCopyDirectory(source, target)) {
      logger.warn(`跳过可能导致递归或误删的静态资源复制: ${source} -> ${target}`)
      continue
    }

    await remove(target)
    await copyDir(source, target)
    copiedDirectories.push(directory)
  }

  if (copiedDirectories.length > 0) {
    logger.debug(`静态资源复制完成: ${copiedDirectories.join(', ')}`)
  }

  return copiedDirectories
}

/**
 * 只接受输入根目录下一级目录名，避免相对路径逃逸或复制隐藏目录。
 */
function isRootStaticAssetDirectoryName(directory: string): boolean {
  return directory === path.basename(directory) && !directory.startsWith('.') && directory.length > 0
}

/**
 * 避免 source/target 相同或相互嵌套时执行 remove/copy，降低 API 误用风险。
 */
function canSafelyCopyDirectory(source: string, target: string): boolean {
  const resolvedSource = path.resolve(source)
  const resolvedTarget = path.resolve(target)

  return resolvedSource !== resolvedTarget
    && !isPathInside(resolvedTarget, resolvedSource)
    && !isPathInside(resolvedSource, resolvedTarget)
}

function isPathInside(filePath: string, directory: string): boolean {
  const relativePath = path.relative(directory, filePath)

  return relativePath !== '' && !relativePath.startsWith('..') && !path.isAbsolute(relativePath)
}
