/**
 * defineExpose 原生目标降级工具。
 */

const DEFINE_EXPOSE_DEGRADE_REASON =
  'defineExpose relies on Vue public instance/template refs; native WeChat Mini Program output has no reliable equivalent.'

/**
 * 创建 defineExpose 降级记录。
 */
export function createDefineExposeDegradeRecord(exposeArg: any, previousKeys: string[] = []): Record<string, any> {
  const keys = Array.from(new Set([...previousKeys, ...extractExposeKeys(exposeArg)]))

  return {
    unsupported: true,
    strategy: 'degraded',
    target: 'miniprogram-native',
    keys,
    reason: DEFINE_EXPOSE_DEGRADE_REASON
  }
}

/**
 * 生成 defineExpose 在原生目标下的降级注释。
 */
export function generateDefineExposeDegradeComment(expose: Record<string, any>, targetLabel: string): string {
  if (!expose?.unsupported) {
    return ''
  }

  const keys = Array.isArray(expose.keys) && expose.keys.length > 0
    ? expose.keys.join(', ')
    : 'none'

  return `// defineExpose 降级：微信原生${targetLabel}目标没有 Vue template ref public instance 等价语义；不生成运行时桥接。
// defineExpose exposed keys: ${keys}

`
}

/**
 * 提取 defineExpose({ key }) 的公开键名，仅用于降级记录。
 */
function extractExposeKeys(exposeArg: any): string[] {
  if (!exposeArg || typeof exposeArg !== 'object' || Array.isArray(exposeArg)) {
    return []
  }

  return Object.keys(exposeArg)
}
