/**
 * Vue3 小程序运行时库
 * 提供Vue3特性的小程序适配层
 */

import { Reactivity } from './core/reactivity'
import { Lifecycle } from './core/lifecycle'
import { TemplateEngine } from './core/template'
import { DependencyInjection } from './core/di'
import { EventSystem } from './core/event'
import { ComponentManager } from './core/component'
import { logger } from './utils/logger'

/**
 * 运行时配置
 */
export interface RuntimeConfig {
  /** 是否启用调试模式 */
  debug?: boolean
  /** 性能监控 */
  performance?: boolean
  /** 错误处理 */
  errorHandler?: (error: Error, instance?: any) => void
  /** 警告处理 */
  warnHandler?: (message: string, instance?: any) => void
}

/**
 * Vue3 小程序运行时
 */
export class Vue3MiniRuntime {
  private static instance: Vue3MiniRuntime
  private config: RuntimeConfig
  private reactivity: Reactivity
  private lifecycle: Lifecycle
  private template: TemplateEngine
  private di: DependencyInjection
  private event: EventSystem
  private component: ComponentManager
  private initialized = false

  private constructor(config: RuntimeConfig = {}) {
    this.config = {
      debug: false,
      performance: false,
      ...config
    }

    // 初始化核心模块
    this.reactivity = new Reactivity(this.config)
    this.lifecycle = new Lifecycle(this.config)
    this.template = new TemplateEngine(this.config)
    this.di = new DependencyInjection(this.config)
    this.event = new EventSystem(this.config)
    this.component = new ComponentManager(this.config)

    // 设置组件管理器的依赖
    this.component.setDependencies({
      reactivity: this.reactivity,
      lifecycle: this.lifecycle,
      template: this.template,
      di: this.di,
      event: this.event
    })

    this.setupErrorHandling()
  }

  /**
   * 获取运行时实例（单例）
   */
  static getInstance(config?: RuntimeConfig): Vue3MiniRuntime {
    if (!Vue3MiniRuntime.instance) {
      Vue3MiniRuntime.instance = new Vue3MiniRuntime(config)
    }
    return Vue3MiniRuntime.instance
  }

  /**
   * 初始化运行时
   */
  async initialize(): Promise<void> {
    if (this.initialized) {
      return
    }

    try {
      logger.info('Vue3 小程序运行时初始化开始')

      // 初始化各个模块
      await this.reactivity.initialize()
      await this.lifecycle.initialize()
      await this.template.initialize()
      await this.di.initialize()
      await this.event.initialize()
      await this.component.initialize()

      this.initialized = true
      logger.info('Vue3 小程序运行时初始化完成')

    } catch (error) {
      logger.error('运行时初始化失败:', error)
      throw error
    }
  }

  /**
   * 创建页面实例
   */
  createPage(pageConfig: any): any {
    if (!this.initialized) {
      throw new Error('运行时未初始化，请先调用 initialize()')
    }

    return this.component.createPage(pageConfig)
  }

  /**
   * 创建组件实例
   */
  createComponent(componentConfig: any): any {
    if (!this.initialized) {
      throw new Error('运行时未初始化，请先调用 initialize()')
    }

    return this.component.createComponent(componentConfig)
  }

  /**
   * 获取响应式系统
   */
  getReactivity(): Reactivity {
    return this.reactivity
  }

  /**
   * 获取生命周期管理器
   */
  getLifecycle(): Lifecycle {
    return this.lifecycle
  }

  /**
   * 获取模板引擎
   */
  getTemplate(): TemplateEngine {
    return this.template
  }

  /**
   * 获取依赖注入系统
   */
  getDI(): DependencyInjection {
    return this.di
  }

  /**
   * 获取事件系统
   */
  getEvent(): EventSystem {
    return this.event
  }

  /**
   * 获取组件管理器
   */
  getComponent(): ComponentManager {
    return this.component
  }

  /**
   * 设置错误处理
   */
  private setupErrorHandling(): void {
    // 全局错误处理
    if (typeof wx !== 'undefined') {
      wx.onError?.((error: string) => {
        if (this.config.errorHandler) {
          this.config.errorHandler(new Error(error))
        } else {
          logger.error('小程序运行时错误:', error)
        }
      })

      wx.onUnhandledRejection?.((res: any) => {
        if (this.config.errorHandler) {
          this.config.errorHandler(new Error(res.reason))
        } else {
          logger.error('未处理的Promise拒绝:', res.reason)
        }
      })
    }
  }

  /**
   * 销毁运行时
   */
  destroy(): void {
    if (!this.initialized) {
      return
    }

    try {
      this.component.destroy()
      this.event.destroy()
      this.di.destroy()
      this.template.destroy()
      this.lifecycle.destroy()
      this.reactivity.destroy()

      this.initialized = false
      Vue3MiniRuntime.instance = null as any

      logger.info('Vue3 小程序运行时已销毁')
    } catch (error) {
      logger.error('运行时销毁失败:', error)
    }
  }

  /**
   * 获取运行时统计信息
   */
  getStats(): {
    initialized: boolean
    modules: Record<string, boolean>
    performance?: any
  } {
    return {
      initialized: this.initialized,
      modules: {
        reactivity: this.reactivity.isInitialized(),
        lifecycle: this.lifecycle.isInitialized(),
        template: this.template.isInitialized(),
        di: this.di.isInitialized(),
        event: this.event.isInitialized(),
        component: this.component.isInitialized()
      },
      performance: this.config.performance ? this.getPerformanceStats() : undefined
    }
  }

  /**
   * 获取性能统计
   */
  private getPerformanceStats(): any {
    // 实现性能统计逻辑
    return {
      // TODO: 实现性能监控
    }
  }
}

/**
 * 全局运行时实例
 */
export const runtime = Vue3MiniRuntime.getInstance()

/**
 * 便捷的初始化函数
 */
export async function initVue3Runtime(config?: RuntimeConfig): Promise<Vue3MiniRuntime> {
  const rt = Vue3MiniRuntime.getInstance(config)
  await rt.initialize()
  return rt
}

/**
 * 创建页面的便捷函数
 */
export function definePage(config: any): any {
  return runtime.createPage(config)
}

/**
 * 创建组件的便捷函数
 */
export function defineComponent(config: any): any {
  return runtime.createComponent(config)
}

// 导出核心模块
export { Reactivity } from './core/reactivity'
export { Lifecycle } from './core/lifecycle'
export { TemplateEngine } from './core/template'
export { DependencyInjection } from './core/di'
export { EventSystem } from './core/event'
export { ComponentManager } from './core/component'

// 导出运行时特有的类型（避免与其他模块冲突）
export type {
  Ref,
  ComputedRef,
  ReactiveEffect,
  MiniProgramPage,
  MiniProgramComponent,
  CompileTimeConfig,
  RuntimeContext,
  PluginMessage,
  RuntimeEvent,
  PerformanceMetrics,
  RuntimeError,
  DebugInfo
} from './types'

// RuntimeConfig已经在上面直接导出了

// 兼容旧版本API
export * from './reactivity.js'
export * from './lifecycle.js'
export * from './event-system.js'

import { setupReactivity, cleanupReactivity } from './reactivity.js'
import { setupLifecycle, cleanupLifecycle } from './lifecycle.js'
import { setupEventSystem, cleanupEventSystem } from './event-system.js'

/**
 * 运行时初始化（兼容旧版本）
 */
export function setupRuntime(context: any, isPage: boolean = false): void {
  // 设置响应式系统
  setupReactivity(context)

  // 设置生命周期系统
  setupLifecycle(context, isPage)

  // 设置事件系统
  setupEventSystem(context)
}

/**
 * 运行时清理（兼容旧版本）
 */
export function cleanupRuntime(context: any): void {
  // 清理响应式系统
  cleanupReactivity(context)

  // 清理生命周期系统
  cleanupLifecycle(context)

  // 清理事件系统
  cleanupEventSystem(context)
}
