/**
 * Template parser AST helper functions.
 */

/**
 * 判断模板标签是否按旧规则视为组件。
 */
export function isTemplateComponentTag(tag: string): boolean {
  return /^[A-Z]/.test(tag) || tag.includes('-')
}

/**
 * 获取 Vue template AST 节点位置信息。
 */
export function getTemplateNodeLocation(node: any): string {
  if (node.loc) {
    const { start, end } = node.loc
    return `${start.line}:${start.column}-${end.line}:${end.column}`
  }
  return 'unknown'
}

/**
 * 从 Vue directive AST 属性构造通用指令信息。
 */
export function createTemplateDirectiveInfo(prop: any, location: string): {
  name: string
  arg?: string
  modifiers: string[]
  expression?: string
  location: string
} {
  return {
    name: prop.name,
    arg: prop.arg?.content,
    modifiers: prop.modifiers || [],
    expression: prop.exp?.content,
    location
  }
}

/**
 * 从 v-on 指令构造事件信息。
 */
export function createTemplateEventInfo(prop: any, location: string): {
  name: string
  handler: string
  modifiers: string[]
  location: string
} {
  return {
    name: prop.arg?.content || 'unknown',
    handler: prop.exp?.content || '',
    modifiers: prop.modifiers || [],
    location
  }
}

/**
 * 从 v-model 指令构造 model 信息。
 */
export function createTemplateModelInfo(prop: any, location: string): {
  property: string
  event: string
  modifiers: string[]
  location: string
} {
  return {
    property: prop.exp?.content || 'modelValue',
    event: prop.arg?.content || 'update:modelValue',
    modifiers: prop.modifiers || [],
    location
  }
}

/**
 * 获取 slot 标签名称。
 */
export function getTemplateSlotName(node: any): string {
  const nameProp = node.props?.find((prop: any) =>
    prop.type === 6 && prop.name === 'name'
  )
  return nameProp?.value?.content || 'default'
}

/**
 * 获取 slot 标签透传 props。
 */
export function getTemplateSlotProps(node: any): Record<string, any> {
  const props: Record<string, any> = {}

  if (node.props) {
    node.props.forEach((prop: any) => {
      if (prop.type === 6 && prop.name !== 'name') {
        props[prop.name] = prop.value?.content
      } else if (prop.type === 7) {
        props[prop.name] = prop.exp?.content
      }
    })
  }

  return props
}

/**
 * 获取去重后的指令名，保留首次出现顺序。
 */
export function getUniqueTemplateDirectiveNames(directives: Array<{ name: string }>): string[] {
  return Array.from(new Set(directives.map(d => d.name)))
}

/**
 * 获取去重后的事件名，保留首次出现顺序。
 */
export function getUniqueTemplateEventNames(events: Array<{ name: string }>): string[] {
  return Array.from(new Set(events.map(e => e.name)))
}

/**
 * 按旧权重计算模板复杂度评分。
 */
export function getTemplateComplexityScore(result: {
  directives: any[]
  components: Set<any>
  events: any[]
  models: any[]
  slots: any[]
}): number {
  let score = 0

  score += result.directives.length * 2
  score += result.components.size * 3
  score += result.events.length * 1
  score += result.models.length * 2
  score += result.slots.length * 2

  return score
}
