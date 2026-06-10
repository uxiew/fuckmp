/**
 * defineSlots 原生目标降级工具。
 */

const DEFINE_SLOTS_DEGRADE_REASON =
  'defineSlots is primarily a type-only macro and returns Vue slots; native output does not expose a Vue slots object bridge.'

/**
 * 创建 defineSlots 降级记录。
 */
export function createDefineSlotsDegradeRecord(variableName: string): Record<string, any> {
  return {
    unsupported: true,
    strategy: 'type-only-erased',
    target: 'miniprogram-native',
    variables: variableName ? [variableName] : [],
    reason: DEFINE_SLOTS_DEGRADE_REASON
  }
}

/**
 * 生成 defineSlots 在原生目标下的降级注释。
 */
export function generateDefineSlotsDegradeComment(slots: Record<string, any>, targetLabel: string): string {
  if (!slots?.unsupported) {
    return ''
  }

  const variables = Array.isArray(slots.variables) && slots.variables.length > 0
    ? slots.variables.join(', ')
    : 'none'

  return `// defineSlots 降级：微信原生${targetLabel}目标不暴露 Vue slots 对象桥接；type-only slots macro erased。
// defineSlots variables: ${variables}

`
}
