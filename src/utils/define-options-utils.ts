/**
 * defineOptions 原生目标降级工具。
 */

const DEFINE_OPTIONS_DEGRADE_REASON =
  'defineOptions declares Vue component options; native WeChat Mini Program Page/Component output has no reliable Vue option merging equivalent.'

/**
 * 创建 defineOptions 降级记录。
 */
export function createDefineOptionsDegradeRecord(optionsArg: any, previousKeys: string[] = []): Record<string, any> {
  const keys = Array.from(new Set([...previousKeys, ...extractOptionKeys(optionsArg)]))

  return {
    unsupported: true,
    strategy: 'degraded',
    target: 'miniprogram-native',
    keys,
    reason: DEFINE_OPTIONS_DEGRADE_REASON
  }
}

/**
 * 生成 defineOptions 在原生目标下的降级注释。
 */
export function generateDefineOptionsDegradeComment(options: Record<string, any>, targetLabel: string): string {
  if (!options?.unsupported) {
    return ''
  }

  const keys = Array.isArray(options.keys) && options.keys.length > 0
    ? options.keys.join(', ')
    : 'none'

  return `// defineOptions 降级：微信原生${targetLabel}目标没有完整 Vue component options 合并等价语义；不生成运行时桥接。
// defineOptions option keys: ${keys}

`
}

/**
 * 提取 defineOptions({ key }) 的顶层键名，仅用于降级记录。
 */
function extractOptionKeys(optionsArg: any): string[] {
  if (!optionsArg || typeof optionsArg !== 'object' || Array.isArray(optionsArg)) {
    return []
  }

  return Object.keys(optionsArg)
}
