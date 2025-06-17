/**
 * Vue3 生命周期管理的小程序适配层
 * 提供组件和页面生命周期的统一管理
 */

import { logger } from '../utils/logger'

/**
 * 生命周期钩子类型
 */
export type LifecycleHook = () => void | Promise<void>

/**
 * 生命周期钩子映射
 */
export interface LifecycleHooks {
  // Vue3 组合式API生命周期
  onBeforeMount?: LifecycleHook
  onMounted?: LifecycleHook
  onBeforeUpdate?: LifecycleHook
  onUpdated?: LifecycleHook
  onBeforeUnmount?: LifecycleHook
  onUnmounted?: LifecycleHook
  onActivated?: LifecycleHook
  onDeactivated?: LifecycleHook

  // 小程序页面生命周期
  onLoad?: (options: any) => void
  onShow?: () => void
  onReady?: () => void
  onHide?: () => void
  onUnload?: () => void
  onPullDownRefresh?: () => void
  onReachBottom?: () => void
  onShareAppMessage?: (res: any) => any
  onPageScroll?: (res: any) => void
  onResize?: (res: any) => void
  onTabItemTap?: (item: any) => void

  // 小程序组件生命周期
  created?: () => void
  attached?: () => void
  ready?: () => void
  moved?: () => void
  detached?: () => void
  error?: (error: Error) => void
}

/**
 * 生命周期配置
 */
export interface LifecycleConfig {
  debug?: boolean
  enablePerformanceTracking?: boolean
}

/**
 * 生命周期管理器
 */
export class Lifecycle {
  private config: LifecycleConfig
  private instances: Map<any, LifecycleInstance> = new Map()
  private initialized = false

  constructor(config: LifecycleConfig = {}) {
    this.config = {
      debug: false,
      enablePerformanceTracking: false,
      ...config
    }
  }

  /**
   * 初始化生命周期系统
   */
  async initialize(): Promise<void> {
    if (this.initialized) {
      return
    }

    logger.debug('初始化生命周期系统')
    this.initialized = true
  }

  /**
   * 为实例设置生命周期
   */
  setupInstance(instance: any, hooks: LifecycleHooks, isPage: boolean = false): void {
    const lifecycleInstance = new LifecycleInstance(instance, hooks, isPage, this.config)
    this.instances.set(instance, lifecycleInstance)
    lifecycleInstance.setup()
  }

  /**
   * 获取实例的生命周期管理器
   */
  getInstance(instance: any): LifecycleInstance | undefined {
    return this.instances.get(instance)
  }

  /**
   * 清理实例
   */
  cleanupInstance(instance: any): void {
    const lifecycleInstance = this.instances.get(instance)
    if (lifecycleInstance) {
      lifecycleInstance.cleanup()
      this.instances.delete(instance)
    }
  }

  /**
   * 销毁生命周期系统
   */
  destroy(): void {
    for (const [instance, lifecycleInstance] of this.instances) {
      lifecycleInstance.cleanup()
    }
    this.instances.clear()
    this.initialized = false
  }

  /**
   * 检查是否已初始化
   */
  isInitialized(): boolean {
    return this.initialized
  }
}

/**
 * 生命周期实例
 */
class LifecycleInstance {
  private instance: any
  private hooks: LifecycleHooks
  private isPage: boolean
  private config: LifecycleConfig
  private performanceMarks: Map<string, number> = new Map()

  constructor(instance: any, hooks: LifecycleHooks, isPage: boolean, config: LifecycleConfig) {
    this.instance = instance
    this.hooks = hooks
    this.isPage = isPage
    this.config = config
  }

  /**
   * 设置生命周期
   */
  setup(): void {
    if (this.isPage) {
      this.setupPageLifecycle()
    } else {
      this.setupComponentLifecycle()
    }
  }

  /**
   * 设置页面生命周期
   */
  private setupPageLifecycle(): void {
    // 页面加载
    if (this.hooks.onLoad) {
      this.instance.onLoad = this.wrapHook('onLoad', (options: any) => {
        this.callHook('onBeforeMount')
        this.hooks.onLoad!(options)
        this.callHook('onMounted')
      })
    } else {
      this.instance.onLoad = this.wrapHook('onLoad', (options: any) => {
        this.callHook('onBeforeMount')
        this.callHook('onMounted')
      })
    }

    // 页面显示
    if (this.hooks.onShow) {
      this.instance.onShow = this.wrapHook('onShow', () => {
        this.callHook('onActivated')
        this.hooks.onShow!()
      })
    } else {
      this.instance.onShow = this.wrapHook('onShow', () => {
        this.callHook('onActivated')
      })
    }

    // 页面初次渲染完成
    if (this.hooks.onReady) {
      this.instance.onReady = this.wrapHook('onReady', this.hooks.onReady)
    }

    // 页面隐藏
    if (this.hooks.onHide) {
      this.instance.onHide = this.wrapHook('onHide', () => {
        this.callHook('onDeactivated')
        this.hooks.onHide!()
      })
    } else {
      this.instance.onHide = this.wrapHook('onHide', () => {
        this.callHook('onDeactivated')
      })
    }

    // 页面卸载
    if (this.hooks.onUnload) {
      this.instance.onUnload = this.wrapHook('onUnload', () => {
        this.callHook('onBeforeUnmount')
        this.hooks.onUnload!()
        this.callHook('onUnmounted')
      })
    } else {
      this.instance.onUnload = this.wrapHook('onUnload', () => {
        this.callHook('onBeforeUnmount')
        this.callHook('onUnmounted')
      })
    }

    // 其他页面生命周期
    this.setupOptionalPageHooks()
  }

  /**
   * 设置组件生命周期
   */
  private setupComponentLifecycle(): void {
    // 组件生命周期映射
    const lifecycleMap = {
      created: () => {
        this.callHook('onBeforeMount')
        this.hooks.created?.()
      },
      attached: () => {
        this.hooks.attached?.()
      },
      ready: () => {
        this.callHook('onMounted')
        this.hooks.ready?.()
      },
      moved: () => {
        this.hooks.moved?.()
      },
      detached: () => {
        this.callHook('onBeforeUnmount')
        this.hooks.detached?.()
        this.callHook('onUnmounted')
      },
      error: (error: Error) => {
        this.hooks.error?.(error)
      }
    }

    // 设置组件生命周期
    for (const [hookName, handler] of Object.entries(lifecycleMap)) {
      this.instance.lifetimes = this.instance.lifetimes || {}
      this.instance.lifetimes[hookName] = this.wrapHook(hookName, handler)
    }
  }

  /**
   * 设置可选的页面钩子
   */
  private setupOptionalPageHooks(): void {
    const optionalHooks = [
      'onPullDownRefresh',
      'onReachBottom',
      'onShareAppMessage',
      'onPageScroll',
      'onResize',
      'onTabItemTap'
    ]

    for (const hookName of optionalHooks) {
      const hook = this.hooks[hookName as keyof LifecycleHooks]
      if (hook) {
        this.instance[hookName] = this.wrapHook(hookName, hook)
      }
    }
  }

  /**
   * 调用生命周期钩子
   */
  private callHook(hookName: keyof LifecycleHooks, ...args: any[]): void {
    const hook = this.hooks[hookName]
    if (hook) {
      try {
        this.markPerformanceStart(hookName)
        const result = (hook as any)(...args)

        if (result instanceof Promise) {
          result
            .then(() => this.markPerformanceEnd(hookName))
            .catch(error => {
              this.markPerformanceEnd(hookName)
              logger.error(`生命周期钩子 ${hookName} 执行失败:`, error)
            })
        } else {
          this.markPerformanceEnd(hookName)
        }
      } catch (error) {
        this.markPerformanceEnd(hookName)
        logger.error(`生命周期钩子 ${hookName} 执行失败:`, error)
      }
    }
  }

  /**
   * 包装钩子函数，添加性能监控和错误处理
   */
  private wrapHook(hookName: string, handler: Function): Function {
    return (...args: any[]) => {
      try {
        this.markPerformanceStart(hookName)

        if (this.config.debug) {
          logger.debug(`执行生命周期钩子: ${hookName}`)
        }

        const result = handler(...args)

        if (result instanceof Promise) {
          return result
            .then((res) => {
              this.markPerformanceEnd(hookName)
              return res
            })
            .catch(error => {
              this.markPerformanceEnd(hookName)
              logger.error(`生命周期钩子 ${hookName} 执行失败:`, error)
              throw error
            })
        } else {
          this.markPerformanceEnd(hookName)
          return result
        }
      } catch (error) {
        this.markPerformanceEnd(hookName)
        logger.error(`生命周期钩子 ${hookName} 执行失败:`, error)
        throw error
      }
    }
  }

  /**
   * 标记性能开始
   */
  private markPerformanceStart(hookName: string): void {
    if (this.config.enablePerformanceTracking) {
      this.performanceMarks.set(`${hookName}_start`, Date.now())
    }
  }

  /**
   * 标记性能结束
   */
  private markPerformanceEnd(hookName: string): void {
    if (this.config.enablePerformanceTracking) {
      const startTime = this.performanceMarks.get(`${hookName}_start`)
      if (startTime) {
        const duration = Date.now() - startTime
        logger.debug(`生命周期钩子 ${hookName} 执行耗时: ${duration}ms`)
        this.performanceMarks.delete(`${hookName}_start`)
      }
    }
  }

  /**
   * 获取性能统计
   */
  getPerformanceStats(): Record<string, number> {
    const stats: Record<string, number> = {}
    for (const [key, value] of this.performanceMarks) {
      if (key.endsWith('_start')) {
        const hookName = key.replace('_start', '')
        stats[hookName] = Date.now() - value
      }
    }
    return stats
  }

  /**
   * 清理
   */
  cleanup(): void {
    this.performanceMarks.clear()
  }
}
