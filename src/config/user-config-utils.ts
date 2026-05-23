/**
 * 用户配置纯函数工具。
 */

import type { UserConfig } from './user-config-types.js'

/**
 * 兼容简单的 ESM default export 写法。
 */
export function normalizeJavaScriptConfigSource(content: string): string {
  return content.replace(/^\s*export\s+default\s+/m, 'module.exports = ')
}

/**
 * 归一化 CommonJS / default export 配置对象。
 */
export function normalizeUserConfigExport(exported: unknown): UserConfig {
  const defaultExport = (
    exported && typeof exported === 'object' && 'default' in exported
      ? (exported as { default?: unknown }).default
      : undefined
  )
  const config = defaultExport ?? exported

  if (!config || typeof config !== 'object' || Array.isArray(config)) {
    return {}
  }

  return config as UserConfig
}

/**
 * 创建默认用户配置。
 */
export function createDefaultUserConfig(): UserConfig {
  return {
    app: {
      window: {
        navigationBarBackgroundColor: '#ffffff',
        navigationBarTextStyle: 'black',
        navigationBarTitleText: 'Vue3 小程序',
        backgroundColor: '#f5f5f5',
        backgroundTextStyle: 'light',
        enablePullDownRefresh: false,
        onReachBottomDistance: 50
      },
      tabBar: {
        color: '#7A7E83',
        selectedColor: '#3cc51f',
        backgroundColor: '#ffffff',
        borderStyle: 'black'
      }
    },
    project: {
      description: 'Vue3 微信小程序项目',
      projectname: 'vue3-miniprogram',
      setting: {
        urlCheck: false,
        es6: true,
        enhance: false,
        postcss: true,
        preloadBackgroundData: false,
        minified: true,
        newFeature: false,
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
        enableEngineNative: false,
        useIsolateContext: true,
        userConfirmedBundleSwitch: false,
        packNpmManually: false,
        minifyWXSS: true,
        disableUseStrict: false,
        minifyWXML: true
      },
      compileType: 'miniprogram'
    },
    pageTitles: {
      'index': '首页',
      'home': '首页',
      'profile': '个人中心',
      'user': '用户',
      'mine': '我的',
      'setting': '设置',
      'about': '关于',
      'help': '帮助',
      'feedback': '反馈'
    }
  }
}
