/**
 * 运行时注入代码生成器。
 *
 * 负责生成 `runtime-injection.js` 的自包含运行时与注入层，避免主
 * `CodeGenerator` 同时承担小程序文件包装和 runtime 模板维护职责。
 */

import type { BundleResult } from '../runtime-bundler'
import type { RuntimeInjectionConfig, Vue3FeatureUsage } from '../runtime-injector'
import { buildRuntimeConfig, buildSelfContainedRuntimeCode } from './runtime-injection-utils.js'

/**
 * 生成 runtime 注入文件内容。
 */
export class RuntimeInjectionGenerator {
  constructor(private readonly config: RuntimeInjectionConfig) {}

  /**
   * 生成运行时注入代码
   */
  generateRuntimeInjectionCode(
    bundleResult: BundleResult,
    featureUsage: Vue3FeatureUsage,
    fileHeader: string
  ): string {
    // 根据检测到的特性使用情况生成运行时配置
    const runtimeConfig = JSON.stringify(
      buildRuntimeConfig(this.config, bundleResult, featureUsage),
      null,
      2
    )

    return `${fileHeader}

// ===== 自包含运行时库 =====
${this.generateSelfContainedRuntime(featureUsage)}

// ===== 运行时注入层 =====

// 运行时配置
const RUNTIME_CONFIG = ${runtimeConfig};

// 运行时实例
let runtimeInstance = null;
let isInitialized = false;

/**
 * 初始化运行时库
 */
function initVue3Runtime(customConfig = {}) {
  if (isInitialized) {
    return runtimeInstance;
  }

  try {
    const config = { ...RUNTIME_CONFIG, ...customConfig };

    // 使用打包的运行时库创建实例
    runtimeInstance = Vue3MiniRuntime.createRuntime(config);

    // 同步初始化运行时
    runtimeInstance.initializeSync();

    isInitialized = true;

    if (config.debug) {
      console.log('[Vue3Runtime] 运行时库初始化成功', {
        version: config.version,
        modules: config.modules || [],
        features: Object.keys(config.features || {}).filter(key =>
          Object.values(config.features[key] || {}).some(Boolean)
        )
      });
    }

    return runtimeInstance;
  } catch (error) {
    console.error('[Vue3Runtime] 运行时库初始化失败:', error);
    throw error;
  }
}

/**
 * 获取运行时实例
 */
function getRuntime() {
  if (!isInitialized) {
    throw new Error('运行时库尚未初始化，请先调用 initVue3Runtime()');
  }
  return runtimeInstance;
}

/**
 * 创建页面
 */
function createPage(pageConfig) {
  // 处理页面的响应式变量
  if (pageConfig._reactiveVariables) {
    const originalOnLoad = pageConfig.onLoad || function() {};

    pageConfig.onLoad = function() {
      // 创建响应式变量
      if (pageConfig._reactiveVariables) {
        pageConfig._reactiveVariables.forEach(varInfo => {
          if (varInfo.type === 'ref') {
            this[varInfo.name] = ref(varInfo.initialValue, this, varInfo.name);
          } else if (varInfo.type === 'reactive') {
            this[varInfo.name] = reactive(varInfo.initialValue, this, varInfo.name);
          } else if (varInfo.type === 'computed') {
            this[varInfo.name] = computed(varInfo.initialValue, this, varInfo.name);
          }
        });
      }

      // 调用原始的 onLoad 方法
      originalOnLoad.call(this, ...arguments);

      // 初始化 computed 属性值
      if (typeof this._updateComputed === 'function') {
        this._updateComputed();
      }
    };
  }

  return pageConfig;
}

/**
 * 创建组件
 */
function createComponent(componentConfig) {
  // 处理组件的响应式变量
  if (componentConfig._reactiveVariables) {
    const originalAttached = componentConfig.attached || function() {};

    componentConfig.attached = function() {
      // 创建响应式变量
      if (componentConfig._reactiveVariables) {
        componentConfig._reactiveVariables.forEach(varInfo => {
          if (varInfo.type === 'ref') {
            this[varInfo.name] = ref(varInfo.initialValue, this, varInfo.name);
          } else if (varInfo.type === 'reactive') {
            this[varInfo.name] = reactive(varInfo.initialValue, this, varInfo.name);
          } else if (varInfo.type === 'computed') {
            this[varInfo.name] = computed(varInfo.initialValue, this, varInfo.name);
          }
        });
      }

      // 调用原始的 attached 方法
      originalAttached.call(this, ...arguments);

      // 初始化 computed 属性值
      if (this.methods && typeof this.methods._updateComputed === 'function') {
        this.methods._updateComputed.call(this);
      } else if (typeof this._updateComputed === 'function') {
        this._updateComputed();
      }
    };
  }

  return componentConfig;
}

/**
 * 创建应用
 */
function createApp(appConfig) {
  const runtime = getRuntime();
  return runtime.createApp(appConfig);
}

// 导出API
module.exports = {
  initVue3Runtime,
  getRuntime,
  createPage,
  createComponent,
  createApp
};

// 全局注册（可选）
if (typeof global !== 'undefined') {
  global.Vue3MiniRuntime = module.exports;
}
`
  }

  /**
   * 生成自包含的运行时库
   */
  private generateSelfContainedRuntime(featureUsage: Vue3FeatureUsage): string {
    return buildSelfContainedRuntimeCode(featureUsage)
  }

}
