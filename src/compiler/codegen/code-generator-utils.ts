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
