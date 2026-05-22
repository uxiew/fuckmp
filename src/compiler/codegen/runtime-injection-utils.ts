/**
 * runtime-injection 代码生成纯工具。
 */

import type { BundleResult } from '../runtime-bundler'
import type { RuntimeInjectionConfig, Vue3FeatureUsage } from '../runtime-injector'

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
 * 生成响应式模块。
 */
export function generateReactivityRuntimeCode(): string {
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
