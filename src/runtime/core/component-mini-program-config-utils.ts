/**
 * 小程序页面/组件配置生成 helper。
 */

import type { ComponentConfig } from './component.js'

export interface MiniProgramRuntimeApi {
  updateComputed: (rawInstance: any) => void
  triggerWatchers: (rawInstance: any, changedData: Record<string, any>) => void
  ref: <T>(value: T, rawInstance: any) => any
  reactive: <T extends object>(target: T, rawInstance: any) => any
  computed: <T>(getter: () => T, rawInstance: any) => any
}

/**
 * 根据组件实例状态生成小程序 Page/Component 配置对象。
 */
export function createMiniProgramComponentConfig(
  config: ComponentConfig,
  rawInstance: any,
  isPage: boolean,
  runtimeApi: MiniProgramRuntimeApi
): any {
  const miniProgramConfig: any = {
    data: config.data || {},

    // 添加运行时方法
    _updateComputed: () => runtimeApi.updateComputed(rawInstance),
    _triggerWatchers: (changedData: Record<string, any>) => runtimeApi.triggerWatchers(rawInstance, changedData),

    // 添加响应式 API
    ref: <T>(value: T) => runtimeApi.ref(value, rawInstance),
    reactive: <T extends object>(target: T) => runtimeApi.reactive(target, rawInstance),
    computed: <T>(getter: () => T) => runtimeApi.computed(getter, rawInstance)
  }

  // 添加方法
  if (config.methods) {
    Object.assign(miniProgramConfig, config.methods)
  }

  if (isPage) {
    attachPageLifecycleHooks(miniProgramConfig, rawInstance)
  } else {
    attachComponentOptions(miniProgramConfig, config, rawInstance)
  }

  return miniProgramConfig
}

function attachPageLifecycleHooks(miniProgramConfig: any, rawInstance: any): void {
  if (rawInstance.onLoad) miniProgramConfig.onLoad = rawInstance.onLoad
  if (rawInstance.onShow) miniProgramConfig.onShow = rawInstance.onShow
  if (rawInstance.onReady) miniProgramConfig.onReady = rawInstance.onReady
  if (rawInstance.onHide) miniProgramConfig.onHide = rawInstance.onHide
  if (rawInstance.onUnload) miniProgramConfig.onUnload = rawInstance.onUnload
}

function attachComponentOptions(miniProgramConfig: any, config: ComponentConfig, rawInstance: any): void {
  if (rawInstance.lifetimes) {
    miniProgramConfig.lifetimes = rawInstance.lifetimes
  }

  miniProgramConfig.options = {
    multipleSlots: true,
    addGlobalClass: true
  }

  miniProgramConfig.properties = config.props || {}
  miniProgramConfig.observers = {}

  if (config.watch) {
    for (const key of Object.keys(config.watch)) {
      miniProgramConfig.observers[key] = function (newVal: any) {
        this._triggerWatchers({ [key]: newVal })
      }
    }
  }
}
