/**
 * 配置生成器纯工具函数。
 */

import type { AppConfig, ComponentConfig, PageConfig, TabBarItem } from '@/types/index.js'
export {
  buildProjectConfig,
  buildSitemapConfig,
  buildTSConfig
} from './config-file-generator-utils.js'

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
