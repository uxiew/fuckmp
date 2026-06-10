/**
 * useTemplateRef 原生目标降级工具。
 */

const USE_TEMPLATE_REF_DEGRADE_REASON =
  'useTemplateRef relies on Vue template refs and component/DOM instances; native WeChat Mini Program output has no reliable Vue-equivalent ref bridge.'

/**
 * 创建 useTemplateRef 降级记录。
 */
export function createUseTemplateRefDegradeRecord(
  refName: string,
  variableName: string,
  previousRefs: string[] = []
): Record<string, any> {
  const refs = Array.from(new Set([...previousRefs, refName].filter(Boolean)))

  return {
    unsupported: true,
    strategy: 'degraded',
    target: 'miniprogram-native',
    refs,
    variables: Array.from(new Set([variableName].filter(Boolean))),
    reason: USE_TEMPLATE_REF_DEGRADE_REASON
  }
}

/**
 * 合并 useTemplateRef 降级记录。
 */
export function mergeUseTemplateRefDegradeRecord(
  current: Record<string, any> | undefined,
  next: Record<string, any>
): Record<string, any> {
  return {
    ...next,
    refs: Array.from(new Set([...(current?.refs || []), ...(next.refs || [])])),
    variables: Array.from(new Set([...(current?.variables || []), ...(next.variables || [])]))
  }
}

/**
 * 生成 useTemplateRef 在原生目标下的降级注释。
 */
export function generateUseTemplateRefDegradeComment(templateRefs: Record<string, any>, targetLabel: string): string {
  if (!templateRefs?.unsupported) {
    return ''
  }

  const refs = Array.isArray(templateRefs.refs) && templateRefs.refs.length > 0
    ? templateRefs.refs.join(', ')
    : 'none'

  return `// useTemplateRef 降级：微信原生${targetLabel}目标没有 Vue template ref / DOM 或组件实例等价桥接；不生成运行时代理。
// useTemplateRef template refs: ${refs}

`
}
