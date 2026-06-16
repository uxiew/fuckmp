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
      ...createAppLifecycleOptions(context.lifecycle)
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
        ...this.generateMethods(context.methods, templateResult?.customEventHandlers),

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
        ...this.generateMethods(context.methods, templateResult?.customEventHandlers),
        ...generateComponentTemplateHandlers(templateResult, context.emits),
        ...generateComputedRuntimeMethods(context.computed)
      },

      // Vue 监听器
      ...createWatcherOptions(context.watch),

      // Vue 生命周期
      ...createLifecycleOptions(context.lifecycle)
    }

    // 如果模板中有 slot，启用多插槽支持
    if (templateResult?.wxml?.includes('<slot')) {
      options.options = { multipleSlots: true }
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
  private generateMethods(methods: any, detailEventHandlers: Set<string> = new Set()): any {
    if (!methods || Object.keys(methods).length === 0) {
      return {}
    }

    const result: any = {}
    Object.entries(methods).forEach(([name, method]: [string, any]) => {
      if (method && typeof method.body === 'string') {
        result[name] = this.serializer.convertEventHandlerFunction(name, method.body, {
          singleParamSource: detailEventHandlers.has(name) ? 'detail' : 'dataset'
        })
      }
    })
    return result
  }
}


/**
 * 将已映射的小程序生命周期归一为 App 可调用选项。
 *
 * App 没有 Component.lifetimes；当 app.vue 因非 page 上下文把 `onMounted`
 * 映射为 `attached` 时，需要在 App 生成路径收敛为微信原生 `onLaunch`，
 * 否则回调会停留在不可调用的 `lifetimes.attached` 中。
 */
function createAppLifecycleOptions(lifecycle: any): any {
  const options = createLifecycleOptions(lifecycle)
  const attached = options.lifetimes?.attached

  if (!attached) {
    return options
  }

  const normalized = { ...options }
  const lifetimes = { ...normalized.lifetimes }
  delete lifetimes.attached

  if (Object.keys(lifetimes).length > 0) {
    normalized.lifetimes = lifetimes
  } else {
    delete normalized.lifetimes
  }

  normalized.onLaunch = mergeLifecycleFunctionStrings(attached, normalized.onLaunch)
  return normalized
}

/** 合并两个生命周期函数字符串，保持 App onLaunch 原生可调用。 */
function mergeLifecycleFunctionStrings(first: string, second?: string): string {
  const bodies = [first, second]
    .filter((value): value is string => Boolean(value && value.trim()))
    .map(extractFunctionBody)
    .filter(Boolean)

  return `function(options) {
    ${bodies.join('\n    ')}
  }`
}

function extractFunctionBody(functionString: string): string {
  const match = functionString.match(/^function\s*\([^)]*\)\s*\{([\s\S]*)\}$/)
  return (match?.[1] || functionString).trim()
}
