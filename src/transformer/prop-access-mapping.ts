/**
 * Props 访问静态映射工具。
 */

import type { TransformContext } from '@/types/index.js'

/**
 * 记录 defineProps 返回值变量名，供模板和脚本访问改写使用。
 */
export function registerPropNamespace(context: TransformContext, namespace: unknown): void {
  if (!namespace) return

  if (!context.propNamespaces) {
    context.propNamespaces = new Set()
  }

  context.propNamespaces.add(String(namespace))
}

/**
 * 判断上下文是否存在 props 访问映射。
 */
export function hasPropAccessMappings(context?: TransformContext): boolean {
  return Boolean((context?.propAliases && context.propAliases.size > 0) ||
    (context?.propNamespaces && context.propNamespaces.size > 0))
}

/**
 * 将脚本中的 props 解构别名与 defineProps 命名空间访问改写为原生 property 访问。
 */
export function applyPropAccessMappingsToScript(code: string, context: TransformContext): string {
  if (!hasPropAccessMappings(context)) {
    return code
  }

  let result = code
  context.propAliases?.forEach((propName, localName) => {
    const escapedLocalName = escapeRegExp(localName)
    result = result.replace(new RegExp(`\\bthis\\.data\\.${escapedLocalName}\\b`, 'g'), `this.data.${propName}`)
    result = result.replace(new RegExp(`(^|[^\\w$.'"])${escapedLocalName}\\b(?!\\s*:)`, 'g'), `$1this.data.${propName}`)
  })

  context.propNamespaces?.forEach(namespace => {
    const escapedNamespace = escapeRegExp(namespace)
    result = result.replace(new RegExp(`\\b${escapedNamespace}\\.([A-Za-z_$][\\w$]*)\\b`, 'g'), 'this.data.$1')
  })

  return result
}

/**
 * 将模板表达式中的 props 解构别名与 defineProps 命名空间访问改写为原生 property 名。
 */
export function applyPropAccessMappingsToTemplate(expression: string, context?: TransformContext): string {
  if (!hasPropAccessMappings(context)) {
    return expression
  }

  let result = expression
  context?.propAliases?.forEach((propName, localName) => {
    if (propName === localName) return

    const escapedLocalName = escapeRegExp(localName)
    result = result.replace(new RegExp(`(^|[^\\w$.'"])${escapedLocalName}\\b`, 'g'), `$1${propName}`)
  })

  context?.propNamespaces?.forEach(namespace => {
    const escapedNamespace = escapeRegExp(namespace)
    result = result.replace(new RegExp(`\\b${escapedNamespace}\\.([A-Za-z_$][\\w$]*)\\b`, 'g'), '$1')
  })

  return result
}

/**
 * 转义动态拼接正则表达式所需的特殊字符。
 */
function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}
