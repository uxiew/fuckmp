/**
 * runtime-injection 代码生成纯工具。
 */

import type { BundleResult } from '../runtime-bundler'
import type { RuntimeInjectionConfig, Vue3FeatureUsage } from '../runtime-injector'
import { generateReactivityRuntimeCode } from './runtime-reactivity-codegen-utils.js'

export { generateReactivityRuntimeCode } from './runtime-reactivity-codegen-utils.js'

/**
 * 构造 runtime 注入配置对象。
 */
export function buildRuntimeConfig(
  config: RuntimeInjectionConfig,
  bundleResult: BundleResult,
  featureUsage: Vue3FeatureUsage
): Record<string, any> {
  return {
    ...config.runtimeConfig,
    features: featureUsage,
    modules: bundleResult.modules,
    version: config.runtimeVersion
  }
}

/**
 * 判断是否需要生成当前已实现的响应式 runtime。
 */
export function needsRuntimeReactivity(usage: Vue3FeatureUsage): boolean {
  return usage.reactivity.ref ||
    usage.reactivity.reactive ||
    usage.reactivity.computed
}

/**
 * 生成自包含运行时代码。
 */
export function buildSelfContainedRuntimeCode(featureUsage: Vue3FeatureUsage): string {
  const parts = [
    generateRuntimeUtilityCode()
  ]

  if (needsRuntimeReactivity(featureUsage)) {
    parts.push(generateReactivityRuntimeCode())
  }

  parts.push(generateMainRuntimeClassCode())

  return parts.join('\n\n')
}

/**
 * 生成基础工具函数。
 */
export function generateRuntimeUtilityCode(): string {
  return `
// ===== 工具函数 =====
const logger = {
  info: (msg, ...args) => console.log('[Vue3MP]', msg, ...args),
  warn: (msg, ...args) => console.warn('[Vue3MP]', msg, ...args),
  error: (msg, ...args) => console.error('[Vue3MP]', msg, ...args)
};
`
}

/**
 * 生成主运行时类。
 */
export function generateMainRuntimeClassCode(): string {
  return `
// ===== 主运行时类 =====
class Vue3MiniRuntime {
  constructor(config = {}) {
    this.config = config;
    this.initialized = false;
  }

  static createRuntime(config) {
    return new Vue3MiniRuntime(config);
  }

  async initialize() {
    if (this.initialized) return;
    this.initialized = true;
    logger.info('Vue3 小程序运行时初始化完成');
  }

  createPage(options) {
    return createPage(options);
  }

  createComponent(options) {
    return createComponent(options);
  }

  createApp(options) {
    // 直接返回应用配置，避免循环调用
    return options || {};
  }
}
`
}
