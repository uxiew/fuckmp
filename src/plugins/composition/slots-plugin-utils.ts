/**
 * slots plugin 辅助函数。
 */

/** 检查是否有插槽指令。 */
export function hasSlotDirective(node: any): boolean {
  if (!node.directives) return false

  return node.directives.some((directive: any) =>
    directive.name === 'slot' || directive.name.startsWith('slot:')
  )
}

/** 提取插槽名称。 */
export function extractSlotName(node: any): string | null {
  if (node.attributes) {
    for (const attr of node.attributes) {
      if (attr.name === 'name') {
        return attr.value
      }
    }
  }

  if (node.type === 'VueSlot') {
    return node.name
  }

  return null
}

/** 提取插槽属性。 */
export function extractSlotProps(node: any): Record<string, any> {
  const props: Record<string, any> = {}

  if (node.attributes) {
    for (const attr of node.attributes) {
      if (attr.name !== 'name' && !attr.name.startsWith('v-')) {
        props[attr.name] = attr.value
      }
    }
  }

  if (node.type === 'VueSlot' && node.props) {
    Object.assign(props, node.props)
  }

  return props
}

/** 提取回退内容。 */
export function extractFallbackContent(node: any): any {
  if (node.children && node.children.length > 0) {
    return generateChildrenTemplate(node.children)
  }

  if (node.type === 'VueSlot' && node.fallback) {
    return node.fallback
  }

  return null
}

/** 提取插槽目标。 */
export function extractSlotTarget(node: any): string | null {
  if (node.directives) {
    for (const directive of node.directives) {
      if (directive.name === 'slot') {
        return directive.argument || 'default'
      }
    }
  }

  if (node.attributes) {
    for (const attr of node.attributes) {
      if (attr.name.startsWith('#')) {
        return attr.name.substring(1)
      }
    }
  }

  return null
}

/** 提取插槽内容。 */
export function extractSlotContent(node: any): any {
  if (node.children && node.children.length > 0) {
    return generateChildrenTemplate(node.children)
  }

  return null
}

/** 生成插槽代码。 */
export function generateSlotCode(slotName: string, props: Record<string, any>): string {
  const parts: string[] = []

  parts.push(`<slot name="${slotName}"`)

  for (const [key, value] of Object.entries(props)) {
    if (typeof value === 'string') {
      parts.push(`${key}="${value}"`)
    } else {
      parts.push(`${key}="{{${JSON.stringify(value)}}}"`)
    }
  }

  parts.push('></slot>')

  return parts.join(' ')
}

/** 生成插槽使用代码。 */
export function generateSlotUsageCode(
  slotTarget: string,
  props: Record<string, any>,
  content: any
): string {
  const parts: string[] = []

  if (slotTarget === 'default') {
    parts.push(generateContentTemplate(content))
  } else {
    parts.push(`<view slot="${slotTarget}"`)

    for (const [key, value] of Object.entries(props)) {
      if (typeof value === 'string') {
        parts.push(`${key}="${value}"`)
      } else {
        parts.push(`${key}="{{${JSON.stringify(value)}}}"`)
      }
    }

    parts.push('>')
    parts.push(generateContentTemplate(content))
    parts.push('</view>')
  }

  return parts.join('')
}

/** 生成子元素模板。 */
export function generateChildrenTemplate(children: any[]): string {
  return children.map(child => generateContentTemplate(child)).join('')
}

/** 生成内容模板。 */
export function generateContentTemplate(content: any): string {
  if (typeof content === 'string') {
    return content
  }

  if (content && typeof content === 'object') {
    if (content.type === 'text') {
      return content.value || ''
    }

    if (content.type === 'element') {
      return content.outerHTML || content.toString() || ''
    }
  }

  return ''
}

/** 生成作用域插槽。 */
export function generateScopedSlot(
  slotName: string,
  slotProps: Record<string, any>,
  content: any
): string {
  const scopeData = Object.entries(slotProps)
    .map(([key, value]) => `${key}: ${JSON.stringify(value)}`)
    .join(', ')

  return `
      <template name="${slotName}_scoped">
        <view data-scope="{${scopeData}}">
          ${generateContentTemplate(content)}
        </view>
      </template>
    `
}

/** 生成插槽的运行时配置。 */
export function generateSlotsRuntimeConfig(slots: Record<string, any>): any {
  return {
    type: 'slots',
    slots: Object.entries(slots).map(([name, config]) => ({
      name,
      type: config.type,
      props: config.props,
      content: config.content || config.fallback,
      target: config.target
    }))
  }
}

/** 验证插槽配置。 */
export function validateSlotConfig(config: any): boolean {
  if (!config.name || typeof config.name !== 'string') {
    return false
  }

  if (!['definition', 'usage'].includes(config.type)) {
    return false
  }

  return true
}

/** 优化插槽渲染。 */
export function optimizeSlotRendering(slots: Record<string, any>): Record<string, any> {
  const optimized: Record<string, any> = {}

  for (const [name, config] of Object.entries(slots)) {
    if (!config.content && !config.fallback) {
      continue
    }

    if (optimized[name]) {
      optimized[name] = mergeSlotConfigs(optimized[name], config)
    } else {
      optimized[name] = config
    }
  }

  return optimized
}

/** 合并插槽配置。 */
export function mergeSlotConfigs(config1: any, config2: any): any {
  return {
    ...config1,
    ...config2,
    props: { ...config1.props, ...config2.props }
  }
}
