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

      // 返回小程序页面配置
      return {
        ...pageConfig,
        onLoad() {
          if (this.config.debug) {
            console.log('[Vue3MiniRuntime] 页面加载:', pageConfig);
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

      // 返回小程序组件配置
      return {
        ...componentConfig,
        attached() {
          if (this.config.debug) {
            console.log('[Vue3MiniRuntime] 组件附加:', componentConfig);
          }
          if (componentConfig.attached) {
            componentConfig.attached.apply(this, arguments);
          }
        }
      };
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
          const actualPage = runtime.createPage(pageConfig);
          // 将实际页面的方法复制到当前页面
          Object.assign(this, actualPage);
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
          const actualComponent = runtime.createComponent(componentConfig);
          // 将实际组件的方法复制到当前组件
          Object.assign(this, actualComponent);
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
    // 提取配置和上下文
    const config = pageData.config || pageData
    const context = pageData.context

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

    return this.stringifyWithFunctions(options)
  }

  /**
   * 生成页面选项对象
   */
  private generatePageOptions(context: any, config: any): string {
    if (!context) {
      // 如果没有上下文，只返回配置
      return JSON.stringify(config || {}, null, 2)
    }

    const options: any = {
      // 小程序配置
      ...config,

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

    return this.stringifyWithFunctions(options)
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
      filteredData[key] = value
    })

    // 创建一个包含实际数据的函数字符串
    const dataStr = JSON.stringify(filteredData, null, 2)
    return `function() { return ${dataStr} }`
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
        // 直接使用方法体字符串，让 stringifyWithFunctions 处理
        result[name] = method.body
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

    // 映射 Vue 生命周期到小程序生命周期
    const lifecycleMap: Record<string, string> = {
      onMounted: 'attached',
      onUnmounted: 'detached',
      onUpdated: 'moved',
      onBeforeMount: 'created',
      onBeforeUnmount: 'detached'
    }

    Object.entries(lifecycle).forEach(([vueHook, handler]: [string, any]) => {
      const mpHook = lifecycleMap[vueHook] || vueHook
      if (handler) {
        result[mpHook] = handler
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
   * 映射 Vue 类型到小程序类型
   */
  private mapVueTypeToMiniProgram(vueType: any): string {
    if (!vueType) return 'null'

    if (typeof vueType === 'string') {
      switch (vueType.toLowerCase()) {
        case 'string': return 'String'
        case 'number': return 'Number'
        case 'boolean': return 'Boolean'
        case 'array': return 'Array'
        case 'object': return 'Object'
        default: return 'null'
      }
    }

    return 'null'
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
        // 检查是否为函数字符串
        const placeholder = `__FUNCTION_PLACEHOLDER_${placeholderIndex++}__`
        functionPlaceholders.set(placeholder, value)
        return placeholder
      }
      return value
    }))

    // 第二步：序列化对象
    let result = JSON.stringify(processedObj, null, 2)

    // 第三步：恢复函数
    for (const [placeholder, functionCode] of functionPlaceholders) {
      result = result.replace(`"${placeholder}"`, functionCode)
    }

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
