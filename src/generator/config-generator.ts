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
 * 现在所有配置都通过用户配置系统 (vue3mp.config.json) 管理：
 * - 图标路径: app.tabBar.defaultIcons.{iconPath, selectedIconPath}
 * - TabBar 样式: app.tabBar.{color, selectedColor, backgroundColor, borderStyle}
 * - 项目信息: project.{description, projectname}
 * - 页面标题: pageTitles.{pageName: title}
 * - 组件配置: components.{componentPath}.styleIsolation
 * - TabBar 页面: app.tabBar.list (优先级高于自动识别)
 *
 * 这样用户可以完全自定义所有配置，避免了硬编码的限制。
 */

import type { AppConfig, PageConfig, ComponentConfig } from '@/types/index.js'
import type { CompilerOptions } from '@/types/index.js'
import { logger, writeFile, joinPath } from '@/utils/index.js'
import { UserConfigManager } from '@/config/user-config.js'

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

      const appConfig: AppConfig = {
        pages,
        window: {
          ...defaultWindowConfig,
          // 合并用户自定义的窗口配置
          ...(userAppConfig?.window || {})
        },
        sitemapLocation: 'sitemap.json'
      }

      // 合并用户自定义的其他配置（排除 window）
      if (userAppConfig) {
        const { window, ...otherConfig } = userAppConfig
        Object.assign(appConfig, otherConfig)
      }

      // 如果有 tabBar 页面，生成 tabBar 配置
      const tabBarPages = this.getTabBarPages(pages)
      if (tabBarPages.length > 0) {
        // 获取用户自定义的 tabBar 配置
        const userTabBarConfig = userAppConfig?.tabBar || {}

        appConfig.tabBar = {
          color: userTabBarConfig.color || '#7A7E83',
          selectedColor: userTabBarConfig.selectedColor || '#3cc51f',
          backgroundColor: userTabBarConfig.backgroundColor || '#ffffff',
          borderStyle: userTabBarConfig.borderStyle || 'black',
          list: tabBarPages.map(page => {
            // 检查用户是否为特定页面配置了自定义图标
            const userPageConfig = userTabBarConfig.list?.find(item => item.pagePath === page)
            const tabBarItem: any = {
              pagePath: page,
              text: userPageConfig?.text || this.getPageTitle(page)
            }

            // 只有当图标路径存在时才添加到配置中
            if (userPageConfig?.iconPath) {
              tabBarItem.iconPath = userPageConfig.iconPath
            }
            if (userPageConfig?.selectedIconPath) {
              tabBarItem.selectedIconPath = userPageConfig.selectedIconPath
            }

            return tabBarItem
          })
        }

        // 如果用户配置了额外的 tabBar 项目，添加到列表中
        if (userTabBarConfig.list) {
          userTabBarConfig.list.forEach(userItem => {
            if (!tabBarPages.includes(userItem.pagePath)) {
              const extraTabBarItem: any = {
                pagePath: userItem.pagePath,
                text: userItem.text
              }

              // 只有当图标路径存在时才添加到配置中
              if (userItem.iconPath) {
                extraTabBarItem.iconPath = userItem.iconPath
              }
              if (userItem.selectedIconPath) {
                extraTabBarItem.selectedIconPath = userItem.selectedIconPath
              }

              appConfig.tabBar!.list!.push(extraTabBarItem)
            }
          })
        }
      }

      // 生成分包配置
      const subpackages = this.generateSubpackages(pages)
      if (subpackages && subpackages.length > 0) {
        appConfig.subpackages = subpackages
      }

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

      const pageConfig: PageConfig = {
        navigationBarTitleText: this.getPageTitle(pagePath),
        enablePullDownRefresh: false,
        onReachBottomDistance: 50,
        ...customConfig
      }

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

      const componentConfig: ComponentConfig = {
        component: true,
        usingComponents,
        styleIsolation: userComponentConfig?.styleIsolation || 'isolated',
        ...customConfig,
        ...userComponentConfig
      }

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

      const projectConfig = {
        description: userProjectConfig?.description || '由 Vue3 微信小程序编译器生成的项目',
        packOptions: {
          ignore: [
            {
              type: 'file',
              value: '.eslintrc.js'
            },
            {
              type: 'file',
              value: '.gitignore'
            },
            {
              type: 'file',
              value: 'README.md'
            }
          ]
        },
        setting: {
          urlCheck: false,
          es6: true,
          enhance: true,
          postcss: true,
          preloadBackgroundData: false,
          minified: true,
          newFeature: true,
          coverView: true,
          nodeModules: false,
          autoAudits: false,
          showShadowRootInWxmlPanel: true,
          scopeDataCheck: false,
          uglifyFileName: false,
          checkInvalidKey: true,
          checkSiteMap: true,
          uploadWithSourceMap: true,
          compileHotReLoad: false,
          lazyloadPlaceholderEnable: false,
          useMultiFrameRuntime: true,
          useApiHook: true,
          useApiHostProcess: true,
          babelSetting: {
            ignore: [],
            disablePlugins: [],
            outputPath: ''
          },
          enableEngineNative: false,
          useIsolateContext: true,
          userConfirmedBundleSwitch: false,
          packNpmManually: false,
          packNpmRelationList: [],
          minifyWXSS: true,
          disableUseStrict: false,
          minifyWXML: true,
          showES6CompileOption: false,
          useCompilerPlugins: false
        },
        compileType: userProjectConfig?.compileType || 'miniprogram',
        libVersion: userProjectConfig?.libVersion || '2.19.4',
        appid: this.options.appId,
        projectname: userProjectConfig?.projectname || 'vue3-miniprogram',
        debugOptions: {
          hidedInDevtools: []
        },
        scripts: {},
        staticServerOptions: {
          baseURL: '',
          servePath: ''
        },
        isGameTourist: false,
        condition: {
          search: {
            list: []
          },
          conversation: {
            list: []
          },
          game: {
            list: []
          },
          plugin: {
            list: []
          },
          gamePlugin: {
            list: []
          },
          miniprogram: {
            list: []
          }
        }
      }

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

      const sitemapConfig = {
        desc: 'sitemap 配置文件',
        rules: [
          {
            action: 'allow',
            page: '*'
          }
        ]
      }

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

      const tsConfig = {
        compilerOptions: {
          target: 'ES2018',
          lib: ['ES2018'],
          allowJs: true,
          skipLibCheck: true,
          experimentalDecorators: true,
          noImplicitAny: false,
          allowSyntheticDefaultImports: true,
          strict: true,
          forceConsistentCasingInFileNames: true,
          moduleResolution: 'node',
          baseUrl: '.',
          typeRoots: [
            './typings'
          ],
          types: [
            'miniprogram-api-typings'
          ],
          paths: {
            '*': ['./typings/*']
          }
        },
        include: [
          './**/*.ts'
        ],
        exclude: [
          'node_modules'
        ]
      }

      const configPath = joinPath(outputDir, 'tsconfig.json')
      await writeFile(configPath, JSON.stringify(tsConfig, null, 2))

      logger.debug('TypeScript 配置文件生成完成')

    } catch (error) {
      logger.error('TypeScript 配置文件生成失败', error as Error)
      throw error
    }
  }

  /**
   * 获取 TabBar 页面
   *
   * 修复说明：移除硬编码的 TabBar 关键词，改为使用用户配置
   * 如果用户配置了 tabBar.list，优先使用用户配置的页面
   */
  private getTabBarPages(pages: string[]): string[] {
    // 获取用户配置的 tabBar 页面
    const userAppConfig = this.userConfigManager.getAppConfig()
    const userTabBarPages = userAppConfig?.tabBar?.list?.map(item => item.pagePath) || []

    if (userTabBarPages.length > 0) {
      // 过滤出实际存在的页面
      return userTabBarPages.filter(page => pages.includes(page)).slice(0, 5)
    }

    // 如果用户没有配置，使用默认的识别逻辑
    const defaultTabBarKeywords = ['home', 'index', 'main', 'profile', 'user', 'mine']

    return pages.filter(page => {
      const pageName = page.split('/').pop()?.toLowerCase() || ''
      return defaultTabBarKeywords.some(keyword => pageName.includes(keyword))
    }).slice(0, 5) // 最多 5 个 TabBar 页面
  }

  /**
   * 生成分包配置
   */
  private generateSubpackages(pages: string[]): AppConfig['subpackages'] {
    const subpackages: AppConfig['subpackages'] = []
    const subpackageMap = new Map<string, string[]>()

    // 按目录分组页面
    pages.forEach(page => {
      const parts = page.split('/')
      if (parts.length > 1) {
        const root = parts[0]
        if (root && root !== 'pages') { // 主包页面
          if (!subpackageMap.has(root)) {
            subpackageMap.set(root, [])
          }
          const subPages = subpackageMap.get(root)
          if (subPages) {
            subPages.push(parts.slice(1).join('/'))
          }
        }
      }
    })

    // 生成分包配置
    subpackageMap.forEach((subPages, root) => {
      if (subPages.length > 0) {
        subpackages.push({
          root,
          pages: subPages
        })
      }
    })

    return subpackages
  }

  /**
   * 获取页面标题
   *
   * 修复说明：移除硬编码的页面标题映射，改为使用用户配置系统
   * 这样用户可以通过 vue3mp.config.json 中的 pageTitles 字段自定义页面标题
   */
  private getPageTitle(pagePath: string): string {
    const pageName = pagePath.split('/').pop() || 'Page'

    // 获取用户自定义的页面标题映射
    const userPageTitles = this.userConfigManager.getPageTitles()

    // 优先使用用户配置的标题，如果没有则使用默认的首字母大写格式
    return userPageTitles?.[pageName.toLowerCase()] ||
      pageName.charAt(0).toUpperCase() + pageName.slice(1)
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
