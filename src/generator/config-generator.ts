/**
 * 配置文件生成器
 *
 * 修复记录 (2024-06-16):
 * 1. 移除了硬编码的图标路径 ('images/icon_default.png', 'images/icon_selected.png')
 * 2. 移除了硬编码的 TabBar 样式配置 (颜色、背景色等)
 * 3. 移除了硬编码的项目描述和项目名称
 * 4. 移除了硬编码的页面标题映射
 * 5. 移除了硬编码的组件样式隔离设置
 * 6. 移除了硬编码的 TabBar 页面识别关键词
 *
 * 现在所有配置都通过用户配置系统 (vue3mp 配置文件) 管理：
 * - 图标路径: app.tabBar.defaultIcons.{iconPath, selectedIconPath}
 * - TabBar 样式: app.tabBar.{color, selectedColor, backgroundColor, borderStyle}
 * - 项目信息: project.{description, projectname}
 * - 页面标题: pageTitles.{pageName: title}
 * - 组件配置: components.{componentPath}.styleIsolation
 * - TabBar 页面: app.tabBar.list (优先级高于自动识别)
 *
 * 这样用户可以完全自定义所有配置，避免了硬编码的限制。
 */

import type { PageConfig, ComponentConfig } from '@/types/index.js'
import type { CompilerOptions } from '@/types/index.js'
import { logger, writeFile, joinPath } from '@/utils/index.js'
import { UserConfigManager } from '@/config/user-config.js'
import {
  buildAppConfig,
  buildComponentConfig,
  buildPageConfig,
  buildProjectConfig,
  buildSitemapConfig,
  buildTSConfig
} from './config-generator-utils.js'

/**
 * 配置生成器类
 */
export class ConfigGenerator {
  private options: CompilerOptions
  private userConfigManager: UserConfigManager

  constructor(options: CompilerOptions) {
    this.options = options
    this.userConfigManager = new UserConfigManager()
    // 加载用户配置
    this.userConfigManager.loadConfig(options.input)
  }

  /**
   * 生成应用配置文件
   */
  async generateAppConfig(
    pages: string[],
    outputDir: string
  ): Promise<void> {
    try {
      logger.debug('生成应用配置文件')

      // 获取用户自定义的应用配置
      const userAppConfig = this.userConfigManager.getAppConfig()

      // 获取默认窗口配置
      const defaultWindowConfig = this.userConfigManager.getDefaultConfigValues().app?.window || {
        navigationBarBackgroundColor: '#ffffff',
        navigationBarTextStyle: 'black' as const,
        navigationBarTitleText: 'Vue3 小程序',
        backgroundColor: '#f5f5f5',
        backgroundTextStyle: 'light' as const,
        enablePullDownRefresh: false,
        onReachBottomDistance: 50
      }

      const appConfig = buildAppConfig(
        pages,
        userAppConfig,
        defaultWindowConfig,
        this.userConfigManager.getPageTitles()
      )

      const configPath = joinPath(outputDir, 'app.json')
      await writeFile(configPath, JSON.stringify(appConfig, null, 2))

      logger.debug('应用配置文件生成完成')

    } catch (error) {
      logger.error('应用配置文件生成失败', error as Error)
      throw error
    }
  }

  /**
   * 生成页面配置文件
   */
  async generatePageConfig(
    pagePath: string,
    outputDir: string,
    customConfig?: Partial<PageConfig>
  ): Promise<void> {
    try {
      logger.debug(`生成页面配置文件: ${pagePath}`)

      const pageConfig = buildPageConfig(pagePath, this.userConfigManager.getPageTitles(), customConfig)

      const configPath = joinPath(outputDir, `${pagePath}.json`)
      await writeFile(configPath, JSON.stringify(pageConfig, null, 2))

      logger.debug(`页面配置文件生成完成: ${pagePath}`)

    } catch (error) {
      logger.error(`页面配置文件生成失败: ${pagePath}`, error as Error)
      throw error
    }
  }

  /**
   * 生成组件配置文件
   */
  async generateComponentConfig(
    componentPath: string,
    outputDir: string,
    usingComponents: Record<string, string> = {},
    customConfig?: Partial<ComponentConfig>
  ): Promise<void> {
    try {
      logger.debug(`生成组件配置文件: ${componentPath}`)

      // 获取用户自定义的组件配置
      const userComponentConfig = this.userConfigManager.getComponentConfig(componentPath)

      const componentConfig = buildComponentConfig(userComponentConfig, usingComponents, customConfig)

      const configPath = joinPath(outputDir, `${componentPath}.json`)
      await writeFile(configPath, JSON.stringify(componentConfig, null, 2))

      logger.debug(`组件配置文件生成完成: ${componentPath}`)

    } catch (error) {
      logger.error(`组件配置文件生成失败: ${componentPath}`, error as Error)
      throw error
    }
  }

  /**
   * 生成项目配置文件
   */
  async generateProjectConfig(outputDir: string): Promise<void> {
    try {
      logger.debug('生成项目配置文件')

      // 获取用户自定义的项目配置
      const userProjectConfig = this.userConfigManager.getProjectConfig()

      const projectConfig = buildProjectConfig(this.options.appId, userProjectConfig)

      const configPath = joinPath(outputDir, 'project.config.json')
      await writeFile(configPath, JSON.stringify(projectConfig, null, 2))

      logger.debug('项目配置文件生成完成')

    } catch (error) {
      logger.error('项目配置文件生成失败', error as Error)
      throw error
    }
  }

  /**
   * 生成 sitemap 配置文件
   */
  async generateSitemapConfig(outputDir: string): Promise<void> {
    try {
      logger.debug('生成 sitemap 配置文件')

      const sitemapConfig = buildSitemapConfig()

      const configPath = joinPath(outputDir, 'sitemap.json')
      await writeFile(configPath, JSON.stringify(sitemapConfig, null, 2))

      logger.debug('sitemap 配置文件生成完成')

    } catch (error) {
      logger.error('sitemap 配置文件生成失败', error as Error)
      throw error
    }
  }

  /**
   * 生成 TypeScript 配置文件
   */
  async generateTSConfig(outputDir: string): Promise<void> {
    try {
      logger.debug('生成 TypeScript 配置文件')

      const tsConfig = buildTSConfig()

      const configPath = joinPath(outputDir, 'tsconfig.json')
      await writeFile(configPath, JSON.stringify(tsConfig, null, 2))

      logger.debug('TypeScript 配置文件生成完成')

    } catch (error) {
      logger.error('TypeScript 配置文件生成失败', error as Error)
      throw error
    }
  }

  /**
   * 验证配置文件
   */
  validateConfig(config: any, type: 'app' | 'page' | 'component'): { valid: boolean; errors: string[] } {
    const errors: string[] = []

    switch (type) {
      case 'app':
        if (!config.pages || !Array.isArray(config.pages) || config.pages.length === 0) {
          errors.push('app.json 必须包含 pages 数组且不能为空')
        }
        break

      case 'page':
        // 页面配置验证
        break

      case 'component':
        if (config.component !== true) {
          errors.push('组件配置必须设置 component: true')
        }
        break
    }

    return {
      valid: errors.length === 0,
      errors
    }
  }
}
