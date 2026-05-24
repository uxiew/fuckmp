/**
 * 生命周期运行时纯函数工具。
 */

import type { LifecycleConfig, LifecycleHooks } from './lifecycle.js'

type OptionalPageHookName = Extract<
  keyof LifecycleHooks,
  | 'onPullDownRefresh'
  | 'onReachBottom'
  | 'onShareAppMessage'
  | 'onPageScroll'
  | 'onResize'
  | 'onTabItemTap'
>

export type RuntimeLifecycleCaller = (hookName: keyof LifecycleHooks, ...args: any[]) => void

export interface PageLifecycleHandlers {
  onLoad: (options: any) => void
  onShow: () => void
  onReady?: () => void
  onHide: () => void
  onUnload: () => void
}

export interface ComponentLifecycleHandlers {
  created: () => void
  attached: () => void
  ready: () => void
  moved: () => void
  detached: () => void
  error: (error: Error) => void
}

const OPTIONAL_PAGE_HOOK_NAMES = [
  'onPullDownRefresh',
  'onReachBottom',
  'onShareAppMessage',
  'onPageScroll',
  'onResize',
  'onTabItemTap'
] as const satisfies readonly OptionalPageHookName[]

const PERFORMANCE_START_SUFFIX = '_start'

/** 合并生命周期配置默认值。 */
export function createLifecycleConfig(config: LifecycleConfig = {}): Required<LifecycleConfig> {
  return {
    debug: false,
    enablePerformanceTracking: false,
    ...config
  }
}

/** 构造页面 lifecycle handlers，保持原有 Vue hook 包裹顺序。 */
export function createPageLifecycleHandlers(
  hooks: LifecycleHooks,
  callHook: RuntimeLifecycleCaller
): PageLifecycleHandlers {
  const handlers: PageLifecycleHandlers = {
    onLoad: (options: any) => {
      callHook('onBeforeMount')
      hooks.onLoad?.(options)
      callHook('onMounted')
    },
    onShow: () => {
      callHook('onActivated')
      hooks.onShow?.()
    },
    onHide: () => {
      callHook('onDeactivated')
      hooks.onHide?.()
    },
    onUnload: () => {
      callHook('onBeforeUnmount')
      hooks.onUnload?.()
      callHook('onUnmounted')
    }
  }

  if (hooks.onReady) {
    handlers.onReady = hooks.onReady
  }

  return handlers
}

/** 构造组件 lifecycle handlers，保持原有 Vue hook 包裹顺序。 */
export function createComponentLifecycleHandlers(
  hooks: LifecycleHooks,
  callHook: RuntimeLifecycleCaller
): ComponentLifecycleHandlers {
  return {
    created: () => {
      callHook('onBeforeMount')
      hooks.created?.()
    },
    attached: () => {
      hooks.attached?.()
    },
    ready: () => {
      callHook('onMounted')
      hooks.ready?.()
    },
    moved: () => {
      hooks.moved?.()
    },
    detached: () => {
      callHook('onBeforeUnmount')
      hooks.detached?.()
      callHook('onUnmounted')
    },
    error: (error: Error) => {
      hooks.error?.(error)
    }
  }
}

/** 获取可选页面 hook 名称，顺序保持原有注册顺序。 */
export function getOptionalPageHookNames(): readonly OptionalPageHookName[] {
  return OPTIONAL_PAGE_HOOK_NAMES
}

/** 确保组件实例存在 lifetimes 对象。 */
export function ensureLifetimes(instance: any): Record<string, Function> {
  instance.lifetimes = instance.lifetimes || {}
  return instance.lifetimes
}

/** 获取性能开始标记 key。 */
export function getPerformanceStartKey(hookName: string): string {
  return `${hookName}${PERFORMANCE_START_SUFFIX}`
}

/** 判断性能标记 key 是否为开始标记。 */
export function isPerformanceStartKey(key: string): boolean {
  return key.endsWith(PERFORMANCE_START_SUFFIX)
}

/** 从性能开始标记 key 中提取 hook 名称。 */
export function getHookNameFromPerformanceStartKey(key: string): string {
  return key.replace(PERFORMANCE_START_SUFFIX, '')
}
