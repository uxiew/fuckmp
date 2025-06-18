/**
 * 代码生成器
 * 生成优化的运行时注入代码
 */

import type { Vue3FeatureUsage, RuntimeInjectionConfig } from './runtime-injector'
import type { BundleResult } from './runtime-bundler'
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
    const runtimeConfig = JSON.stringify({
      ...this.config.runtimeConfig,
      features: featureUsage,
      modules: bundleResult.modules,
      version: this.config.runtimeVersion
    }, null, 2)

    return `${this.generateFileHeader()}

// 运行时库代码

// Vue3 小程序运行时库 v1.0.0
// 自动生成，请勿手动修改
// 包含模块: ${bundleResult.modules.join(', ')}

(function(global) {
  // 运行时库命名空间
  const Vue3MiniRuntime = {};

  // 简单的运行时库实现
  class Vue3MiniRuntimeCore {
    constructor(config) {
      this.config = config;
      this.isInitialized = false;
      this.reactiveInstances = new Map();
    }

    async init() {
      if (this.isInitialized) {
        return;
      }

      // 初始化运行时库
      this.isInitialized = true;

      if (this.config.debug) {
        console.log('[Vue3MiniRuntime] 运行时库初始化完成');
      }
    }

    // 创建响应式系统实例
    createReactiveSystem(context) {
      const reactiveSystem = {
        context: context,
        refs: new Map(),
        reactives: new Map(),
        computeds: new Map(),

        // 生成唯一ID
        generateId() {
          return Math.random().toString(36).substr(2, 9);
        },

        // 创建 ref
        ref(value) {
          const key = 'ref_' + this.generateId();
          let _value = value;

          const refObject = {
            _isRef: true,
            _key: key,
            get value() {
              return _value;
            },
            set value(newValue) {
              if (newValue !== _value) {
                _value = newValue;
                if (context && typeof context.setData === 'function') {
                  context.setData({ [key]: newValue });
                }
              }
            }
          };

          if (context && typeof context.setData === 'function') {
            context.setData({ [key]: value });
          }

          this.refs.set(key, refObject);
          return refObject;
        },

        // 创建 reactive
        reactive(target) {
          const key = 'reactive_' + this.generateId();
          const self = this;

          function createProxy(obj, path = []) {
            return new Proxy(obj, {
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
                        ? key + '.' + [...path, prop].join('.')
                        : key + '.' + prop;
                      context.setData({ [fullPath]: newValue });
                    }
                  }
                }
                return true;
              }
            });
          }

          const proxy = createProxy(target);
          if (context && typeof context.setData === 'function') {
            context.setData({ [key]: target });
          }

          this.reactives.set(key, proxy);
          return proxy;
        },

        // 创建 computed
        computed(getter) {
          const key = 'computed_' + this.generateId();
          let _value;
          let _dirty = true;

          const computedRef = {
            _isComputed: true,
            _key: key,
            get value() {
              if (_dirty) {
                _value = getter();
                _dirty = false;
                if (context && typeof context.setData === 'function') {
                  context.setData({ [key]: _value });
                }
              }
              return _value;
            }
          };

          const initialValue = computedRef.value;
          this.computeds.set(key, computedRef);
          return computedRef;
        }
      };

      this.reactiveInstances.set(context, reactiveSystem);
      return reactiveSystem;
    }

    createApp(appConfig) {
      if (!this.isInitialized) {
        throw new Error('运行时库尚未初始化');
      }

      return {
        config: appConfig,
        mount() {
          if (this.config.debug) {
            console.log('[Vue3MiniRuntime] 应用实例已创建');
          }
        }
      };
    }

    createPage(pageConfig) {
      if (!this.isInitialized) {
        throw new Error('运行时库尚未初始化');
      }

      const self = this;

      // 返回小程序页面配置
      return {
        ...pageConfig,
        onLoad() {
          // 创建响应式系统
          const reactiveSystem = self.createReactiveSystem(this);

          // 将响应式 API 添加到页面实例
          this.ref = reactiveSystem.ref.bind(reactiveSystem);
          this.reactive = reactiveSystem.reactive.bind(reactiveSystem);
          this.computed = reactiveSystem.computed.bind(reactiveSystem);

          // 根据页面配置创建响应式变量
          if (pageConfig._reactiveVariables) {
            pageConfig._reactiveVariables.forEach(varInfo => {
              if (varInfo.type === 'ref') {
                // 创建响应式变量
                const reactiveVar = this.ref(varInfo.initialValue);
                this[varInfo.name] = reactiveVar;

                // 创建与 data 对象同步的代理
                const self = this;
                Object.defineProperty(this, varInfo.name, {
                  get() {
                    return {
                      get value() {
                        return reactiveVar.value;
                      },
                      set value(newValue) {
                        reactiveVar.value = newValue;
                        // 同步到 data 对象
                        const updateData = {};
                        updateData[varInfo.name] = newValue;
                        self.setData(updateData);
                      }
                    };
                  },
                  configurable: true
                });
              } else if (varInfo.type === 'reactive') {
                // 创建响应式对象
                const reactiveObj = this.reactive(varInfo.initialValue);
                this[varInfo.name] = reactiveObj;

                // 同步到 data 对象
                const updateData = {};
                updateData[varInfo.name] = varInfo.initialValue;
                this.setData(updateData);
              } else if (varInfo.type === 'computed') {
                // computed 需要特殊处理，因为它需要 getter 函数
                const computedVar = this.computed(() => varInfo.initialValue);
                this[varInfo.name] = computedVar;

                // 同步到 data 对象
                const updateData = {};
                updateData[varInfo.name] = computedVar.value;
                this.setData(updateData);
              }
            });
          }

          if (self.config.debug) {
            console.log('[Vue3MiniRuntime] 页面加载:', pageConfig);
            console.log('[Vue3MiniRuntime] 响应式系统已初始化');
            if (pageConfig._reactiveVariables) {
              console.log('[Vue3MiniRuntime] 响应式变量已创建:', pageConfig._reactiveVariables.map(v => v.name));
            }
          }

          if (pageConfig.onLoad) {
            pageConfig.onLoad.apply(this, arguments);
          }
        }
      };
    }

    createComponent(componentConfig) {
      if (!this.isInitialized) {
        throw new Error('运行时库尚未初始化');
      }

      const self = this;

      // 返回小程序组件配置
      return {
        ...componentConfig,

        // 组件数据
        data() {
          // 创建组件实例的响应式数据
          const componentData = componentConfig.data ? componentConfig.data() : {};

          // 添加 Vue 响应式变量的支持
          const vueContext = this.createVueContext(componentConfig);

          return {
            ...componentData,
            ...vueContext.data
          };
        },

        // 组件方法
        methods: {
          ...this.createVueMethods(componentConfig)
        },

        attached() {
          // 创建响应式系统
          const reactiveSystem = self.createReactiveSystem(this);

          // 将响应式 API 添加到组件实例
          this.ref = reactiveSystem.ref.bind(reactiveSystem);
          this.reactive = reactiveSystem.reactive.bind(reactiveSystem);
          this.computed = reactiveSystem.computed.bind(reactiveSystem);

          // 根据组件配置创建响应式变量
          if (componentConfig._reactiveVariables) {
            componentConfig._reactiveVariables.forEach(varInfo => {
              if (varInfo.type === 'ref') {
                // 创建响应式变量
                const reactiveVar = this.ref(varInfo.initialValue);

                // 创建与 data 对象同步的代理
                const self = this;
                Object.defineProperty(this, varInfo.name, {
                  get() {
                    return {
                      get value() {
                        return reactiveVar.value;
                      },
                      set value(newValue) {
                        reactiveVar.value = newValue;
                        // 同步到 data 对象
                        const updateData = {};
                        updateData[varInfo.name] = newValue;
                        self.setData(updateData);
                      }
                    };
                  },
                  configurable: true
                });
              } else if (varInfo.type === 'reactive') {
                // 创建响应式对象
                const reactiveObj = this.reactive(varInfo.initialValue);
                this[varInfo.name] = reactiveObj;

                // 同步到 data 对象
                const updateData = {};
                updateData[varInfo.name] = varInfo.initialValue;
                this.setData(updateData);
              } else if (varInfo.type === 'computed') {
                // computed 需要特殊处理，因为它需要 getter 函数
                const computedVar = this.computed(() => varInfo.initialValue);
                this[varInfo.name] = computedVar;

                // 同步到 data 对象
                const updateData = {};
                updateData[varInfo.name] = computedVar.value;
                this.setData(updateData);
              }
            });
          }

          // 初始化 Vue 上下文
          this.vueContext = this.createVueContext(componentConfig);

          if (self.config.debug) {
            console.log('[Vue3MiniRuntime] 组件附加:', componentConfig);
            console.log('[Vue3MiniRuntime] 响应式系统已初始化');
            if (componentConfig._reactiveVariables) {
              console.log('[Vue3MiniRuntime] 响应式变量已创建:', componentConfig._reactiveVariables.map(v => v.name));
            }
          }
          if (componentConfig.attached) {
            componentConfig.attached.apply(this, arguments);
          }
        }
      };
    }

    // 创建 Vue 上下文
    createVueContext(componentConfig) {
      const context = {
        data: {},
        props: componentConfig.properties || {},
        emit: (eventName, ...args) => {
          this.triggerEvent(eventName, ...args);
        }
      };

      // 添加响应式变量支持
      if (componentConfig.data) {
        const data = componentConfig.data();
        Object.keys(data).forEach(key => {
          context.data[key] = data[key];
        });
      }

      return context;
    }

    // 创建 Vue 方法
    createVueMethods(componentConfig) {
      const methods = {};

      // 包装组件方法，将 Vue 变量转换为小程序 API
      if (componentConfig.methods) {
        Object.entries(componentConfig.methods).forEach(([name, methodBody]) => {
          methods[name] = function(...args) {
            // 创建一个安全的执行环境
            const context = {
              // 小程序组件 API
              properties: this.properties || {},
              data: this.data || {},
              triggerEvent: this.triggerEvent ? this.triggerEvent.bind(this) : () => {},
              setData: this.setData ? this.setData.bind(this) : () => {},

              // Vue 兼容 API
              props: this.properties || {},
              emit: (eventName, ...eventArgs) => {
                if (this.triggerEvent) {
                  this.triggerEvent(eventName, ...eventArgs);
                }
              },
              showDetails: {
                get value() {
                  return context.data.showDetails || false;
                },
                set value(val) {
                  if (context.setData) {
                    context.setData({ showDetails: val });
                  }
                }
              }
            };

            // 在全局临时设置 Vue 变量
            const originalProps = global.props;
            const originalEmit = global.emit;
            const originalShowDetails = global.showDetails;

            try {
              global.props = context.props;
              global.emit = context.emit;
              global.showDetails = context.showDetails;

              // 如果方法体是字符串，需要在正确的上下文中执行
              if (typeof methodBody === 'string') {
                // 创建一个函数来执行方法体
                const func = new Function('props', 'emit', 'showDetails', 'wx', methodBody);
                return func.call(this, context.props, context.emit, context.showDetails, global.wx || {});
              } else if (typeof methodBody === 'function') {
                return methodBody.apply(this, args);
              }
            } finally {
              // 恢复全局变量
              global.props = originalProps;
              global.emit = originalEmit;
              global.showDetails = originalShowDetails;
            }
          };
        });
      }

      return methods;
    }
  }

  // 添加到命名空间
  Vue3MiniRuntime.Core = Vue3MiniRuntimeCore;

  // 导出运行时库
  if (typeof module !== 'undefined' && module.exports) {
    module.exports = Vue3MiniRuntime;
  } else {
    global.Vue3MiniRuntime = Vue3MiniRuntime;
  }

  // 将运行时库类暴露到全局，供后续函数使用
  global.Vue3MiniRuntimeCore = Vue3MiniRuntimeCore;

})(typeof global !== 'undefined' ? global : this);


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

    // 创建运行时实例（使用全局暴露的类）
    runtimeInstance = new global.Vue3MiniRuntimeCore(config);
    
    // 初始化运行时
    await runtimeInstance.init();
    
    isInitialized = true;
    
    if (config.debug) {
      console.log('[Vue3Runtime] 运行时库初始化成功', {
        version: config.version,
        modules: config.modules,
        features: Object.keys(config.features).filter(key => 
          Object.values(config.features[key]).some(Boolean)
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
  // 如果运行时未初始化，返回延迟初始化的页面
  if (!isInitialized) {
    return {
      ...pageConfig,
      onLoad() {
        // 在页面加载时检查运行时是否已初始化
        if (isInitialized) {
          const runtime = getRuntime();

          // 手动执行运行时的页面初始化逻辑
          // 创建响应式系统
          const reactiveSystem = runtime.createReactiveSystem(this);

          // 将响应式 API 添加到页面实例
          this.ref = reactiveSystem.ref.bind(reactiveSystem);
          this.reactive = reactiveSystem.reactive.bind(reactiveSystem);
          this.computed = reactiveSystem.computed.bind(reactiveSystem);

          // 根据页面配置创建响应式变量
          if (pageConfig._reactiveVariables) {
            pageConfig._reactiveVariables.forEach(varInfo => {
              if (varInfo.type === 'ref') {
                // 创建响应式变量
                const reactiveVar = this.ref(varInfo.initialValue);

                // 创建与 data 对象同步的代理
                const self = this;
                Object.defineProperty(this, varInfo.name, {
                  get() {
                    return {
                      get value() {
                        return reactiveVar.value;
                      },
                      set value(newValue) {
                        reactiveVar.value = newValue;
                        // 同步到 data 对象
                        const updateData = {};
                        updateData[varInfo.name] = newValue;
                        self.setData(updateData);
                      }
                    };
                  },
                  configurable: true
                });
              } else if (varInfo.type === 'reactive') {
                // 创建响应式对象
                const reactiveObj = this.reactive(varInfo.initialValue);
                this[varInfo.name] = reactiveObj;

                // 同步到 data 对象
                const updateData = {};
                updateData[varInfo.name] = varInfo.initialValue;
                this.setData(updateData);
              } else if (varInfo.type === 'computed') {
                // computed 需要特殊处理，因为它需要 getter 函数
                const computedVar = this.computed(() => varInfo.initialValue);
                this[varInfo.name] = computedVar;

                // 同步到 data 对象
                const updateData = {};
                updateData[varInfo.name] = computedVar.value;
                this.setData(updateData);
              }
            });
          }
        } else {
          // 如果运行时仍未初始化，手动创建响应式变量
          if (pageConfig._reactiveVariables) {
            pageConfig._reactiveVariables.forEach(varInfo => {
              // 创建具有响应式能力的占位符
              const self = this;
              let currentValue = varInfo.initialValue;

              this[varInfo.name] = {
                get value() {
                  return currentValue;
                },
                set value(newValue) {
                  currentValue = newValue;
                  // 调用 setData 更新界面
                  const updateData = {};
                  updateData[varInfo.name] = newValue;
                  self.setData(updateData);
                },
                _isRef: true
              };

              // 初始化数据
              const initData = {};
              initData[varInfo.name] = varInfo.initialValue;
              this.setData(initData);
            });
          }
        }

        // 调用原始的 onLoad
        if (pageConfig.onLoad) {
          pageConfig.onLoad.apply(this, arguments);
        }
      }
    };
  }

  const runtime = getRuntime();
  return runtime.createPage(pageConfig);
}

/**
 * 创建组件
 */
function createComponent(componentConfig) {
  // 如果运行时未初始化，返回延迟初始化的组件
  if (!isInitialized) {
    return {
      ...componentConfig,
      attached() {
        // 在组件附加时检查运行时是否已初始化
        if (isInitialized) {
          const runtime = getRuntime();

          // 手动执行运行时的组件初始化逻辑
          // 创建响应式系统
          const reactiveSystem = runtime.createReactiveSystem(this);

          // 将响应式 API 添加到组件实例
          this.ref = reactiveSystem.ref.bind(reactiveSystem);
          this.reactive = reactiveSystem.reactive.bind(reactiveSystem);
          this.computed = reactiveSystem.computed.bind(reactiveSystem);

          // 根据组件配置创建响应式变量
          if (componentConfig._reactiveVariables) {
            componentConfig._reactiveVariables.forEach(varInfo => {
              if (varInfo.type === 'ref') {
                // 创建响应式变量
                const reactiveVar = this.ref(varInfo.initialValue);

                // 创建与 data 对象同步的代理
                const self = this;
                Object.defineProperty(this, varInfo.name, {
                  get() {
                    return {
                      get value() {
                        return reactiveVar.value;
                      },
                      set value(newValue) {
                        reactiveVar.value = newValue;
                        // 同步到 data 对象
                        const updateData = {};
                        updateData[varInfo.name] = newValue;
                        self.setData(updateData);
                      }
                    };
                  },
                  configurable: true
                });
              } else if (varInfo.type === 'reactive') {
                // 创建响应式对象
                const reactiveObj = this.reactive(varInfo.initialValue);
                this[varInfo.name] = reactiveObj;

                // 同步到 data 对象
                const updateData = {};
                updateData[varInfo.name] = varInfo.initialValue;
                this.setData(updateData);
              } else if (varInfo.type === 'computed') {
                // computed 需要特殊处理，因为它需要 getter 函数
                const computedVar = this.computed(() => varInfo.initialValue);
                this[varInfo.name] = computedVar;

                // 同步到 data 对象
                const updateData = {};
                updateData[varInfo.name] = computedVar.value;
                this.setData(updateData);
              }
            });
          }
        } else {
          // 如果运行时仍未初始化，手动创建响应式变量
          if (componentConfig._reactiveVariables) {
            componentConfig._reactiveVariables.forEach(varInfo => {
              // 创建具有响应式能力的占位符
              const self = this;
              let currentValue = varInfo.initialValue;

              this[varInfo.name] = {
                get value() {
                  return currentValue;
                },
                set value(newValue) {
                  currentValue = newValue;
                  // 调用 setData 更新界面
                  const updateData = {};
                  updateData[varInfo.name] = newValue;
                  self.setData(updateData);
                },
                _isRef: true
              };

              // 初始化数据
              const initData = {};
              initData[varInfo.name] = varInfo.initialValue;
              this.setData(initData);
            });
          }
        }

        // 调用原始的 attached
        if (componentConfig.attached) {
          componentConfig.attached.apply(this, arguments);
        }
      }
    };
  }

  const runtime = getRuntime();
  return runtime.createComponent(componentConfig);
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
  createApp,
  
  // 兼容性API
  definePage: createPage,
  defineComponent: createComponent,
  defineApp: createApp
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
    // 只提取上下文，完全忽略小程序配置
    const context = pageData.context

    // 生成页面选项对象（只使用 Vue 上下文）
    const pageOptions = this.generatePageOptions(context, null)

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
    return this.stringifyWithFunctions(this.filterInvalidOptions(options))
  }

  /**
   * 生成页面选项对象
   */
  private generatePageOptions(context: any, config: any): string {
    if (!context) {
      // 如果没有上下文，返回空对象
      return '{}'
    }

    const options: any = {
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
    }

    // 添加响应式变量信息（供运行时使用）
    if (context.reactiveVariables && context.reactiveVariables.size > 0) {
      const reactiveVarsArray = Array.from(context.reactiveVariables.values())
      options._reactiveVariables = reactiveVarsArray
    }

    // 过滤掉无效的属性
    return this.stringifyWithFunctions(this.filterInvalidOptions(options))
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

    return this.stringifyWithFunctions(options)
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
    const dataStr = this.stringifyObjectLiteral(filteredData, 2)
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
        const convertedBody = this.convertEventHandlerFunction(name, method.body)
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
   * 将对象序列化为字符串，保留函数
   */
  private stringifyWithFunctions(obj: any): string {
    const functionPlaceholders = new Map<string, string>()
    let placeholderIndex = 0

    // 第一步：将函数和函数字符串替换为占位符
    const processedObj = JSON.parse(JSON.stringify(obj, (key, value) => {
      if (typeof value === 'function') {
        const placeholder = `__FUNCTION_PLACEHOLDER_${placeholderIndex++}__`
        functionPlaceholders.set(placeholder, value.toString())
        return placeholder
      } else if (typeof value === 'string' && this.isFunctionString(value)) {
        // 检查是否为函数字符串，并转换箭头函数为普通函数
        const placeholder = `__FUNCTION_PLACEHOLDER_${placeholderIndex++}__`
        const convertedFunction = this.convertArrowFunctionToRegular(value)
        functionPlaceholders.set(placeholder, convertedFunction)
        return placeholder
      } else if (typeof value === 'string' && this.isExpressionString(value)) {
        // 检查是否为表达式字符串（如 new Date(), 对象字面量等）
        const placeholder = `__EXPRESSION_PLACEHOLDER_${placeholderIndex++}__`
        functionPlaceholders.set(placeholder, value)
        return placeholder
      } else if (typeof value === 'string' && ['String', 'Number', 'Boolean', 'Object', 'Array'].includes(value)) {
        // 特殊处理小程序类型构造函数，避免被JSON.stringify包装成字符串
        const placeholder = `__TYPE_PLACEHOLDER_${placeholderIndex++}__`
        functionPlaceholders.set(placeholder, value)
        return placeholder
      }
      return value
    }))

    // 第二步：序列化对象，使用自定义格式
    let result = this.stringifyObjectLiteral(processedObj, 2)

    // 第三步：恢复函数
    for (const [placeholder, functionCode] of functionPlaceholders) {
      result = result.replace(`"${placeholder}"`, functionCode)
    }

    // 第四步：转换所有剩余的箭头函数为普通函数
    result = this.convertAllArrowFunctions(result)

    return result
  }

  /**
   * 检查字符串是否为函数代码
   */
  private isFunctionString(str: string): boolean {
    if (!str || typeof str !== 'string') return false

    // 检查是否为箭头函数
    if (str.includes('=>')) return true

    // 检查是否为普通函数
    if (str.startsWith('function')) return true

    // 检查是否为函数体（包含大括号和return等关键字）
    if (str.includes('{') && str.includes('}')) {
      return str.includes('return') || str.includes('if') || str.includes('for') || str.includes('while')
    }

    return false
  }

  /**
   * 将对象序列化为 JavaScript 对象字面量格式（不给属性名加引号）
   */
  private stringifyObjectLiteral(obj: any, indent: number = 0): string {
    if (obj === null) return 'null'
    if (obj === undefined) return 'undefined'
    if (typeof obj === 'boolean') return obj.toString()
    if (typeof obj === 'number') return obj.toString()
    if (typeof obj === 'string') {
      // 检查是否为表达式字符串，如果是则不添加引号
      if (this.isExpressionString(obj)) {
        return obj
      }
      return JSON.stringify(obj)
    }

    if (Array.isArray(obj)) {
      const items = obj.map(item => this.stringifyObjectLiteral(item, indent + 2))
      return `[${items.join(', ')}]`
    }

    if (typeof obj === 'object') {
      const spaces = ' '.repeat(indent)
      const nextSpaces = ' '.repeat(indent + 2)
      const entries = Object.entries(obj).map(([key, value]) => {
        const valueStr = this.stringifyObjectLiteral(value, indent + 2)
        return `${nextSpaces}${key}: ${valueStr}`
      })

      if (entries.length === 0) {
        return '{}'
      }

      return `{\n${entries.join(',\n')}\n${spaces}}`
    }

    return String(obj)
  }

  /**
   * 检查字符串是否为表达式代码
   */
  private isExpressionString(str: string): boolean {
    if (!str || typeof str !== 'string') return false

    // 检查是否为布尔值
    if (str === 'true' || str === 'false') return true

    // 检查是否为数字
    if (/^\d+(\.\d+)?$/.test(str)) return true

    // 检查是否为小程序类型构造函数（不加引号）
    if (['String', 'Number', 'Boolean', 'Object', 'Array'].includes(str)) return true

    // 检查是否为 new 表达式（但不包含this的表达式，因为在data中不能使用this）
    if (str.startsWith('new ') && !str.includes('this.')) return true

    // 检查是否为对象字面量
    if (str.startsWith('{') && str.endsWith('}') && !str.includes('this.')) return true

    // 检查是否为数组字面量
    if (str.startsWith('[') && str.endsWith(']') && !str.includes('this.')) return true

    // 检查是否为计算表达式（但不包含this）
    if (str.includes('(') && str.includes(')') && !str.includes('=>') && !str.startsWith('function') && !str.includes('this.')) {
      return true
    }

    // 不允许this.开头的表达式在data中使用
    if (str.startsWith('this.')) return false

    // 检查是否为函数调用（但不包含this）
    if (/^\w+\(.*\)$/.test(str) && !str.includes('this.')) return true

    return false
  }

  /**
   * 将箭头函数转换为普通函数
   */
  private convertArrowFunctionToRegular(functionStr: string): string {
    if (!functionStr || typeof functionStr !== 'string') {
      return functionStr
    }

    // 检查是否为箭头函数
    if (!functionStr.includes('=>')) {
      return functionStr
    }

    // 简单的箭头函数转换
    // 匹配 (参数) => { 函数体 } 或 参数 => { 函数体 }
    const arrowFunctionRegex = /^(\([^)]*\)|[^=]+)\s*=>\s*(.+)$/s
    const match = functionStr.match(arrowFunctionRegex)

    if (match && match[1] && match[2]) {
      let params = match[1].trim()
      const body = match[2].trim()

      // 移除参数周围的括号（如果只有一个参数且没有括号）
      if (params.startsWith('(') && params.endsWith(')')) {
        params = params.slice(1, -1)
      }

      // 如果函数体不是以 { 开始，说明是表达式，需要添加 return
      if (!body.startsWith('{')) {
        return `function(${params}) { return ${body} }`
      } else {
        return `function(${params}) ${body}`
      }
    }

    return functionStr
  }

  /**
   * 检测并转换事件处理函数，使其能够从dataset中获取参数
   */
  private convertEventHandlerFunction(functionName: string, functionStr: string): string {
    if (!functionStr || typeof functionStr !== 'string') {
      return functionStr
    }

    // 检测是否为事件处理器
    if (!this.isEventHandlerName(functionName)) {
      return functionStr
    }

    // 检测普通函数格式: function(params) { body }
    const functionRegex = /^function\s*\(\s*([^)]+)\s*\)\s*\{([\s\S]*)\}$/
    const functionMatch = functionStr.match(functionRegex)

    if (functionMatch && functionMatch[1] && functionMatch[2]) {
      const params = functionMatch[1].trim()
      const body = functionMatch[2].trim()

      // 如果函数只有一个参数，则转换它
      if (params && !params.includes(',')) {
        const paramName = params.trim()

        // 在函数体开头添加从dataset获取参数的代码
        const newBody = `
    // 从事件对象的dataset中获取参数
    const ${paramName} = event.currentTarget.dataset.arg0;
    ${body}`

        return `function(event) {${newBody}
  }`
      }
    }

    // 检测箭头函数格式: (params) => { body } 或 params => { body }
    const arrowRegex = /^(\([^)]*\)|[^=]+)\s*=>\s*\{([\s\S]*)\}$/
    const arrowMatch = functionStr.match(arrowRegex)

    if (arrowMatch && arrowMatch[1] && arrowMatch[2]) {
      let params = arrowMatch[1].trim()
      const body = arrowMatch[2].trim()

      // 移除参数周围的括号（如果存在）
      if (params.startsWith('(') && params.endsWith(')')) {
        params = params.slice(1, -1)
      }

      // 如果函数只有一个参数，则转换它
      if (params && !params.includes(',')) {
        const paramName = params.trim()

        // 在函数体开头添加从dataset获取参数的代码
        const newBody = `
    // 从事件对象的dataset中获取参数
    const ${paramName} = event.currentTarget.dataset.arg0;
    ${body}`

        return `function(event) {${newBody}
  }`
      }
    }

    return functionStr
  }

  /**
   * 判断函数名是否看起来像事件处理器
   */
  private isEventHandlerName(functionName: string): boolean {
    const eventHandlerPatterns = [
      /^handle/i,      // handleClick, handleMenuClick
      /^on[A-Z]/,      // onClick, onSubmit
      /Click$/,        // menuClick, buttonClick
      /Tap$/,          // menuTap, itemTap
      /Press$/,        // longPress
      /Touch$/,        // touchStart, touchEnd
    ]

    return eventHandlerPatterns.some(pattern => pattern.test(functionName))
  }

  /**
   * 转换字符串中的所有箭头函数为普通函数
   */
  private convertAllArrowFunctions(str: string): string {
    // 匹配对象方法中的箭头函数：  "methodName": (params) => { body }
    // 更精确的正则表达式，处理多行函数体
    const methodArrowRegex = /("[\w]+"):\s*(\([^)]*\)|\w*)\s*=>\s*\{([\s\S]*?)\}/g

    return str.replace(methodArrowRegex, (match, methodName, params, body) => {
      // 移除参数周围的括号（如果存在）
      let cleanParams = params.trim()
      if (cleanParams.startsWith('(') && cleanParams.endsWith(')')) {
        cleanParams = cleanParams.slice(1, -1)
      }

      return `${methodName}: function(${cleanParams}) {${body}}`
    })
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
