/**
 * 路径解析工具
 */

import { resolve, relative, dirname, join, isAbsolute } from 'path'
import { logger } from './logger.js'

/**
 * 路径别名配置
 */
export interface PathAliasConfig {
  [alias: string]: string
}

/**
 * 路径解析器
 */
export class PathResolver {
  private aliases: PathAliasConfig
  private projectRoot: string

  constructor(projectRoot: string, aliases: PathAliasConfig = {}) {
    this.projectRoot = resolve(projectRoot)
    this.aliases = {
      '@': this.projectRoot,
      '~': this.projectRoot,
      ...aliases
    }
    logger.debug(`路径解析器初始化: 项目根目录=${this.projectRoot}`)
    logger.debug(`别名配置:`, this.aliases)
  }

  /**
   * 解析路径别名
   */
  resolveAlias(importPath: string): string {
    logger.debug(`解析别名: ${importPath}`)
    logger.debug(`可用别名:`, this.aliases)

    // 检查是否使用了别名
    for (const [alias, realPath] of Object.entries(this.aliases)) {
      if (importPath.startsWith(alias + '/')) {
        const resolvedPath = importPath.replace(alias, realPath)
        logger.debug(`路径别名解析: ${importPath} -> ${resolvedPath}`)
        return resolvedPath
      } else if (importPath === alias) {
        logger.debug(`路径别名解析: ${importPath} -> ${realPath}`)
        return realPath
      }
    }

    // 如果是相对路径，直接返回
    if (importPath.startsWith('./') || importPath.startsWith('../')) {
      logger.debug(`相对路径，直接返回: ${importPath}`)
      return importPath
    }

    // 如果是绝对路径，直接返回
    if (isAbsolute(importPath)) {
      logger.debug(`绝对路径，直接返回: ${importPath}`)
      return importPath
    }

    // 其他情况，假设是相对于项目根目录
    const resolvedPath = join(this.projectRoot, importPath)
    logger.debug(`相对于项目根目录: ${importPath} -> ${resolvedPath}`)
    return resolvedPath
  }

  /**
   * 计算相对路径
   */
  calculateRelativePath(fromFile: string, toFile: string): string {
    // 解析别名
    const resolvedToFile = this.resolveAlias(toFile)

    // 获取源文件的目录
    const fromDir = dirname(fromFile)

    // 计算相对路径
    let relativePath = relative(fromDir, resolvedToFile)

    // 确保使用正斜杠（小程序要求）
    relativePath = relativePath.replace(/\\/g, '/')

    // 如果不是以 ./ 或 ../ 开头，添加 ./
    if (!relativePath.startsWith('./') && !relativePath.startsWith('../')) {
      relativePath = './' + relativePath
    }

    logger.debug(`计算相对路径: ${fromFile} -> ${toFile} = ${relativePath}`)
    return relativePath
  }

  /**
   * 解析组件导入路径
   */
  resolveComponentPath(fromFile: string, importPath: string): string {
    // 移除 .vue 扩展名
    const cleanImportPath = importPath.replace(/\.vue$/, '')

    logger.debug(`解析组件路径: ${fromFile} -> ${cleanImportPath}`)

    // 如果是相对路径，需要相对于源文件解析
    if (cleanImportPath.startsWith('./') || cleanImportPath.startsWith('../')) {
      const fromDir = dirname(fromFile)
      const absolutePath = resolve(fromDir, cleanImportPath)
      return this.calculateRelativePath(fromFile, absolutePath)
    }

    // 解析别名
    const resolvedPath = this.resolveAlias(cleanImportPath)
    logger.debug(`别名解析后: ${resolvedPath}`)

    // 如果解析后的路径是绝对路径，直接计算相对路径
    if (isAbsolute(resolvedPath)) {
      return this.calculateRelativePath(fromFile, resolvedPath)
    }

    // 如果解析后的路径仍然是相对路径，需要相对于项目根目录解析
    const absolutePath = resolve(this.projectRoot, resolvedPath)
    logger.debug(`转换为绝对路径: ${absolutePath}`)

    return this.calculateRelativePath(fromFile, absolutePath)
  }

  /**
   * 规范化路径
   */
  normalizePath(path: string): string {
    return path.replace(/\\/g, '/').replace(/\/+/g, '/')
  }

  /**
   * 检查路径是否为组件路径
   */
  isComponentPath(path: string): boolean {
    return path.endsWith('.vue') ||
      path.includes('/components/') ||
      path.match(/[A-Z][a-zA-Z]*$/) !== null // 大写开头的可能是组件
  }

  /**
   * 转换为 kebab-case
   */
  toKebabCase(str: string): string {
    return str
      .replace(/([A-Z])/g, '-$1')
      .toLowerCase()
      .replace(/^-/, '')
  }

  /**
   * 从文件路径提取组件名
   */
  extractComponentName(path: string): string {
    // 移除扩展名
    const withoutExt = path.replace(/\.vue$/, '')

    // 提取文件名
    const fileName = withoutExt.split('/').pop() || ''

    // 如果是 index，使用父目录名
    if (fileName === 'index') {
      const parts = withoutExt.split('/')
      return parts[parts.length - 2] || 'Component'
    }

    return fileName
  }

  /**
   * 生成小程序组件引用配置
   */
  generateUsingComponents(
    fromFile: string,
    components: Map<string, string>
  ): Record<string, string> {
    const usingComponents: Record<string, string> = {}

    components.forEach((importPath, componentName) => {
      try {
        // 计算相对路径
        const relativePath = this.resolveComponentPath(fromFile, importPath)

        // 转换组件名为 kebab-case
        const kebabName = this.toKebabCase(componentName)

        usingComponents[kebabName] = relativePath

        logger.debug(`组件引用: ${componentName} (${kebabName}) -> ${relativePath}`)
      } catch (error) {
        logger.error(`解析组件路径失败: ${componentName} -> ${importPath}`, error as Error)
        // 使用原始路径作为后备
        usingComponents[this.toKebabCase(componentName)] = importPath.replace(/\.vue$/, '')
      }
    })

    return usingComponents
  }

  /**
   * 更新别名配置
   */
  updateAliases(aliases: PathAliasConfig): void {
    this.aliases = {
      ...this.aliases,
      ...aliases
    }
  }

  /**
   * 获取当前别名配置
   */
  getAliases(): PathAliasConfig {
    return { ...this.aliases }
  }
}

/**
 * 创建默认路径解析器
 */
export function createPathResolver(projectRoot: string, aliases?: PathAliasConfig): PathResolver {
  return new PathResolver(projectRoot, aliases)
}

/**
 * 解析 TypeScript/JavaScript 路径配置
 */
export function parseTSConfigPaths(tsConfigPath: string): PathAliasConfig {
  try {
    const fs = require('fs')
    const tsConfig = JSON.parse(fs.readFileSync(tsConfigPath, 'utf-8'))
    const paths = tsConfig.compilerOptions?.paths || {}
    const baseUrl = tsConfig.compilerOptions?.baseUrl || '.'

    const aliases: PathAliasConfig = {}

    Object.entries(paths).forEach(([alias, targets]) => {
      if (Array.isArray(targets) && targets.length > 0) {
        // 移除通配符
        const cleanAlias = alias.replace(/\/\*$/, '')
        const cleanTarget = (targets[0] as string).replace(/\/\*$/, '')

        aliases[cleanAlias] = resolve(dirname(tsConfigPath), baseUrl, cleanTarget)
      }
    })

    return aliases
  } catch (error) {
    logger.warn(`解析 tsconfig.json 路径配置失败: ${tsConfigPath}`, error as Error)
    return {}
  }
}

/**
 * 解析 Vite 路径配置
 */
export function parseViteConfigPaths(viteConfigPath: string): PathAliasConfig {
  // TODO: 实现 Vite 配置解析
  // 这需要动态导入 Vite 配置文件，比较复杂
  return {}
}
