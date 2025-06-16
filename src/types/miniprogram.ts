/**
 * 微信小程序相关类型定义
 */

/**
 * 小程序应用配置
 */
export interface AppConfig {
  /** 页面路径列表 */
  pages: string[]
  /** 全局的默认窗口表现 */
  window?: WindowConfig
  /** 底部 tab 栏的表现 */
  tabBar?: TabBarConfig
  /** 网络超时时间 */
  networkTimeout?: NetworkTimeoutConfig
  /** 是否开启 debug 模式 */
  debug?: boolean
  /** 分包结构配置 */
  subpackages?: SubPackageConfig[]
  /** Worker 代码放置的目录 */
  workers?: string
  /** 申请的微信开放接口 */
  requiredBackgroundModes?: string[]
  /** 使用到的插件 */
  plugins?: Record<string, PluginConfig>
  /** 预加载 */
  preloadRule?: Record<string, PreloadRuleConfig>
  /** 小程序接口权限相关设置 */
  permission?: PermissionConfig
  /** 指明 sitemap.json 的位置 */
  sitemapLocation: string
}

/**
 * 窗口配置
 */
export interface WindowConfig {
  /** 导航栏背景颜色 */
  navigationBarBackgroundColor?: string
  /** 导航栏标题颜色 */
  navigationBarTextStyle?: 'black' | 'white'
  /** 导航栏标题文字内容 */
  navigationBarTitleText?: string
  /** 窗口的背景色 */
  backgroundColor?: string
  /** 下拉 loading 的样式 */
  backgroundTextStyle?: 'dark' | 'light'
  /** 是否开启全局的下拉刷新 */
  enablePullDownRefresh?: boolean
  /** 页面上拉触底事件触发时距页面底部距离 */
  onReachBottomDistance?: number
  /** 屏幕旋转设置 */
  pageOrientation?: 'auto' | 'portrait' | 'landscape'
}

/**
 * TabBar 配置
 */
export interface TabBarConfig {
  /** tab 上的文字默认颜色 */
  color: string
  /** tab 上的文字选中时的颜色 */
  selectedColor: string
  /** tab 的背景色 */
  backgroundColor: string
  /** tabbar上边框的颜色 */
  borderStyle?: 'black' | 'white'
  /** tabBar的位置 */
  position?: 'bottom' | 'top'
  /** tab 的列表 */
  list: TabBarItem[]
}

/**
 * TabBar 项目
 */
export interface TabBarItem {
  /** 页面路径 */
  pagePath: string
  /** tab 上按钮文字 */
  text: string
  /** 图片路径 */
  iconPath?: string
  /** 选中时的图片路径 */
  selectedIconPath?: string
}

/**
 * 网络超时配置
 */
export interface NetworkTimeoutConfig {
  /** wx.request 的超时时间 */
  request?: number
  /** wx.connectSocket 的超时时间 */
  connectSocket?: number
  /** wx.uploadFile 的超时时间 */
  uploadFile?: number
  /** wx.downloadFile 的超时时间 */
  downloadFile?: number
}

/**
 * 分包配置
 */
export interface SubPackageConfig {
  /** 分包根目录 */
  root: string
  /** 分包别名 */
  name?: string
  /** 分包页面路径 */
  pages: string[]
  /** 分包预下载规则 */
  independent?: boolean
}

/**
 * 插件配置
 */
export interface PluginConfig {
  /** 插件版本号 */
  version: string
  /** 插件提供者 */
  provider: string
}

/**
 * 预加载规则配置
 */
export interface PreloadRuleConfig {
  /** 进入页面后预下载分包的 root 或 name */
  packages: string[]
  /** 在指定网络下预下载 */
  network?: 'all' | 'wifi'
}

/**
 * 权限配置
 */
export interface PermissionConfig {
  [key: string]: {
    desc: string
  }
}

/**
 * 页面配置
 */
export interface PageConfig {
  /** 导航栏背景颜色 */
  navigationBarBackgroundColor?: string
  /** 导航栏标题颜色 */
  navigationBarTextStyle?: 'black' | 'white'
  /** 导航栏标题文字内容 */
  navigationBarTitleText?: string
  /** 窗口的背景色 */
  backgroundColor?: string
  /** 下拉 loading 的样式 */
  backgroundTextStyle?: 'dark' | 'light'
  /** 是否开启当前页面下拉刷新 */
  enablePullDownRefresh?: boolean
  /** 页面上拉触底事件触发时距页面底部距离 */
  onReachBottomDistance?: number
  /** 屏幕旋转设置 */
  pageOrientation?: 'auto' | 'portrait' | 'landscape'
  /** 禁止页面右滑手势返回 */
  disableSwipeBack?: boolean
}

/**
 * 组件配置
 */
export interface ComponentConfig {
  /** 组件自定义组件配置 */
  component?: boolean
  /** 组件所使用的自定义组件 */
  usingComponents?: Record<string, string>
  /** 组件样式隔离 */
  styleIsolation?: 'isolated' | 'apply-shared' | 'shared'
  /** 组件数据字段监听器 */
  observers?: Record<string, string>
  /** 组件间代码共享 */
  behaviors?: string[]
  /** 组件接受的外部样式类 */
  externalClasses?: string[]
  /** 在组件定义时的选项 */
  options?: {
    /** 在组件定义时的选项中启用多slot支持 */
    multipleSlots?: boolean
    /** 组件样式隔离 */
    styleIsolation?: 'isolated' | 'apply-shared' | 'shared'
    /** 虚拟化组件节点 */
    virtualHost?: boolean
  }
}

/**
 * 小程序组件属性定义
 */
export interface MiniprogramProperty {
  /** 属性类型 */
  type: StringConstructor | NumberConstructor | BooleanConstructor | ArrayConstructor | ObjectConstructor | null
  /** 属性默认值 */
  value?: any
  /** 属性值被更改时的响应函数 */
  observer?: string | ((newVal: any, oldVal: any, changedPath: string) => void)
}

/**
 * 小程序组件定义
 */
export interface MiniprogramComponent {
  /** 组件的对外属性 */
  properties?: Record<string, MiniprogramProperty>
  /** 组件的内部数据 */
  data?: Record<string, any>
  /** 组件的方法 */
  methods?: Record<string, Function>
  /** 组件生命周期函数 */
  lifetimes?: {
    created?: () => void
    attached?: () => void
    ready?: () => void
    moved?: () => void
    detached?: () => void
    error?: (error: Error) => void
  }
  /** 组件所在页面的生命周期函数 */
  pageLifetimes?: {
    show?: () => void
    hide?: () => void
    resize?: (size: { windowWidth: number; windowHeight: number }) => void
  }
  /** 组件间关系定义 */
  relations?: Record<string, any>
  /** 数据监听器 */
  observers?: Record<string, (...args: any[]) => void>
  /** 一些选项 */
  options?: ComponentConfig['options']
  /** 组件接受的外部样式类 */
  externalClasses?: string[]
  /** 类似于mixins和traits的组件间代码复用机制 */
  behaviors?: string[]
}
