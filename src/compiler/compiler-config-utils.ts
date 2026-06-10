/**
 * 编译器用户配置合并工具。
 *
 * 主编译流程只负责阶段编排；页面/组件 JSON 配置合并和组件路径解析集中在这里，
 * 避免 `compiler.ts` 继续堆积配置细节。
 */
import type { UserConfig } from '@/config/user-config.js'
import { getRelativePath, isPageComponent, logger, type PathResolver } from '@/utils/index.js'

/**
 * 应用用户配置到 JSON 文件时所需的上下文。
 */
export interface ApplyUserConfigToJsonOptions {
  /** 当前输入 Vue 文件路径。 */
  inputPath: string
  /** 生成器产出的默认 JSON 配置。 */
  defaultConfig: any
  /** 编译输入根目录。 */
  inputRoot: string
  /** 用户配置对象。 */
  userConfig?: UserConfig
  /** 组件路径解析器。 */
  pathResolver: PathResolver
}

/**
 * 将用户页面/组件配置合并到生成器默认 JSON 配置，并处理 usingComponents 路径。
 */
export function applyUserConfigToJson({
  inputPath,
  defaultConfig,
  inputRoot,
  userConfig,
  pathResolver,
}: ApplyUserConfigToJsonOptions): any {
  const relativePath = getRelativePath(inputRoot, inputPath).replace(/\.vue$/, '')

  logger.debug(`应用用户配置: ${inputPath} -> ${relativePath}`)

  if (!userConfig) {
    logger.debug('没有用户配置')
    return processComponentPaths(defaultConfig, inputPath, pathResolver)
  }

  let finalConfig = defaultConfig

  if (isPageComponent(inputPath)) {
    const pageConfig = userConfig.pages?.[relativePath]
    logger.debug(`页面配置查找: ${relativePath}`, pageConfig ? '找到' : '未找到')
    if (pageConfig) {
      finalConfig = { ...defaultConfig, ...pageConfig }
    }
  } else {
    const componentConfig = userConfig.components?.[relativePath]
    logger.debug(`组件配置查找: ${relativePath}`, componentConfig ? '找到' : '未找到')
    logger.debug('可用的组件配置键:', Object.keys(userConfig.components || {}))
    if (componentConfig) {
      logger.debug('默认配置:', defaultConfig)
      logger.debug('用户配置:', componentConfig)
      finalConfig = { ...defaultConfig, ...componentConfig }
      logger.debug('合并后配置:', finalConfig)
    }
  }

  return processComponentPaths(finalConfig, inputPath, pathResolver)
}

/**
 * 处理组件路径，将别名路径转换为相对路径。
 */
export function processComponentPaths(
  config: any,
  fromFile: string,
  pathResolver: PathResolver
): any {
  if (!config.usingComponents) {
    return config
  }

  const processedConfig = { ...config }
  const processedComponents: Record<string, string> = {}

  logger.debug(`处理组件路径，源文件: ${fromFile}`)
  logger.debug(`原始组件配置:`, config.usingComponents)

  Object.entries(config.usingComponents).forEach(([name, path]) => {
    try {
      let actualPath = path as string

      if (
        !actualPath.endsWith('.vue') &&
        !actualPath.endsWith('.js') &&
        !actualPath.endsWith('.ts')
      ) {
        actualPath = actualPath + '.vue'
      }

      if (
        !actualPath.includes('/') &&
        !actualPath.startsWith('@') &&
        !actualPath.startsWith('./') &&
        !actualPath.startsWith('../')
      ) {
        actualPath = `@/components/${actualPath}`
        logger.debug(`推断组件路径: ${name} -> ${actualPath}`)
      }

      const resolvedPath = pathResolver.resolveComponentPath(fromFile, actualPath)
      processedComponents[name] = resolvedPath
      logger.debug(`组件路径解析: ${name}: ${path} -> ${actualPath} -> ${resolvedPath}`)
    } catch (error) {
      logger.error(`组件路径解析失败: ${name}: ${path}`, error as Error)
      processedComponents[name] = path as string
    }
  })

  processedConfig.usingComponents = processedComponents
  return processedConfig
}
