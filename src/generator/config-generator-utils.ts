/**
 * 配置生成器纯工具函数。
 */

import type { AppConfig, ComponentConfig, PageConfig, TabBarItem } from '@/types/index.js'

/**
 * 生成 app.json 配置对象。
 */
export function buildAppConfig(
  pages: string[],
  userAppConfig: any,
  defaultWindowConfig: Record<string, any>,
  pageTitles?: Record<string, string>
): AppConfig {
  const appConfig: AppConfig = {
    pages,
    window: {
      ...defaultWindowConfig,
      ...(userAppConfig?.window || {})
    },
    sitemapLocation: 'sitemap.json'
  }

  if (userAppConfig) {
    const { window, ...otherConfig } = userAppConfig
    Object.assign(appConfig, otherConfig)
  }

  const tabBarPages = selectTabBarPages(pages, userAppConfig)
  if (tabBarPages.length > 0) {
    const userTabBarConfig = userAppConfig?.tabBar || {}

    appConfig.tabBar = {
      color: userTabBarConfig.color || '#7A7E83',
      selectedColor: userTabBarConfig.selectedColor || '#3cc51f',
      backgroundColor: userTabBarConfig.backgroundColor || '#ffffff',
      borderStyle: userTabBarConfig.borderStyle || 'black',
      list: tabBarPages.map(page => buildTabBarItem(page, userTabBarConfig, pageTitles))
    }

    userTabBarConfig.list?.forEach((userItem: any) => {
      if (!tabBarPages.includes(userItem.pagePath)) {
        appConfig.tabBar!.list!.push(buildExtraTabBarItem(userItem))
      }
    })
  }

  const subpackages = buildSubpackages(pages)
  if (subpackages.length > 0) {
    appConfig.subpackages = subpackages
  }

  return appConfig
}

/**
 * 生成页面配置对象。
 */
export function buildPageConfig(
  pagePath: string,
  pageTitles?: Record<string, string>,
  customConfig?: Partial<PageConfig>
): PageConfig {
  return {
    navigationBarTitleText: getPageTitle(pagePath, pageTitles),
    enablePullDownRefresh: false,
    onReachBottomDistance: 50,
    ...customConfig
  }
}

/**
 * 生成组件配置对象。
 */
export function buildComponentConfig(
  userComponentConfig: Partial<ComponentConfig> | undefined,
  usingComponents: Record<string, string> = {},
  customConfig?: Partial<ComponentConfig>
): ComponentConfig {
  return {
    component: true,
    usingComponents,
    styleIsolation: userComponentConfig?.styleIsolation || 'isolated',
    ...customConfig,
    ...userComponentConfig
  }
}

/**
 * 生成 project.config.json 配置对象。
 */
export function buildProjectConfig(appId: string, userProjectConfig: any): Record<string, any> {
  return {
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
    appid: appId,
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
}

/**
 * 生成 sitemap.json 配置对象。
 */
export function buildSitemapConfig(): Record<string, any> {
  return {
    desc: 'sitemap 配置文件',
    rules: [
      {
        action: 'allow',
        page: '*'
      }
    ]
  }
}

/**
 * 生成小程序 TypeScript 配置对象。
 */
export function buildTSConfig(): Record<string, any> {
  return {
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
}

/**
 * 获取 TabBar 页面。
 */
export function selectTabBarPages(pages: string[], userAppConfig: any): string[] {
  const userTabBarPages = userAppConfig?.tabBar?.list?.map((item: any) => item.pagePath) || []

  if (userTabBarPages.length > 0) {
    return userTabBarPages.filter((page: string) => pages.includes(page)).slice(0, 5)
  }

  const defaultTabBarKeywords = ['home', 'index', 'main', 'profile', 'user', 'mine']

  return pages.filter(page => {
    const pageName = page.split('/').pop()?.toLowerCase() || ''
    return defaultTabBarKeywords.some(keyword => pageName.includes(keyword))
  }).slice(0, 5)
}

/**
 * 生成分包配置。
 */
export function buildSubpackages(pages: string[]): NonNullable<AppConfig['subpackages']> {
  const subpackages: NonNullable<AppConfig['subpackages']> = []
  const subpackageMap = new Map<string, string[]>()

  pages.forEach(page => {
    const parts = page.split('/')
    if (parts.length > 1) {
      const root = parts[0]
      if (root && root !== 'pages') {
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
 * 获取页面标题。
 */
export function getPageTitle(pagePath: string, pageTitles?: Record<string, string>): string {
  const pageName = pagePath.split('/').pop() || 'Page'

  return pageTitles?.[pageName.toLowerCase()] ||
    pageName.charAt(0).toUpperCase() + pageName.slice(1)
}

function buildTabBarItem(page: string, userTabBarConfig: any, pageTitles?: Record<string, string>): TabBarItem {
  const userPageConfig = userTabBarConfig.list?.find((item: any) => item.pagePath === page)
  const tabBarItem: TabBarItem = {
    pagePath: page,
    text: userPageConfig?.text || getPageTitle(page, pageTitles)
  }

  if (userPageConfig?.iconPath) {
    tabBarItem.iconPath = userPageConfig.iconPath
  }
  if (userPageConfig?.selectedIconPath) {
    tabBarItem.selectedIconPath = userPageConfig.selectedIconPath
  }

  return tabBarItem
}

function buildExtraTabBarItem(userItem: any): TabBarItem {
  const extraTabBarItem: TabBarItem = {
    pagePath: userItem.pagePath,
    text: userItem.text
  }

  if (userItem.iconPath) {
    extraTabBarItem.iconPath = userItem.iconPath
  }
  if (userItem.selectedIconPath) {
    extraTabBarItem.selectedIconPath = userItem.selectedIconPath
  }

  return extraTabBarItem
}
