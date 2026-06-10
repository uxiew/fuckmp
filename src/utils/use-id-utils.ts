/**
 * useId 原生目标映射工具。
 */

/**
 * 创建 useId 原生映射记录。
 */
export function createUseIdNativeRecord(
  filename: string,
  variableName: string,
  previousIds: Array<Record<string, string>> = []
): Record<string, any> {
  const entry = {
    variable: variableName,
    baseId: createStableUseIdBase(filename, variableName)
  }

  const ids = [...previousIds.filter(item => item.variable !== variableName), entry]

  return {
    supported: true,
    strategy: 'native-stable-id',
    target: 'miniprogram-native',
    ids
  }
}

/**
 * 生成 useId 在原生目标下的映射注释。
 */
export function generateUseIdNativeComment(useIds: Record<string, any>, targetLabel: string): string {
  if (!useIds?.supported) {
    return ''
  }

  const variables = getUseIdEntries(useIds).map(entry => entry.variable).join(', ') || 'none'

  const instanceNote = targetLabel === '组件'
    ? '，并在组件实例 attached 时补充实例级唯一后缀'
    : ''

  return `// useId 原生映射：微信原生${targetLabel}目标使用稳定 data id${instanceNote}。
// useId variables: ${variables}

`
}

/**
 * 生成组件实例级 useId 计数器。
 */
export function generateUseIdCounterDeclaration(useIds: Record<string, any>): string {
  if (!useIds?.supported || getUseIdEntries(useIds).length === 0) {
    return ''
  }

  return 'let __vue3wxUseIdCounter = 0\n\n'
}

/**
 * 生成组件 attached 阶段的 useId 初始化代码。
 */
export function generateUseIdComponentInitCode(entry: Record<string, string>): string {
  return `this.setData({
        ${entry.variable}: \`${entry.baseId}-\${++__vue3wxUseIdCounter}\`
      })`
}

/**
 * 获取 useId 记录条目。
 */
export function getUseIdEntries(useIds: Record<string, any>): Array<Record<string, string>> {
  return Array.isArray(useIds?.ids) ? useIds.ids : []
}

/**
 * 创建稳定的原生 id 前缀。
 */
function createStableUseIdBase(filename: string, variableName: string): string {
  const hash = hashString(`${filename}:${variableName}`)
  const safeName = variableName.replace(/[^a-zA-Z0-9_-]/g, '-')

  return `vue3wx-${hash}-${safeName}`
}

/**
 * 小型稳定 hash，避免引入 Node crypto 依赖。
 */
function hashString(input: string): string {
  let hash = 5381

  for (let i = 0; i < input.length; i++) {
    hash = ((hash << 5) + hash) ^ input.charCodeAt(i)
  }

  return (hash >>> 0).toString(36)
}
