/**
 * 运行时注入代码生成器。
 *
 * 负责生成 `runtime-injection.js` 的自包含运行时与注入层，避免主
 * `CodeGenerator` 同时承担小程序文件包装和 runtime 模板维护职责。
 */

import type { BundleResult } from '../runtime-bundler'
import type { RuntimeInjectionConfig, Vue3FeatureUsage } from '../runtime-injector'

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
    const runtimeConfig = JSON.stringify({
      ...this.config.runtimeConfig,
      features: featureUsage,
      modules: bundleResult.modules,
      version: this.config.runtimeVersion
    }, null, 2)

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
async function initVue3Runtime(customConfig = {}) {
  if (isInitialized) {
    return runtimeInstance;
  }

  try {
    const config = { ...RUNTIME_CONFIG, ...customConfig };

    // 使用打包的运行时库创建实例
    runtimeInstance = Vue3MiniRuntime.createRuntime(config);

    // 初始化运行时
    await runtimeInstance.initialize();

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
            this[varInfo.name] = ref(varInfo.initialValue);
          } else if (varInfo.type === 'reactive') {
            this[varInfo.name] = reactive(varInfo.initialValue);
          } else if (varInfo.type === 'computed') {
            this[varInfo.name] = computed(varInfo.getter);
          }
        });
      }

      // 调用原始的 onLoad 方法
      originalOnLoad.call(this, ...arguments);
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
            this[varInfo.name] = ref(varInfo.initialValue);
          } else if (varInfo.type === 'reactive') {
            this[varInfo.name] = reactive(varInfo.initialValue);
          } else if (varInfo.type === 'computed') {
            this[varInfo.name] = computed(varInfo.getter);
          }
        });
      }

      // 调用原始的 attached 方法
      originalAttached.call(this, ...arguments);
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
    const parts: string[] = []

    // 基础工具函数
    parts.push(this.generateUtilityFunctions())

    // 根据特性使用情况生成对应的模块
    if (this.needsReactivity(featureUsage)) {
      parts.push(this.generateReactivityModule())
    }

    // 主运行时类
    parts.push(this.generateMainRuntimeClass())

    return parts.join('\n\n')
  }

  /**
   * 检查是否需要响应式模块
   */
  private needsReactivity(usage: Vue3FeatureUsage): boolean {
    return usage.reactivity.ref ||
      usage.reactivity.reactive ||
      usage.reactivity.computed
  }

  /**
   * 生成工具函数
   */
  private generateUtilityFunctions(): string {
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
   * 生成响应式模块
   */
  private generateReactivityModule(): string {
    return `
// ===== 响应式系统 =====

// 创建 ref (基于 Proxy 的实现)
function ref(value, context) {
  const key = \`ref_\${Math.random().toString(36).substr(2, 9)}\`;

  const target = {
    _isRef: true,
    _key: key,
    _value: value,
    _context: context
  };

  const refProxy = new Proxy(target, {
    get(target, prop) {
      if (prop === 'value') return target._value;
      if (prop === '_isRef' || prop === '_key') return target[prop];
      return target[prop];
    },
    set(target, prop, newValue) {
      if (prop === 'value') {
        const oldValue = target._value;
        if (newValue !== oldValue) {
          target._value = newValue;
          if (target._context && typeof target._context.setData === 'function') {
            target._context.setData({ [target._key]: newValue });
          }
        }
        return true;
      }
      if (prop === '_isRef' || prop === '_key') {
        console.warn(\`尝试修改 ref 的只读属性: \${String(prop)}\`);
        return false;
      }
      target[prop] = newValue;
      return true;
    },
    has(target, prop) {
      return prop === 'value' || prop === '_isRef' || prop === '_key' || prop in target;
    },
    ownKeys(target) {
      return ['value', '_isRef', '_key'];
    },
    getOwnPropertyDescriptor(target, prop) {
      if (prop === 'value') {
        return {
          enumerable: true,
          configurable: true,
          writable: prop === 'value'
        };
      }
      if (prop === '_isRef' || prop === '_key') {
        return {
          enumerable: true,
          configurable: true,
          writable: false
        };
      }
      return Reflect.getOwnPropertyDescriptor(target, prop);
    }
  });

  if (context && typeof context.setData === 'function') {
    context.setData({ [key]: value });
  }

  return refProxy;
}

// 创建 reactive (优化的 Proxy 实现)
function reactive(obj, context) {
  const proxyCache = new WeakMap();
  const key = \`reactive_\${Math.random().toString(36).substr(2, 9)}\`;

  function createProxy(target, path = []) {
    if (!target || typeof target !== 'object') return target;

    if (proxyCache.has(target)) {
      return proxyCache.get(target);
    }

    const proxy = new Proxy(target, {
      get(target, prop) {
        const value = target[prop];
        if (value && typeof value === 'object' && typeof prop === 'string') {
          return createProxy(value, [...path, prop]);
        }
        return value;
      },
      set(target, prop, newValue) {
        if (typeof prop === 'string') {
          const oldValue = target[prop];
          if (newValue !== oldValue) {
            target[prop] = newValue;
            if (context && typeof context.setData === 'function') {
              const fullPath = path.length > 0
                ? \`\${key}.\${[...path, prop].join('.')}\`
                : \`\${key}.\${prop}\`;
              context.setData({ [fullPath]: newValue });
            }
          }
        }
        return true;
      },
      deleteProperty(target, prop) {
        if (prop in target) {
          delete target[prop];
          if (context && typeof context.setData === 'function') {
            const fullPath = path.length > 0
              ? \`\${key}.\${[...path, prop].join('.')}\`
              : \`\${key}.\${prop}\`;
            context.setData({ [fullPath]: undefined });
          }
        }
        return Reflect.deleteProperty(target, prop);
      },
      ownKeys(target) {
        return Reflect.ownKeys(target);
      },
      getOwnPropertyDescriptor(target, prop) {
        return Reflect.getOwnPropertyDescriptor(target, prop);
      }
    });

    proxyCache.set(target, proxy);
    return proxy;
  }

  const result = createProxy(obj);

  if (context && typeof context.setData === 'function') {
    context.setData({ [key]: obj });
  }

  return result;
}

// 创建 computed (基于 Proxy 的实现)
function computed(getter, context) {
  const key = \`computed_\${Math.random().toString(36).substr(2, 9)}\`;
  let _value;
  let _dirty = true;
  let _computing = false; // 防止循环计算

  const target = {
    _isComputed: true,
    _key: key,
    _getter: getter,
    _dirty: _dirty,
    _computing: false,
    _context: context
  };

  const computedProxy = new Proxy(target, {
    get(target, prop) {
      if (prop === 'value') {
        if (target._computing) {
          console.error(\`检测到计算属性 \${target._key} 的循环依赖\`);
          return undefined;
        }

        if (target._dirty) {
          target._computing = true;
          try {
            _value = target._getter();
            target._dirty = false;
            if (target._context && typeof target._context.setData === 'function') {
              target._context.setData({ [target._key]: _value });
            }
          } catch (error) {
            console.error(\`计算属性 \${target._key} 计算失败:\`, error);
            _value = undefined;
          } finally {
            target._computing = false;
          }
        }
        return _value;
      }
      if (prop === '_isComputed' || prop === '_key') return target[prop];
      return target[prop];
    },
    set(target, prop, newValue) {
      if (prop === 'value') {
        console.warn(\`计算属性 \${target._key} 的 value 是只读的\`);
        return false;
      }
      if (prop === '_isComputed' || prop === '_key') {
        console.warn(\`尝试修改 computed 的只读属性: \${String(prop)}\`);
        return false;
      }
      target[prop] = newValue;
      return true;
    },
    has(target, prop) {
      return prop === 'value' || prop === '_isComputed' || prop === '_key' || prop in target;
    },
    ownKeys(target) {
      return ['value', '_isComputed', '_key'];
    },
    getOwnPropertyDescriptor(target, prop) {
      if (prop === 'value') {
        return {
          enumerable: true,
          configurable: true,
          writable: false // computed value 是只读的
        };
      }
      if (prop === '_isComputed' || prop === '_key') {
        return {
          enumerable: true,
          configurable: true,
          writable: false
        };
      }
      return Reflect.getOwnPropertyDescriptor(target, prop);
    }
  });

  return computedProxy;
}
`
  }

  /**
   * 生成主运行时类
   */
  private generateMainRuntimeClass(): string {
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
}
