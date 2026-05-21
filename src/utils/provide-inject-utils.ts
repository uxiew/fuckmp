/**
 * provide/inject 原生目标降级工具。
 */

const PROVIDE_INJECT_DEGRADE_REASON =
  'Vue dependency injection resolves values through the Vue component/app instance tree; native output does not expose an equivalent DI context bridge.'

/**
 * 创建 provide/inject 降级记录。
 */
export function createProvideInjectDegradeRecord(
  apiName: string,
  key: string,
  variableName = '',
  previous: Record<string, any> = {}
): Record<string, any> {
  const previousApis = Array.isArray(previous.apis) ? previous.apis : []
  const previousKeys = Array.isArray(previous.keys) ? previous.keys : []
  const previousVariables = Array.isArray(previous.variables) ? previous.variables : []

  return {
    unsupported: true,
    strategy: 'explicit-degrade',
    target: 'miniprogram-native',
    apis: Array.from(new Set([...previousApis, apiName])).filter(Boolean),
    keys: Array.from(new Set([...previousKeys, key])).filter(Boolean),
    variables: Array.from(new Set([...previousVariables, variableName])).filter(Boolean),
    reason: PROVIDE_INJECT_DEGRADE_REASON
  }
}

/**
 * 生成 provide/inject 在原生目标下的降级注释。
 */
export function generateProvideInjectDegradeComment(record: Record<string, any>, targetLabel: string): string {
  if (!record?.unsupported) {
    return ''
  }

  const apis = Array.isArray(record.apis) && record.apis.length > 0 ? record.apis.join(', ') : 'none'
  const keys = Array.isArray(record.keys) && record.keys.length > 0 ? record.keys.join(', ') : 'none'
  const variables = Array.isArray(record.variables) && record.variables.length > 0 ? record.variables.join(', ') : 'none'

  return `// provide/inject 降级：微信原生${targetLabel}目标不提供 Vue dependency injection 实例树等价桥接。
// provide/inject APIs: ${apis}
// provide/inject keys: ${keys}
// inject variables: ${variables}

`
}
