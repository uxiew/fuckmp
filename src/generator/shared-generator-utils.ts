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
  return wxml.replace(/<(\w+)([^>]*?)(\s*\/?)>/g, (match, tag, attrs, selfClosing) => {
    if (attrs.includes('data-v-')) {
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
