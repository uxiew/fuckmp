/**
 * computed getter 转换工具。
 */

/**
 * 将 computed(() => expr) 这类源码片段标准化为可直接放入方法体的 return 语句。
 */
export function normalizeComputedGetter(getter: string): string {
  const trimmedGetter = getter.trim()
  const arrowMatch = trimmedGetter.match(/^(?:async\s*)?\(?([^)]*)\)?\s*=>\s*([\s\S]*)$/)
  if (!arrowMatch) {
    return trimmedGetter
  }

  const body = (arrowMatch[2] || '').trim()
  if (body.startsWith('{') && body.endsWith('}')) {
    return body.slice(1, -1).trim()
  }

  return `return ${body}`
}
