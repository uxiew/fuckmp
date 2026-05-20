/**
 * 代码生成器
 * 生成优化的运行时注入代码
 */

import type { Vue3FeatureUsage, RuntimeInjectionConfig } from './runtime-injector'
import type { BundleResult } from './runtime-bundler'
import { ObjectLiteralSerializer } from './codegen/object-serializer'
import { logger } from '@/utils/logger'

/**
 * 代码生成选项
 */
export interface CodeGenerationOptions {
  /** 目标平台 */
  target: 'wechat' | 'alipay' | 'baidu' | 'toutiao'
  /** 是否生成源映射 */
  sourceMap: boolean
  /** 是否启用严格模式 */
  strict: boolean
  /** 自定义模板变量 */
  templateVars: Record<string, any>
}

/**
 * 生成的代码文件
 */
export interface GeneratedFile {
  /** 文件路径 */
  path: string
  /** 文件内容 */
  content: string
  /** 文件类型 */
  type: 'js' | 'json' | 'wxml' | 'wxss'
  /** 是否为运行时文件 */
  isRuntime: boolean
}

/**
 * 代码生成器
 */
export class CodeGenerator {
  private config: RuntimeInjectionConfig
  private options: CodeGenerationOptions
  private serializer = new ObjectLiteralSerializer()

  constructor(config: RuntimeInjectionConfig, options: Partial<CodeGenerationOptions> = {}) {
    this.config = config
    this.options = {
      target: 'wechat',
      sourceMap: false,
      strict: true,
      templateVars: {},
      ...options
    }
  }

  /**
   * 生成运行时注入文件
   */
  generateRuntimeInjection(bundleResult: BundleResult, featureUsage: Vue3FeatureUsage): GeneratedFile {
    logger.info('生成运行时注入文件...')

    const content = this.generateRuntimeInjectionCode(bundleResult, featureUsage)

    return {
      path: 'runtime-injection.js',
      content,
      type: 'js',
      isRuntime: true
    }
  }

  /**
   * 生成运行时注入代码
   */
  private generateRuntimeInjectionCode(bundleResult: BundleResult, featureUsage: Vue3FeatureUsage): string {
    // 根据检测到的特性使用情况生成运行时配置
    const runtimeConfig = JSON.stringify({
      ...this.config.runtimeConfig,
      features: featureUsage,
      modules: bundleResult.modules,
      version: this.config.runtimeVersion
    }, null, 2)

    return `${this.generateFileHeader()}

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
   * 生成应用入口代码
   */
  generateAppCode(appData: any): GeneratedFile {
    // 提取应用上下文（如果存在）
    const context = appData?.context
    const appOptions = context ? this.generateAppOptions(context) : '{}'

    const content = `${this.generateFileHeader()}

// 引入运行时
const { initVue3Runtime, createApp } = require('./runtime-injection.js');

// 应用选项
const appOptions = ${appOptions};

// 应用实例
App({
  async onLaunch(options) {
    try {
      // 初始化Vue3运行时
      await initVue3Runtime({
        debug: ${this.config.runtimeConfig.debug},
        performance: ${this.config.runtimeConfig.performance}
      });

      // 创建应用实例
      const app = createApp(appOptions);

      // 调用原始的onLaunch
      if (appOptions.onLaunch) {
        await appOptions.onLaunch.call(this, options);
      }

      console.log('[Vue3App] 应用启动完成');
    } catch (error) {
      console.error('[Vue3App] 应用启动失败:', error);
    }
  },

  onError(error) {
    console.error('[Vue3App] 应用错误:', error);

    // 调用原始的onError
    if (appOptions.onError) {
      appOptions.onError.call(this, error);
    }
  }
});
`

    return {
      path: 'app.js',
      content,
      type: 'js',
      isRuntime: false
    }
  }

  /**
   * 生成页面代码
   */
  generatePageCode(pageData: any, pagePath: string): GeneratedFile {
    // 提取上下文和小程序配置
    const context = pageData.context
    const config = pageData.context ? null : pageData // 如果没有context，说明pageData就是配置

    // 生成页面选项对象
    const pageOptions = this.generatePageOptions(context, config)

    const content = `${this.generateFileHeader()}

// 引入运行时
const { createPage } = require('${this.getRelativeRuntimePath(pagePath)}');

// 页面选项
const pageOptions = ${pageOptions};

// 创建页面
Page(createPage(pageOptions));
`

    return {
      path: `${pagePath}.js`,
      content,
      type: 'js',
      isRuntime: false
    }
  }

  /**
   * 生成组件代码
   */
  generateComponentCode(componentData: any, componentPath: string): GeneratedFile {
    // 只提取上下文，不使用小程序配置
    const context = componentData.context

    // 生成组件选项对象（不传递配置）
    const componentOptions = this.generateComponentOptions(context, null)

    const content = `${this.generateFileHeader()}

// 引入运行时
const { createComponent } = require('${this.getRelativeRuntimePath(componentPath)}');

// 组件选项
const componentOptions = ${componentOptions};

// 创建组件
Component(createComponent(componentOptions));
`

    return {
      path: `${componentPath}.js`,
      content,
      type: 'js',
      isRuntime: false
    }
  }

  /**
   * 生成应用选项对象
   */
  private generateAppOptions(context: any): string {
    if (!context) {
      return '{}'
    }

    const options: any = {
      // Vue 组件数据
      data: this.generateDataFunction(context.data),

      // Vue 组件方法
      ...this.generateMethods(context.methods),

      // Vue 计算属性
      ...this.generateComputed(context.computed),

      // Vue 监听器
      ...this.generateWatchers(context.watch),

      // Vue 生命周期
      ...this.generateLifecycle(context.lifecycle)
    }

    // 过滤掉无效的属性
    return this.serializer.stringifyWithFunctions(this.filterInvalidOptions(options))
  }

  /**
   * 生成页面选项对象
   */
  private generatePageOptions(context: any, config: any): string {
    const options: any = {}

    // 如果有上下文，添加 Vue 相关选项
    if (context) {
      Object.assign(options, {
        // Vue 组件数据
        data: this.generateDataFunction(context.data),

        // Vue 组件方法（页面方法直接放在根级别）
        ...this.generateMethods(context.methods),

        // Vue 计算属性
        ...this.generateComputed(context.computed),

        // Vue 监听器
        ...this.generateWatchers(context.watch),

        // Vue 生命周期
        ...this.generateLifecycle(context.lifecycle)
      })

      // 添加响应式变量信息（供运行时使用）
      if (context.reactiveVariables && context.reactiveVariables.size > 0) {
        const reactiveVarsArray = Array.from(context.reactiveVariables.values())
        options._reactiveVariables = reactiveVarsArray
      }
    }

    // 如果有配置，添加小程序配置选项
    if (config) {
      Object.assign(options, config)
    }

    // 如果既没有上下文也没有配置，返回空对象
    if (!context && !config) {
      return '{}'
    }

    // 过滤掉无效的属性
    return this.serializer.stringifyWithFunctions(this.filterInvalidOptions(options))
  }

  /**
   * 生成组件选项对象
   */
  private generateComponentOptions(context: any, config: any): string {
    if (!context) {
      // 如果没有上下文，返回空对象
      return '{}'
    }

    const options: any = {
      // Vue 组件数据
      data: this.generateDataFunction(context.data),

      // Vue 组件属性
      properties: this.generateProperties(context.props),

      // Vue 组件方法
      methods: this.generateMethods(context.methods),

      // Vue 计算属性（在小程序中作为方法实现）
      ...this.generateComputed(context.computed),

      // Vue 监听器
      ...this.generateWatchers(context.watch),

      // Vue 生命周期
      ...this.generateLifecycle(context.lifecycle)
    }

    // 添加响应式变量信息（供运行时使用）
    if (context.reactiveVariables && context.reactiveVariables.size > 0) {
      const reactiveVarsArray = Array.from(context.reactiveVariables.values())
      options._reactiveVariables = reactiveVarsArray
    }

    return this.serializer.stringifyWithFunctions(options)
  }

  /**
   * 生成数据函数
   */
  private generateDataFunction(data: any): any {
    if (!data || Object.keys(data).length === 0) {
      return function () { return {} }
    }

    // 过滤掉不应该在数据中的内容
    const filteredData: any = {}
    Object.entries(data).forEach(([key, value]) => {
      // 跳过 Vue 宏调用和其他不应该在数据中的内容
      const valueStr = String(value)
      if (valueStr.includes('defineProps') ||
        valueStr.includes('defineEmits') ||
        valueStr.includes('withDefaults') ||
        key === 'props' ||
        key === 'emit') {
        return
      }

      // 过滤掉无效的生命周期方法
      if (['attached', 'onReady', 'onShow', 'onHide', 'onUnload'].includes(key) &&
        typeof value === 'string' && value.includes('无效的回调函数')) {
        return
      }

      // 过滤掉包含this.的表达式，因为在data初始化时this还不存在
      if (typeof value === 'string' && value.includes('this.')) {
        return
      }

      // 过滤掉计算属性内部的临时变量（如now, lastActive等）
      if (['now', 'lastActive'].includes(key)) {
        return
      }

      filteredData[key] = value
    })

    // 创建一个包含实际数据的函数字符串，使用 stringifyObjectLiteral 生成正确的小程序格式
    const dataStr = this.serializer.stringifyObjectLiteral(filteredData, 2)
    return `${dataStr}`
  }

  /**
   * 生成方法
   */
  private generateMethods(methods: any): any {
    if (!methods || Object.keys(methods).length === 0) {
      return {}
    }

    const result: any = {}
    Object.entries(methods).forEach(([name, method]: [string, any]) => {
      if (method && typeof method.body === 'string') {
        // 检测并转换事件处理函数
        const convertedBody = this.serializer.convertEventHandlerFunction(name, method.body)
        result[name] = convertedBody
      }
    })
    return result
  }

  /**
   * 生成计算属性
   */
  private generateComputed(computed: any): any {
    if (!computed || Object.keys(computed).length === 0) {
      return {}
    }

    const result: any = {}
    Object.entries(computed).forEach(([name, comp]: [string, any]) => {
      if (comp && comp.getter) {
        // 在小程序中，计算属性作为方法实现
        result[`get${name.charAt(0).toUpperCase() + name.slice(1)}`] = comp.getter
      }
    })
    return result
  }

  /**
   * 生成监听器
   */
  private generateWatchers(watchers: any): any {
    if (!watchers || Object.keys(watchers).length === 0) {
      return {}
    }

    // 小程序中的监听器需要特殊处理
    return {
      observers: watchers
    }
  }

  /**
   * 生成生命周期
   */
  private generateLifecycle(lifecycle: any): any {
    if (!lifecycle || Object.keys(lifecycle).length === 0) {
      return {}
    }

    const result: any = {}

    // 直接使用已经映射好的生命周期钩子
    // 在 ScriptTransformer 中已经完成了 Vue 到小程序的映射
    Object.entries(lifecycle).forEach(([hookName, handler]: [string, any]) => {
      if (handler && typeof handler === 'string' && handler.trim()) {
        // 生成函数代码
        if (hookName === 'onLoad') {
          result[hookName] = `function(options) {\n    ${handler.trim()}\n  }`
        } else if (hookName.startsWith('pageLifetimes.')) {
          // 处理组件的页面生命周期
          const pageLiftimeName = hookName.replace('pageLifetimes.', '')
          if (!result.pageLifetimes) {
            result.pageLifetimes = {}
          }
          result.pageLifetimes[pageLiftimeName] = `function() {\n    ${handler.trim()}\n  }`
        } else if (['created', 'attached', 'detached', 'moved'].includes(hookName)) {
          // 组件生命周期
          if (!result.lifetimes) {
            result.lifetimes = {}
          }
          result.lifetimes[hookName] = `function() {\n    ${handler.trim()}\n  }`
        } else {
          // 页面生命周期
          result[hookName] = `function() {\n    ${handler.trim()}\n  }`
        }
      }
    })

    return result
  }

  /**
   * 生成属性定义
   */
  private generateProperties(props: any): any {
    if (!props || Object.keys(props).length === 0) {
      return {}
    }

    const result: any = {}
    Object.entries(props).forEach(([name, prop]: [string, any]) => {
      result[name] = {
        type: this.mapVueTypeToMiniProgram(prop.type),
        value: prop.default
      }
    })
    return result
  }

  /**
   * 映射 Vue 类型到小程序类型（返回构造函数而不是字符串）
   */
  private mapVueTypeToMiniProgram(vueType: any): string {
    if (!vueType) return 'Object'  // 默认为 Object 而不是 null

    if (typeof vueType === 'string') {
      switch (vueType.toLowerCase()) {
        case 'string': return 'String'
        case 'number': return 'Number'
        case 'boolean': return 'Boolean'
        case 'array': return 'Array'
        case 'object': return 'Object'
        default: return 'Object'  // 未知类型默认为 Object
      }
    }

    // 如果是构造函数，尝试推断类型
    if (typeof vueType === 'function') {
      switch (vueType.name) {
        case 'String': return 'String'
        case 'Number': return 'Number'
        case 'Boolean': return 'Boolean'
        case 'Array': return 'Array'
        case 'Object': return 'Object'
        default: return 'Object'
      }
    }

    return 'Object'
  }

  /**
   * 过滤掉无效的选项属性
   */
  private filterInvalidOptions(options: any): any {
    const filtered: any = {}

    Object.entries(options).forEach(([key, value]) => {


      // 过滤掉无效的生命周期方法
      if (['attached', 'onReady', 'onShow', 'onHide', 'onUnload'].includes(key) &&
        typeof value === 'string' && value.includes('无效的回调函数')) {
        return
      }

      // 过滤掉空值或无效值，但保留数组（即使是空数组）
      if (value !== null && value !== undefined && value !== '' || Array.isArray(value)) {
        filtered[key] = value
      }
    })

    return filtered
  }

  /**
   * 生成文件头部注释
   */
  private generateFileHeader(): string {
    const timestamp = new Date().toISOString()
    return `// 由 Vue3 微信小程序编译器自动生成
// 编译时间: ${timestamp}
// 运行时版本: ${this.config.runtimeVersion}
// 目标平台: ${this.options.target}
${this.options.strict ? "'use strict';" : ''}
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
      usage.reactivity.computed ||
      usage.reactivity.watch ||
      usage.reactivity.watchEffect ||
      usage.composition.setup
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

  /**
   * 获取相对运行时路径
   */
  private getRelativeRuntimePath(filePath: string): string {
    const depth = filePath.split('/').length - 1
    const prefix = depth > 0 ? '../'.repeat(depth) : './'
    return `${prefix}runtime-injection.js`
  }

  /**
   * 生成运行时配置文件
   */
  generateRuntimeConfig(featureUsage: Vue3FeatureUsage): GeneratedFile {
    const config = {
      version: this.config.runtimeVersion,
      target: this.options.target,
      features: featureUsage,
      options: {
        debug: this.config.runtimeConfig.debug,
        performance: this.config.runtimeConfig.performance,
        treeshaking: this.config.treeshaking,
        minify: this.config.minify
      },
      generated: new Date().toISOString()
    }

    return {
      path: 'runtime-config.json',
      content: JSON.stringify(config, null, 2),
      type: 'json',
      isRuntime: true
    }
  }

  /**
   * 生成所有文件
   */
  generateAllFiles(
    bundleResult: BundleResult,
    featureUsage: Vue3FeatureUsage,
    appConfig: any,
    pages: Map<string, any>,
    components: Map<string, any>
  ): GeneratedFile[] {
    const files: GeneratedFile[] = []

    // 生成运行时注入文件
    files.push(this.generateRuntimeInjection(bundleResult, featureUsage))

    // 生成运行时配置文件
    files.push(this.generateRuntimeConfig(featureUsage))

    // 生成应用文件
    files.push(this.generateAppCode(appConfig))

    // 生成页面文件
    for (const [pagePath, pageConfig] of pages) {
      files.push(this.generatePageCode(pageConfig, pagePath))
    }

    // 生成组件文件
    for (const [componentPath, componentConfig] of components) {
      files.push(this.generateComponentCode(componentConfig, componentPath))
    }

    logger.info(`生成了 ${files.length} 个文件`)
    return files
  }
}
