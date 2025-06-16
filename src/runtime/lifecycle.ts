/**
 * 生命周期运行时适配
 */

import { LIFECYCLE_MAP } from '@/types/index.js'

/**
 * 生命周期钩子管理器
 */
export class LifecycleManager {
  private hooks: Map<string, Function[]> = new Map()
  private context: any

  constructor(context: any) {
    this.context = context
  }

  /**
   * 注册生命周期钩子
   */
  registerHook(hookName: string, callback: Function): () => void {
    if (!this.hooks.has(hookName)) {
      this.hooks.set(hookName, [])
    }

    this.hooks.get(hookName)!.push(callback)

    // 返回取消注册的函数
    return () => {
      const callbacks = this.hooks.get(hookName)
      if (callbacks) {
        const index = callbacks.indexOf(callback)
        if (index > -1) {
          callbacks.splice(index, 1)
        }
      }
    }
  }

  /**
   * 触发生命周期钩子
   */
  triggerHook(hookName: string, ...args: any[]): void {
    const callbacks = this.hooks.get(hookName)
    if (callbacks) {
      callbacks.forEach(callback => {
        try {
          callback.apply(this.context, args)
        } catch (error) {
          console.error(`生命周期钩子 ${hookName} 执行失败:`, error)
        }
      })
    }
  }

  /**
   * 清理所有钩子
   */
  cleanup(): void {
    this.hooks.clear()
  }
}

/**
 * Vue3 生命周期钩子函数
 */

/**
 * onBeforeMount 钩子
 */
export function onBeforeMount(callback: () => void): () => void {
  const manager = getCurrentLifecycleManager()
  return manager.registerHook('onBeforeMount', callback)
}

/**
 * onMounted 钩子
 */
export function onMounted(callback: () => void): () => void {
  const manager = getCurrentLifecycleManager()
  return manager.registerHook('onMounted', callback)
}

/**
 * onBeforeUpdate 钩子
 */
export function onBeforeUpdate(callback: () => void): () => void {
  const manager = getCurrentLifecycleManager()
  return manager.registerHook('onBeforeUpdate', callback)
}

/**
 * onUpdated 钩子
 */
export function onUpdated(callback: () => void): () => void {
  const manager = getCurrentLifecycleManager()
  return manager.registerHook('onUpdated', callback)
}

/**
 * onBeforeUnmount 钩子
 */
export function onBeforeUnmount(callback: () => void): () => void {
  const manager = getCurrentLifecycleManager()
  return manager.registerHook('onBeforeUnmount', callback)
}

/**
 * onUnmounted 钩子
 */
export function onUnmounted(callback: () => void): () => void {
  const manager = getCurrentLifecycleManager()
  return manager.registerHook('onUnmounted', callback)
}

/**
 * onActivated 钩子
 */
export function onActivated(callback: () => void): () => void {
  const manager = getCurrentLifecycleManager()
  return manager.registerHook('onActivated', callback)
}

/**
 * onDeactivated 钩子
 */
export function onDeactivated(callback: () => void): () => void {
  const manager = getCurrentLifecycleManager()
  return manager.registerHook('onDeactivated', callback)
}

/**
 * 页面特有的生命周期钩子
 */

/**
 * onLoad 钩子
 */
export function onLoad(callback: (options: any) => void): () => void {
  const manager = getCurrentLifecycleManager()
  return manager.registerHook('onLoad', callback)
}

/**
 * onShow 钩子
 */
export function onShow(callback: () => void): () => void {
  const manager = getCurrentLifecycleManager()
  return manager.registerHook('onShow', callback)
}

/**
 * onReady 钩子
 */
export function onReady(callback: () => void): () => void {
  const manager = getCurrentLifecycleManager()
  return manager.registerHook('onReady', callback)
}

/**
 * onHide 钩子
 */
export function onHide(callback: () => void): () => void {
  const manager = getCurrentLifecycleManager()
  return manager.registerHook('onHide', callback)
}

/**
 * onUnload 钩子
 */
export function onUnload(callback: () => void): () => void {
  const manager = getCurrentLifecycleManager()
  return manager.registerHook('onUnload', callback)
}

/**
 * onPullDownRefresh 钩子
 */
export function onPullDownRefresh(callback: () => void): () => void {
  const manager = getCurrentLifecycleManager()
  return manager.registerHook('onPullDownRefresh', callback)
}

/**
 * onReachBottom 钩子
 */
export function onReachBottom(callback: () => void): () => void {
  const manager = getCurrentLifecycleManager()
  return manager.registerHook('onReachBottom', callback)
}

/**
 * onShareAppMessage 钩子
 */
export function onShareAppMessage(callback: (options: any) => any): () => void {
  const manager = getCurrentLifecycleManager()
  return manager.registerHook('onShareAppMessage', callback)
}

/**
 * onPageScroll 钩子
 */
export function onPageScroll(callback: (options: { scrollTop: number }) => void): () => void {
  const manager = getCurrentLifecycleManager()
  return manager.registerHook('onPageScroll', callback)
}

/**
 * 获取当前生命周期管理器
 */
function getCurrentLifecycleManager(): LifecycleManager {
  const currentInstance = getCurrentInstance()
  if (!currentInstance._lifecycleManager) {
    currentInstance._lifecycleManager = new LifecycleManager(currentInstance)
  }
  return currentInstance._lifecycleManager
}

/**
 * 获取当前实例
 */
function getCurrentInstance(): any {
  if (typeof (globalThis as any).getCurrentPages !== 'undefined') {
    const pages = (globalThis as any).getCurrentPages()
    return pages[pages.length - 1]
  }

  return (globalThis as any)._currentComponent || {}
}

/**
 * 生命周期适配器
 */
export class LifecycleAdapter {
  /**
   * 为页面设置生命周期适配
   */
  static setupPageLifecycle(pageOptions: any): any {
    const manager = new LifecycleManager(pageOptions)
    pageOptions._lifecycleManager = manager

    // 包装原有的生命周期函数
    const originalOnLoad = pageOptions.onLoad
    pageOptions.onLoad = function (options: any) {
      manager.triggerHook('onBeforeMount')
      if (originalOnLoad) {
        originalOnLoad.call(this, options)
      }
      manager.triggerHook('onMounted')
      manager.triggerHook('onLoad', options)
    }

    const originalOnShow = pageOptions.onShow
    pageOptions.onShow = function () {
      if (originalOnShow) {
        originalOnShow.call(this)
      }
      manager.triggerHook('onActivated')
      manager.triggerHook('onShow')
    }

    const originalOnReady = pageOptions.onReady
    pageOptions.onReady = function () {
      if (originalOnReady) {
        originalOnReady.call(this)
      }
      manager.triggerHook('onReady')
    }

    const originalOnHide = pageOptions.onHide
    pageOptions.onHide = function () {
      if (originalOnHide) {
        originalOnHide.call(this)
      }
      manager.triggerHook('onDeactivated')
      manager.triggerHook('onHide')
    }

    const originalOnUnload = pageOptions.onUnload
    pageOptions.onUnload = function () {
      manager.triggerHook('onBeforeUnmount')
      if (originalOnUnload) {
        originalOnUnload.call(this)
      }
      manager.triggerHook('onUnmounted')
      manager.triggerHook('onUnload')
      manager.cleanup()
    }

    return pageOptions
  }

  /**
   * 为组件设置生命周期适配
   */
  static setupComponentLifecycle(componentOptions: any): any {
    const manager = new LifecycleManager(componentOptions)
    componentOptions._lifecycleManager = manager

    // 设置 lifetimes
    if (!componentOptions.lifetimes) {
      componentOptions.lifetimes = {}
    }

    const originalCreated = componentOptions.lifetimes.created
    componentOptions.lifetimes.created = function () {
      manager.triggerHook('onBeforeMount')
      if (originalCreated) {
        originalCreated.call(this)
      }
    }

    const originalAttached = componentOptions.lifetimes.attached
    componentOptions.lifetimes.attached = function () {
      if (originalAttached) {
        originalAttached.call(this)
      }
      manager.triggerHook('onMounted')
    }

    const originalDetached = componentOptions.lifetimes.detached
    componentOptions.lifetimes.detached = function () {
      manager.triggerHook('onBeforeUnmount')
      if (originalDetached) {
        originalDetached.call(this)
      }
      manager.triggerHook('onUnmounted')
      manager.cleanup()
    }

    // 设置 pageLifetimes
    if (!componentOptions.pageLifetimes) {
      componentOptions.pageLifetimes = {}
    }

    const originalShow = componentOptions.pageLifetimes.show
    componentOptions.pageLifetimes.show = function () {
      if (originalShow) {
        originalShow.call(this)
      }
      manager.triggerHook('onActivated')
    }

    const originalHide = componentOptions.pageLifetimes.hide
    componentOptions.pageLifetimes.hide = function () {
      if (originalHide) {
        originalHide.call(this)
      }
      manager.triggerHook('onDeactivated')
    }

    return componentOptions
  }
}

/**
 * 设置生命周期系统
 */
export function setupLifecycle(context: any, isPage: boolean = false): void {
  if (isPage) {
    LifecycleAdapter.setupPageLifecycle(context)
  } else {
    LifecycleAdapter.setupComponentLifecycle(context)
  }
}

/**
 * 清理生命周期系统
 */
export function cleanupLifecycle(context: any): void {
  if (context._lifecycleManager) {
    context._lifecycleManager.cleanup()
    delete context._lifecycleManager
  }
}
