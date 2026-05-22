/**
 * 用户配置管理
 */

import { readFileSync, existsSync } from 'fs'
import { createRequire } from 'module'
import { resolve, dirname } from 'path'
import { Script, createContext } from 'vm'
import { logger } from '@/utils/index.js'

/**
 * 用户配置接口
 */
export interface UserConfig {
  /** 应用配置 */
  app?: {
    /** 应用 ID */
    appid?: string
    /** 应用名称 */
    name?: string
    /** 窗口配置 */
    window?: {
      navigationBarBackgroundColor?: string
      navigationBarTextStyle?: 'black' | 'white'
      navigationBarTitleText?: string
      backgroundColor?: string
      backgroundTextStyle?: 'light' | 'dark'
      enablePullDownRefresh?: boolean
      onReachBottomDistance?: number
    }
    /** 标签栏配置 */
    tabBar?: {
      color?: string
      selectedColor?: string
      backgroundColor?: string
      borderStyle?: 'black' | 'white'
      list?: Array<{
        pagePath: string
        text: string
        iconPath?: string
        selectedIconPath?: string
      }>
    }
    /** 网络超时配置 */
    networkTimeout?: {
      request?: number
      downloadFile?: number
      uploadFile?: number
      connectSocket?: number
    }
    /** 调试配置 */
    debug?: boolean
    /** 分包配置 */
    subpackages?: Array<{
      root: string
      name?: string
      pages: string[]
      independent?: boolean
    }>
  }

  /** 页面配置 */
  pages?: {
    [pagePath: string]: {
      navigationBarBackgroundColor?: string
      navigationBarTextStyle?: 'black' | 'white'
      navigationBarTitleText?: string
      backgroundColor?: string
      backgroundTextStyle?: 'light' | 'dark'
      enablePullDownRefresh?: boolean
      onReachBottomDistance?: number
      disableScroll?: boolean
      usingComponents?: Record<string, string>
    }
  }

  /** 页面标题映射配置 */
  pageTitles?: {
    [pageName: string]: string
  }

  /** 组件配置 */
  components?: {
    [componentPath: string]: {
      component?: boolean
      usingComponents?: Record<string, string>
      styleIsolation?: 'isolated' | 'apply-shared' | 'shared'
      options?: {
        multipleSlots?: boolean
        addGlobalClass?: boolean
        styleIsolation?: 'isolated' | 'apply-shared' | 'shared'
        virtualHost?: boolean
      }
    }
  }

  /** 项目配置 */
  project?: {
    description?: string
    projectname?: string
    packOptions?: {
      ignore?: Array<{
        type: 'file' | 'folder'
        value: string
      }>
    }
    setting?: {
      urlCheck?: boolean
      es6?: boolean
      enhance?: boolean
      postcss?: boolean
      preloadBackgroundData?: boolean
      minified?: boolean
      newFeature?: boolean
      coverView?: boolean
      nodeModules?: boolean
      autoAudits?: boolean
      showShadowRootInWxmlPanel?: boolean
      scopeDataCheck?: boolean
      uglifyFileName?: boolean
      checkInvalidKey?: boolean
      checkSiteMap?: boolean
      uploadWithSourceMap?: boolean
      compileHotReLoad?: boolean
      lazyloadPlaceholderEnable?: boolean
      useMultiFrameRuntime?: boolean
      useApiHook?: boolean
      useApiHostProcess?: boolean
      babelSetting?: {
        ignore?: string[]
        disablePlugins?: string[]
        outputPath?: string
      }
      enableEngineNative?: boolean
      useIsolateContext?: boolean
      userConfirmedBundleSwitch?: boolean
      packNpmManually?: boolean
      packNpmRelationList?: Array<{
        packageJsonPath: string
        miniprogramNpmDistDir: string
      }>
      minifyWXSS?: boolean
      disableUseStrict?: boolean
      minifyWXML?: boolean
      showES6CompileOption?: boolean
      useCompilerPlugins?: boolean
    }
    compileType?: 'miniprogram' | 'plugin'
    libVersion?: string
    appid?: string
    debugOptions?: {
      hidedInDevtools?: string[]
    }
    scripts?: Record<string, string>
    staticServerOptions?: {
      baseURL?: string
      servePath?: string
    }
    condition?: {
      search?: {
        list?: Array<{
          desc: string
          keyword: string
        }>
      }
      conversation?: {
        list?: Array<{
          desc: string
          service: string
        }>
      }
      game?: {
        list?: Array<{
          desc: string
          pathName: string
        }>
      }
      plugin?: {
        list?: Array<{
          desc: string
          plugin: string
          mode: string
        }>
      }
      gamePlugin?: {
        list?: Array<{
          desc: string
          plugin: string
          mode: string
        }>
      }
      miniprogram?: {
        list?: Array<{
          desc: string
          pathName: string
          query?: string
          launchMode?: 'default' | 'cold'
          scene?: number
        }>
      }
    }
  }
}

/**
 * 用户配置管理器
 */
export class UserConfigManager {
  private config: UserConfig = {}
  private configPath: string = ''

  /**
   * 加载用户配置
   */
  loadConfig(projectRoot: string): UserConfig {
    this.config = {}
    this.configPath = ''

    // 查找配置文件
    const configFiles = [
      'vue3mp.config.js',
      'vue3mp.config.ts',
      'vue3mp.config.json',
      '.vue3mprc.js',
      '.vue3mprc.ts',
      '.vue3mprc.json'
    ]

    for (const configFile of configFiles) {
      const configPath = resolve(projectRoot, configFile)
      if (existsSync(configPath)) {
        const loadedConfig = this.loadConfigFile(configPath)
        if (loadedConfig) {
          this.configPath = configPath
          this.config = loadedConfig
          logger.info(`加载用户配置: ${configFile}`)
          break
        }
      }
    }

    // 如果没有找到配置文件，使用默认配置
    if (!this.configPath) {
      logger.debug('未找到用户配置文件，使用默认配置')
      this.config = this.getDefaultConfig()
    }

    return this.config
  }

  /**
   * 获取配置
   */
  getConfig(): UserConfig {
    return this.config
  }

  /**
   * 获取应用配置
   */
  getAppConfig(): UserConfig['app'] {
    return this.config.app || {}
  }

  /**
   * 获取页面配置
   */
  getPageConfig(pagePath: string) {
    return this.config.pages?.[pagePath] || {}
  }

  /**
   * 获取组件配置
   */
  getComponentConfig(componentPath: string) {
    return this.config.components?.[componentPath] || {}
  }

  /**
   * 获取页面标题映射
   */
  getPageTitles(): UserConfig['pageTitles'] {
    return this.config.pageTitles || {}
  }

  /**
   * 获取默认配置（公共方法）
   */
  getDefaultConfigValues(): UserConfig {
    return this.getDefaultConfig()
  }

  /**
   * 获取项目配置
   */
  getProjectConfig(): UserConfig['project'] {
    return this.config.project || {}
  }

  /**
   * 加载配置文件
   */
  private loadConfigFile(configPath: string): UserConfig | null {
    try {
      if (configPath.endsWith('.json')) {
        const content = readFileSync(configPath, 'utf-8')
        return JSON.parse(content)
      }

      if (configPath.endsWith('.js')) {
        return this.loadJavaScriptConfigFile(configPath)
      }

      logger.warn(`TypeScript 配置文件暂不支持，已跳过: ${configPath}`)
      return null
    } catch (error) {
      logger.error(`加载配置文件失败: ${configPath}`, error as Error)
      return {}
    }
  }

  /**
   * 同步加载 JavaScript 用户配置。
   */
  private loadJavaScriptConfigFile(configPath: string): UserConfig {
    const content = readFileSync(configPath, 'utf-8')
    const moduleObject: { exports: unknown } = { exports: {} }
    const sandbox = {
      module: moduleObject,
      exports: moduleObject.exports,
      require: createRequire(configPath),
      __dirname: dirname(configPath),
      __filename: configPath,
      process,
      console,
      defineConfig: <T>(config: T): T => config
    }
    const script = new Script(this.normalizeJavaScriptConfigSource(content), {
      filename: configPath
    })

    script.runInContext(createContext(sandbox), { timeout: 1000 })

    return this.normalizeConfigExport(moduleObject.exports)
  }

  /**
   * 兼容简单的 ESM default export 写法。
   */
  private normalizeJavaScriptConfigSource(content: string): string {
    return content.replace(/^\s*export\s+default\s+/m, 'module.exports = ')
  }

  /**
   * 归一化 CommonJS / default export 配置对象。
   */
  private normalizeConfigExport(exported: unknown): UserConfig {
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
   * 获取默认配置
   */
  private getDefaultConfig(): UserConfig {
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
}
