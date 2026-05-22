/**
 * 代码生成器
 * 生成优化的运行时注入代码
 */

import type { Vue3FeatureUsage, RuntimeInjectionConfig } from './runtime-injector'
import type { BundleResult } from './runtime-bundler'
import { ObjectLiteralSerializer } from './codegen/object-serializer'
import { RuntimeInjectionGenerator } from './codegen/runtime-injection-generator'
import {
  createComputedOptions,
  createLifecycleOptions,
  createPropertyOptions,
  createWatcherOptions,
  filterDataInitializationFields,
  filterInvalidOptions,
  generateCodeFileHeader,
  getRelativeRuntimePath
} from './codegen/code-generator-utils'
import {
  generateComponentTemplateHandlers,
  generateComputedRuntimeMethods,
  generatePageTemplateHandlers
} from './codegen/native-template-handler-generator'
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
  private runtimeInjectionGenerator: RuntimeInjectionGenerator

  constructor(config: RuntimeInjectionConfig, options: Partial<CodeGenerationOptions> = {}) {
    this.config = config
    this.runtimeInjectionGenerator = new RuntimeInjectionGenerator(config)
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

    const content = this.runtimeInjectionGenerator.generateRuntimeInjectionCode(
      bundleResult,
      featureUsage,
      generateCodeFileHeader(this.config, this.options)
    )

    return {
      path: 'runtime-injection.js',
      content,
      type: 'js',
      isRuntime: true
    }
  }


  /**
   * 生成应用入口代码
   */
  generateAppCode(appData: any): GeneratedFile {
    // 提取应用上下文（如果存在）
    const context = appData?.context
    const appOptions = context ? this.generateAppOptions(context) : '{}'

    const content = `${generateCodeFileHeader(this.config, this.options)}

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
    const templateResult = pageData.template
    const config = pageData.context ? null : pageData // 如果没有context，说明pageData就是配置

    // 生成页面选项对象
    const pageOptions = this.generatePageOptions(context, config, templateResult)

    const content = `${generateCodeFileHeader(this.config, this.options)}

// 引入运行时
const { createPage } = require('${getRelativeRuntimePath(pagePath)}');

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
    const templateResult = componentData.template

    // 生成组件选项对象（不传递配置）
    const componentOptions = this.generateComponentOptions(context, null, templateResult)

    const content = `${generateCodeFileHeader(this.config, this.options)}

// 引入运行时
const { createComponent } = require('${getRelativeRuntimePath(componentPath)}');

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
      ...createComputedOptions(context.computed),

      // Vue 监听器
      ...createWatcherOptions(context.watch),

      // Vue 生命周期
      ...createLifecycleOptions(context.lifecycle)
    }

    // 过滤掉无效的属性
    return this.serializer.stringifyWithFunctions(filterInvalidOptions(options))
  }

  /**
   * 生成页面选项对象
   */
  private generatePageOptions(context: any, config: any, templateResult?: any): string {
    const options: any = {}

    // 如果有上下文，添加 Vue 相关选项
    if (context) {
      Object.assign(options, {
        // Vue 组件数据
        data: this.generateDataFunction(context.data),

        // Vue 组件方法（页面方法直接放在根级别）
        ...this.generateMethods(context.methods),

        // 模板派生事件处理器
        ...generatePageTemplateHandlers(templateResult),

        // Vue 计算属性
        ...generateComputedRuntimeMethods(context.computed),

        // Vue 监听器
        ...createWatcherOptions(context.watch),

        // Vue 生命周期
        ...createLifecycleOptions(context.lifecycle)
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
    return this.serializer.stringifyWithFunctions(filterInvalidOptions(options))
  }

  /**
   * 生成组件选项对象
   */
  private generateComponentOptions(context: any, config: any, templateResult?: any): string {
    if (!context) {
      // 如果没有上下文，返回空对象
      return '{}'
    }

    const options: any = {
      // Vue 组件数据
      data: this.generateDataFunction(context.data),

      // Vue 组件属性
      properties: createPropertyOptions(context.props),

      // Vue 组件方法
      methods: {
        ...this.generateMethods(context.methods),
        ...generateComponentTemplateHandlers(templateResult, context.emits),
        ...generateComputedRuntimeMethods(context.computed)
      },

      // Vue 监听器
      ...createWatcherOptions(context.watch),

      // Vue 生命周期
      ...createLifecycleOptions(context.lifecycle)
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

    // 创建一个包含实际数据的函数字符串，使用 stringifyObjectLiteral 生成正确的小程序格式
    const dataStr = this.serializer.stringifyObjectLiteral(filterDataInitializationFields(data), 2)
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
