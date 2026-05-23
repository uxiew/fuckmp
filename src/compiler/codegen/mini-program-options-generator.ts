/**
 * 小程序 Page / Component / App options 生成器。
 */

import { ObjectLiteralSerializer } from './object-serializer'
import {
  createComputedOptions,
  createLifecycleOptions,
  createPropertyOptions,
  createWatcherOptions,
  filterDataInitializationFields,
  filterInvalidOptions
} from './code-generator-utils'
import {
  generateComponentTemplateHandlers,
  generateComputedRuntimeMethods,
  generatePageTemplateHandlers
} from './native-template-handler-generator'

/**
 * 生成小程序 options 对象字面量字符串。
 */
export class MiniProgramOptionsGenerator {
  private serializer: ObjectLiteralSerializer

  constructor(serializer: ObjectLiteralSerializer = new ObjectLiteralSerializer()) {
    this.serializer = serializer
  }

  /**
   * 生成应用选项对象。
   */
  generateAppOptions(context: any): string {
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

    return this.serializer.stringifyWithFunctions(filterInvalidOptions(options))
  }

  /**
   * 生成页面选项对象。
   */
  generatePageOptions(context: any, config: any, templateResult?: any): string {
    const options: any = {}

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

      if (context.reactiveVariables && context.reactiveVariables.size > 0) {
        options._reactiveVariables = Array.from(context.reactiveVariables.values())
      }
    }

    if (config) {
      Object.assign(options, config)
    }

    if (!context && !config) {
      return '{}'
    }

    return this.serializer.stringifyWithFunctions(filterInvalidOptions(options))
  }

  /**
   * 生成组件选项对象。
   */
  generateComponentOptions(context: any, config: any, templateResult?: any): string {
    void config

    if (!context) {
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

    if (context.reactiveVariables && context.reactiveVariables.size > 0) {
      options._reactiveVariables = Array.from(context.reactiveVariables.values())
    }

    return this.serializer.stringifyWithFunctions(options)
  }

  /**
   * 生成 data 初始化对象。
   */
  private generateDataFunction(data: any): any {
    if (!data || Object.keys(data).length === 0) {
      return function () { return {} }
    }

    return this.serializer.stringifyObjectLiteral(filterDataInitializationFields(data), 2)
  }

  /**
   * 生成方法选项。
   */
  private generateMethods(methods: any): any {
    if (!methods || Object.keys(methods).length === 0) {
      return {}
    }

    const result: any = {}
    Object.entries(methods).forEach(([name, method]: [string, any]) => {
      if (method && typeof method.body === 'string') {
        result[name] = this.serializer.convertEventHandlerFunction(name, method.body)
      }
    })
    return result
  }
}
