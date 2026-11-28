/**
 * Vue 模板能力原生目标边界降级工具。
 */

const UNSUPPORTED_TEMPLATE_REASON =
  'Some Vue template constructs have no equivalent in native WXML.'

/**
 * 从模板源码中识别仍不宣称支持的 Vue 模板能力，并记录到转换上下文。
 */
export function recordUnsupportedTemplateCapabilities(
  source: string,
  context: { filename?: string; templateUnsupported?: Record<string, any> }
): void {
  const capabilities = detectUnsupportedTemplateCapabilities(source)

  if (capabilities.length === 0) {
    return
  }

  recordUnsupportedTemplateFeatures(context, ...capabilities)
}

export function recordUnsupportedTemplateFeatures(
  context: { templateUnsupported?: Record<string, any> },
  ...capabilities: string[]
): void {
  context.templateUnsupported = createUnsupportedTemplateDegradeRecord(capabilities, context.templateUnsupported)
}

/**
 * 检测模板源码中无法无损映射到微信原生目标的 Vue 模板能力。
 */
export function detectUnsupportedTemplateCapabilities(source: string): string[] {
  const capabilities: string[] = []

  if (/<slot\b[^>]*(?:\s:|\sv-bind:)/.test(source) || /(?:v-slot|#)[^=\s>]*=/.test(source)) {
    capabilities.push('scoped slots')
  }

  if (/v-slot:\[[^\]]+\]|#\[[^\]]+\]/.test(source)) {
    capabilities.push('dynamic slots')
  }

  if (/<\/?Transition\b|<\/?transition\b/.test(source)) {
    capabilities.push('transition')
  }

  if (/<\/?KeepAlive\b|<\/?keep-alive\b/.test(source)) {
    capabilities.push('keep-alive')
  }

  return capabilities
}

/**
 * 创建仍不宣称支持的模板能力降级记录。
 */
export function createUnsupportedTemplateDegradeRecord(
  capabilities: string[],
  previous: Record<string, any> = {}
): Record<string, any> {
  const previousCapabilities = Array.isArray(previous.capabilities) ? previous.capabilities : []

  return {
    unsupported: true,
    strategy: 'explicit-degrade',
    target: 'miniprogram-native',
    capabilities: Array.from(new Set([...previousCapabilities, ...capabilities])).filter(Boolean),
    reason: UNSUPPORTED_TEMPLATE_REASON
  }
}

/**
 * 合并仍不宣称支持的模板能力降级记录。
 */
export function mergeUnsupportedTemplateDegradeRecord(
  previous: Record<string, any> | undefined,
  next: Record<string, any>
): Record<string, any> {
  return createUnsupportedTemplateDegradeRecord(next.capabilities || [], previous || {})
}

/**
 * 生成仍不宣称支持的模板能力在原生目标下的降级注释。
 */
export function generateUnsupportedTemplateDegradeComment(record: Record<string, any>, targetLabel: string): string {
  if (!record?.unsupported) {
    return ''
  }

  const capabilities = Array.isArray(record.capabilities) ? record.capabilities : []
  const comments: string[] = []

  if (hasAnyCapability(capabilities, ['scoped slots', 'dynamic slots'])) {
    comments.push(
      `// scoped slots / dynamic slots 降级：微信原生${targetLabel}目标不提供 Vue scoped slot props 或动态 slot 名等价语义；不生成 scoped/dynamic slots runtime。`
    )
  }

  if (hasAnyCapability(capabilities, ['transition', 'keep-alive'])) {
    comments.push(
      `// transition / keep-alive 降级：微信原生${targetLabel}目标不提供 Vue 过渡状态机或组件缓存等价语义；不生成 transition/keep-alive runtime。`
    )
  }

  return `${comments.length > 0 ? comments.join('\n') + '\n' : ''}// unsupported template capabilities: ${capabilities.join(', ')}

`
}

/**
 * 判断能力集合中是否包含任一目标能力。
 */
function hasAnyCapability(capabilities: string[], targets: string[]): boolean {
  return targets.some(target => capabilities.includes(target))
}
