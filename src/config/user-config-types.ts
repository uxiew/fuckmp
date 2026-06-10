/**
 * 用户配置类型定义。
 */

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
