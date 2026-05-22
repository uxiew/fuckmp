/**
 * CodeGenerator 轻量代码片段工具。
 */
import type { RuntimeInjectionConfig } from '../runtime-injector'

/**
 * 代码文件头生成所需选项。
 */
export interface CodeFileHeaderOptions {
  /** 目标平台。 */
  target: string
  /** 是否启用严格模式。 */
  strict: boolean
}

/**
 * 生成编译产物文件头。
 */
export function generateCodeFileHeader(
  config: Pick<RuntimeInjectionConfig, 'runtimeVersion'>,
  options: CodeFileHeaderOptions
): string {
  const timestamp = new Date().toISOString()
  return `// 由 Vue3 微信小程序编译器自动生成
// 编译时间: ${timestamp}
// 运行时版本: ${config.runtimeVersion}
// 目标平台: ${options.target}
${options.strict ? "'use strict';" : ''}
`
}

/**
 * 根据页面/组件输出路径计算运行时注入文件相对路径。
 */
export function getRelativeRuntimePath(filePath: string): string {
  const depth = filePath.split('/').length - 1
  const prefix = depth > 0 ? '../'.repeat(depth) : './'
  return `${prefix}runtime-injection.js`
}

/**
 * 映射 Vue prop 类型到小程序类型构造函数名。
 */
export function mapVueTypeToMiniProgram(vueType: any): string {
  if (!vueType) return 'Object'

  if (typeof vueType === 'string') {
    return mapTypeName(vueType)
  }

  if (typeof vueType === 'function') {
    return mapTypeName(vueType.name)
  }

  return 'Object'
}

/**
 * 过滤小程序选项中的空值和无效生命周期占位。
 */
export function filterInvalidOptions(options: any): any {
  const filtered: any = {}

  Object.entries(options).forEach(([key, value]) => {
    if (
      ['attached', 'onReady', 'onShow', 'onHide', 'onUnload'].includes(key) &&
      typeof value === 'string' &&
      value.includes('无效的回调函数')
    ) {
      return
    }

    if ((value !== null && value !== undefined && value !== '') || Array.isArray(value)) {
      filtered[key] = value
    }
  })

  return filtered
}

/**
 * 过滤 data 初始化阶段不能安全写入的字段。
 */
export function filterDataInitializationFields(data: any): any {
  const filteredData: any = {}

  Object.entries(data).forEach(([key, value]) => {
    const valueStr = String(value)

    if (
      valueStr.includes('defineProps') ||
      valueStr.includes('defineEmits') ||
      valueStr.includes('withDefaults') ||
      key === 'props' ||
      key === 'emit'
    ) {
      return
    }

    if (
      ['attached', 'onReady', 'onShow', 'onHide', 'onUnload'].includes(key) &&
      typeof value === 'string' &&
      value.includes('无效的回调函数')
    ) {
      return
    }

    if (typeof value === 'string' && value.includes('this.')) {
      return
    }

    if (['now', 'lastActive'].includes(key)) {
      return
    }

    filteredData[key] = value
  })

  return filteredData
}

/**
 * 将编译出的 computed getter 转成小程序可调用方法。
 */
export function createComputedOptions(computed: any): any {
  if (!computed || Object.keys(computed).length === 0) {
    return {}
  }

  const result: any = {}
  Object.entries(computed).forEach(([name, comp]: [string, any]) => {
    if (comp && comp.getter) {
      result[`get${name.charAt(0).toUpperCase() + name.slice(1)}`] = comp.getter
    }
  })
  return result
}

/**
 * 将编译出的 watcher 转成小程序 observers 选项。
 */
export function createWatcherOptions(watchers: any): any {
  if (!watchers || Object.keys(watchers).length === 0) {
    return {}
  }

  return {
    observers: watchers
  }
}

/**
 * 将已映射的小程序生命周期 handler 转成页面/组件 options。
 */
export function createLifecycleOptions(lifecycle: any): any {
  if (!lifecycle || Object.keys(lifecycle).length === 0) {
    return {}
  }

  const result: any = {}

  Object.entries(lifecycle).forEach(([hookName, handler]: [string, any]) => {
    if (!handler || typeof handler !== 'string' || !handler.trim()) {
      return
    }

    if (hookName === 'onLoad') {
      result[hookName] = `function(options) {\n    ${handler.trim()}\n  }`
    } else if (hookName.startsWith('pageLifetimes.')) {
      const pageLifetimeName = hookName.replace('pageLifetimes.', '')
      result.pageLifetimes ??= {}
      result.pageLifetimes[pageLifetimeName] = `function() {\n    ${handler.trim()}\n  }`
    } else if (['created', 'attached', 'detached', 'moved'].includes(hookName)) {
      result.lifetimes ??= {}
      result.lifetimes[hookName] = `function() {\n    ${handler.trim()}\n  }`
    } else {
      result[hookName] = `function() {\n    ${handler.trim()}\n  }`
    }
  })

  return result
}

/**
 * 将 Vue props 定义转成小程序 Component.properties。
 */
export function createPropertyOptions(props: any): any {
  if (!props || Object.keys(props).length === 0) {
    return {}
  }

  const result: any = {}
  Object.entries(props).forEach(([name, prop]: [string, any]) => {
    result[name] = {
      type: mapVueTypeToMiniProgram(prop.type),
      value: prop.default
    }
  })
  return result
}

/**
 * 将类型名规整为小程序类型构造函数名。
 */
function mapTypeName(typeName: string): string {
  switch (typeName.toLowerCase()) {
    case 'string':
      return 'String'
    case 'number':
      return 'Number'
    case 'boolean':
      return 'Boolean'
    case 'array':
      return 'Array'
    case 'object':
      return 'Object'
    default:
      return 'Object'
  }
}
