/**
 * 运行时类型定义
 */

// 重新导出核心类型
export * from '../core/reactivity'
export * from '../core/lifecycle'
export * from '../core/template'
export * from '../core/di'
export * from '../core/event'
export * from '../core/component'

/**
 * Vue3 API 兼容类型
 */
export interface Ref<T = any> {
  value: T
}

export interface ComputedRef<T = any> extends Ref<T> {
  readonly value: T
}

export interface ReactiveEffect<T = any> {
  (): T
  active: boolean
  deps: any[]
}

/**
 * 小程序适配类型
 */
export interface MiniProgramPage {
  data: Record<string, any>
  onLoad?(options: any): void
  onShow?(): void
  onReady?(): void
  onHide?(): void
  onUnload?(): void
  onPullDownRefresh?(): void
  onReachBottom?(): void
  onShareAppMessage?(res: any): any
  onPageScroll?(res: any): void
  onResize?(res: any): void
  onTabItemTap?(item: any): void
  setData(data: Record<string, any>, callback?: () => void): void
  [key: string]: any
}

export interface MiniProgramComponent {
  data: Record<string, any>
  properties: Record<string, any>
  methods: Record<string, Function>
  lifetimes: {
    created?(): void
    attached?(): void
    ready?(): void
    moved?(): void
    detached?(): void
    error?(error: Error): void
  }
  observers: Record<string, Function>
  options: {
    multipleSlots?: boolean
    addGlobalClass?: boolean
    pureDataPattern?: RegExp
  }
  setData(data: Record<string, any>, callback?: () => void): void
  triggerEvent(name: string, detail?: any, options?: any): void
  [key: string]: any
}

/**
 * 编译时配置类型
 */
export interface CompileTimeConfig {
  /** 响应式数据配置 */
  reactive?: {
    data: Record<string, any>
    computed: Record<string, any>
    watch: Record<string, any>
  }

  /** 生命周期配置 */
  lifecycle?: {
    hooks: Record<string, Function>
    isPage: boolean
  }

  /** 模板配置 */
  template?: {
    slots: Record<string, any>
    conditionals: Record<string, any>
    lists: Record<string, any>
  }

  /** 依赖注入配置 */
  di?: {
    providers: Record<string, any>
    injectors: Record<string, any>
    parent?: any
  }

  /** 事件配置 */
  event?: {
    events: Record<string, any>
    bindings: Record<string, any>
  }
}

/**
 * 运行时上下文类型
 */
export interface RuntimeContext {
  /** 当前实例 */
  instance: any

  /** 是否为页面 */
  isPage: boolean

  /** 父实例 */
  parent?: any

  /** 子实例 */
  children: any[]

  /** 运行时配置 */
  config: CompileTimeConfig

  /** 性能统计 */
  performance?: {
    startTime: number
    endTime?: number
    duration?: number
  }
}

/**
 * 插件通信类型
 */
export interface PluginMessage {
  type: string
  payload: any
  source: string
  target?: string
  timestamp: number
}

/**
 * 运行时事件类型
 */
export interface RuntimeEvent {
  type: 'lifecycle' | 'data' | 'error' | 'performance'
  name: string
  data: any
  instance: any
  timestamp: number
}

/**
 * 性能监控类型
 */
export interface PerformanceMetrics {
  /** 初始化时间 */
  initTime: number

  /** 渲染时间 */
  renderTime: number

  /** 更新时间 */
  updateTime: number

  /** 内存使用 */
  memoryUsage?: {
    used: number
    total: number
  }

  /** 事件处理时间 */
  eventHandlingTime: Record<string, number>

  /** 生命周期执行时间 */
  lifecycleTime: Record<string, number>
}

/**
 * 错误类型
 */
export interface RuntimeError extends Error {
  type: 'runtime' | 'lifecycle' | 'reactive' | 'template' | 'di' | 'event'
  instance?: any
  context?: any
  timestamp: number
}

/**
 * 调试信息类型
 */
export interface DebugInfo {
  /** 实例信息 */
  instance: {
    id: string
    type: 'page' | 'component'
    name: string
    data: Record<string, any>
  }

  /** 响应式状态 */
  reactivity: {
    data: Record<string, any>
    computed: Record<string, any>
    watchers: string[]
  }

  /** 生命周期状态 */
  lifecycle: {
    current: string
    history: string[]
  }

  /** 依赖注入状态 */
  di: {
    provided: Record<string, any>
    injected: Record<string, any>
  }

  /** 性能指标 */
  performance: PerformanceMetrics
}

/**
 * 工具函数类型
 */
export type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P]
}

export type DeepReadonly<T> = {
  readonly [P in keyof T]: T[P] extends object ? DeepReadonly<T[P]> : T[P]
}

export type UnwrapRef<T> = T extends Ref<infer V> ? V : T

export type ToRefs<T> = {
  [K in keyof T]: Ref<T[K]>
}

/**
 * 小程序全局类型扩展
 */
declare global {
  namespace WechatMiniprogram {
    interface Wx {
      onError?(callback: (error: string) => void): void
      onUnhandledRejection?(callback: (res: any) => void): void
    }
  }

  const wx: WechatMiniprogram.Wx
  function Page(options: MiniProgramPage): void
  function Component(options: MiniProgramComponent): void
  function getCurrentPages(): any[]
  function getApp(): any
}
