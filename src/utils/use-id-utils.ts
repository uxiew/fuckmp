/**
 * useId 原生目标降级工具。
 */

const USE_ID_DEGRADE_REASON =
  'useId generates SSR-stable application-scoped ids via the Vue app instance; native output does not expose Vue app idPrefix or SSR hydration semantics.'

/**
 * 创建 useId 降级记录。
 */
export function createUseIdDegradeRecord(variableName: string, previousVariables: string[] = []): Record<string, any> {
  return {
    unsupported: true,
    strategy: 'explicit-degrade',
    target: 'miniprogram-native',
    variables: Array.from(new Set([...previousVariables, variableName])).filter(Boolean),
    reason: USE_ID_DEGRADE_REASON
  }
}

/**
 * 生成 useId 在原生目标下的降级注释。
 */
export function generateUseIdDegradeComment(useIds: Record<string, any>, targetLabel: string): string {
  if (!useIds?.unsupported) {
    return ''
  }

  const variables = Array.isArray(useIds.variables) && useIds.variables.length > 0
    ? useIds.variables.join(', ')
    : 'none'

  return `// useId 降级：微信原生${targetLabel}目标不提供 Vue app idPrefix 或 SSR-stable application-scoped ids 等价语义。
// useId variables: ${variables}

`
}
