/**
 * 生成器共享工具函数。
 */

import { logger } from '@/utils/index.js'

/**
 * 组件引用日志标签。
 */
export interface UsingComponentsLogLabels {
  /** 成功解析组件引用时使用的日志前缀 */
  debugLabel: string
  /** 解析组件引用失败时使用的日志前缀 */
  errorLabel: string
}

/**
 * 生成小程序 `usingComponents` 配置。
 *
 * 保持页面和组件生成器现有路径归一化行为：移除 `.vue` 后缀，
 * 并去掉以 `./` 开头的相对路径前缀。
 */
export function generateUsingComponents(
  components: Map<string, string>,
  labels: UsingComponentsLogLabels
): Record<string, string> {
  const usingComponents: Record<string, string> = {}

  components.forEach((importPath, name) => {
    try {
      // 简单的路径处理，实际的路径解析在编译器层面处理
      const componentPath = importPath.replace(/\.vue$/, '').replace(/^\.\//, '')
      usingComponents[kebabCase(name)] = componentPath
      logger.debug(`${labels.debugLabel}: ${name} -> ${componentPath}`)
    } catch (error) {
      logger.error(`${labels.errorLabel}: ${name} -> ${importPath}`, error as Error)
      usingComponents[kebabCase(name)] = importPath.replace(/\.vue$/, '')
    }
  })

  return usingComponents
}

/**
 * 移除 WXML 中由模板转换阶段残留的 `_ctx.` 前缀。
 */
export function removeCtxPrefixes(wxml: string): string {
  // 移除事件绑定中的 _ctx. 前缀
  wxml = wxml.replace(/bind:(\w+)="_ctx\.([^"]+)"/g, 'bind:$1="$2"')

  // 移除条件渲染中的 _ctx. 前缀
  wxml = wxml.replace(/wx:(if|elif)="{{_ctx\.([^}]+)}}"/g, 'wx:$1="{{$2}}"')

  // 移除属性绑定中的 _ctx. 前缀
  wxml = wxml.replace(/(\w+)="{{_ctx\.([^}]+)}}"/g, '$1="{{$2}}"')

  // 移除其他可能的 _ctx. 前缀
  wxml = wxml.replace(/_ctx\./g, '')

  return wxml
}

/**
 * 为 WXML 标签添加 scoped 样式属性。
 */
export function addScopeAttributes(wxml: string, scopeId: string): string {
  // slot 和 block 是微信小程序的模板控制标签，不应添加 scoped 属性
  const excludedTags = new Set(['slot', 'block', 'template', 'wxs', 'import', 'include'])

  return wxml.replace(/<(\w[\w-]*)([^>]*?)(\s*\/?)>/g, (match, tag, attrs, selfClosing) => {
    if (attrs.includes('data-v-')) {
      return match
    }

    // 跳过微信小程序模板控制标签
    if (excludedTags.has(tag)) {
      return match
    }

    // 修复：只有当 selfClosing 包含 '/' 时才是真正的自闭合标签
    const isSelfClosing = selfClosing.includes('/')

    if (isSelfClosing) {
      return `<${tag}${attrs} data-v-${scopeId} />`
    } else {
      return `<${tag}${attrs} data-v-${scopeId}>`
    }
  })
}

/**
 * 基于源文件名生成稳定的 scoped 样式 ID。
 */
export function generateScopeId(filename: string): string {
  let hash = 0
  for (let i = 0; i < filename.length; i++) {
    const char = filename.charCodeAt(i)
    hash = ((hash << 5) - hash) + char
    hash = hash & hash
  }
  return Math.abs(hash).toString(36).substring(0, 8)
}

/**
 * 将 PascalCase / camelCase 名称转换为 kebab-case。
 */
export function kebabCase(str: string): string {
  return str.replace(/([A-Z])/g, '-$1').toLowerCase().replace(/^-/, '')
}

/**
 * 检查 WXML 中是否使用了 WXS 辅助函数（wxsH.xxx 调用）。
 */
export function needsWxsHelpers(wxml: string): boolean {
  return /\bwxsH\./.test(wxml)
}

/**
 * 在 WXML 头部注入 WXS 辅助模块引用。
 * @param relativeWxsPath 相对于当前 WXML 文件的 helpers.wxs 路径
 */
export function injectWxsHelpersImport(wxml: string, relativeWxsPath: string): string {
  return `<wxs src="${relativeWxsPath}" module="wxsH" />\n${wxml}`
}

/**
 * 生成 WXS 辅助模块内容。
 *
 * WXS 是微信小程序的脚本语言，语法类似 ES5，不支持 ES6+。
 * 这个模块提供了 WXML 模板中可能用到的 JS 方法的 WXS 等价实现。
 */
export function generateWxsHelpersContent(): string {
  return `/**
 * WXS 辅助模块 - 由 Vue3 微信小程序编译器自动生成
 * 提供 WXML 模板中不支持的 JS 方法的 WXS 等价实现
 */

/**
 * Array.prototype.includes / String.prototype.includes 的 WXS 实现
 */
function includes(arr, val) {
  if (!arr) return false
  if (typeof arr === 'string') {
    return arr.indexOf(val) !== -1
  }
  for (var i = 0; i < arr.length; i++) {
    if (arr[i] === val) return true
  }
  return false
}

/**
 * Array.prototype.indexOf / String.prototype.indexOf 的 WXS 实现
 */
function indexOf(arr, val) {
  if (!arr) return -1
  if (typeof arr === 'string') {
    return arr.indexOf(val)
  }
  for (var i = 0; i < arr.length; i++) {
    if (arr[i] === val) return i
  }
  return -1
}

/**
 * Object.prototype.toString 的 WXS 实现
 */
function toString(val) {
  if (val === null || val === undefined) return ''
  return '' + val
}

/**
 * String.prototype.startsWith 的 WXS 实现
 */
function startsWith(str, prefix) {
  if (!str || !prefix) return false
  return str.indexOf(prefix) === 0
}

/**
 * String.prototype.endsWith 的 WXS 实现
 */
function endsWith(str, suffix) {
  if (!str || !suffix) return false
  var idx = str.length - suffix.length
  if (idx < 0) return false
  return str.indexOf(suffix) === idx
}

function range(count) {
  var values = []
  for (var i = 1; i <= count; i++) values.push(i)
  return values
}

module.exports = {
  includes: includes,
  indexOf: indexOf,
  toString: toString,
  startsWith: startsWith,
  endsWith: endsWith,
  range: range
}
`
}
