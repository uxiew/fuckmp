/**
 * Template 解析器
 */

import { compileTemplate } from '@vue/compiler-sfc'
import { logger } from '@/utils/index.js'

/**
 * 模板解析结果
 */
export interface TemplateParseResult {
  /** 原始模板内容 */
  source: string
  /** 编译后的渲染函数代码 */
  code: string
  /** AST */
  ast: any
  /** 模板中使用的指令 */
  directives: DirectiveInfo[]
  /** 模板中使用的组件 */
  components: Set<string>
  /** 模板中的事件监听器 */
  events: EventInfo[]
  /** 模板中的插槽 */
  slots: SlotInfo[]
  /** 模板中的 v-model */
  models: ModelInfo[]
  /** 编译错误 */
  errors: string[]
  /** 编译提示 */
  tips: string[]
}

/**
 * 指令信息
 */
export interface DirectiveInfo {
  name: string
  arg?: string
  modifiers: string[]
  expression?: string
  location: string
}

/**
 * 事件信息
 */
export interface EventInfo {
  name: string
  handler: string
  modifiers: string[]
  location: string
}

/**
 * 插槽信息
 */
export interface SlotInfo {
  name: string
  props?: Record<string, any>
  location: string
}

/**
 * v-model 信息
 */
export interface ModelInfo {
  property: string
  event: string
  modifiers: string[]
  location: string
}

/**
 * Template 解析器类
 */
export class TemplateParser {
  /**
   * 解析模板内容
   */
  async parseTemplate(
    content: string,
    filename: string,
    options?: any
  ): Promise<TemplateParseResult> {
    try {
      logger.debug(`解析模板: ${filename}`)

      // 编译模板
      const compiled = compileTemplate({
        source: content,
        id: filename,
        filename,
        compilerOptions: {
          mode: 'module',
          ...options
        }
      })

      // 初始化结果
      const result: TemplateParseResult = {
        source: content,
        code: compiled.code,
        ast: compiled.ast,
        directives: [],
        components: new Set(),
        events: [],
        slots: [],
        models: [],
        errors: compiled.errors.map(err => typeof err === 'string' ? err : err.message),
        tips: compiled.tips
      }

      // 分析 AST
      if (compiled.ast) {
        this.analyzeAST(compiled.ast, result)
      }

      logger.debug(`模板解析完成: ${filename}`)
      return result

    } catch (error) {
      logger.error(`模板解析失败: ${filename}`, error as Error)
      throw error
    }
  }

  /**
   * 分析模板 AST
   */
  private analyzeAST(ast: any, result: TemplateParseResult): void {
    this.traverseNode(ast, result)
  }

  /**
   * 遍历节点
   */
  private traverseNode(node: any, result: TemplateParseResult): void {
    if (!node) return

    // 处理元素节点
    if (node.type === 1) { // ELEMENT
      this.handleElementNode(node, result)
    }

    // 递归处理子节点
    if (node.children) {
      node.children.forEach((child: any) => {
        this.traverseNode(child, result)
      })
    }
  }

  /**
   * 处理元素节点
   */
  private handleElementNode(node: any, result: TemplateParseResult): void {
    const tag = node.tag

    // 检查是否为组件
    if (this.isComponent(tag)) {
      result.components.add(tag)
    }

    // 处理属性和指令
    if (node.props) {
      node.props.forEach((prop: any) => {
        this.handleProp(prop, result)
      })
    }

    // 处理插槽
    if (tag === 'slot') {
      this.handleSlot(node, result)
    }
  }

  /**
   * 处理属性
   */
  private handleProp(prop: any, result: TemplateParseResult): void {
    const location = this.getLocation(prop)

    if (prop.type === 6) { // ATTRIBUTE
      // 普通属性
      return
    }

    if (prop.type === 7) { // DIRECTIVE
      const directive: DirectiveInfo = {
        name: prop.name,
        arg: prop.arg?.content,
        modifiers: prop.modifiers || [],
        expression: prop.exp?.content,
        location
      }

      result.directives.push(directive)

      // 特殊处理
      if (prop.name === 'on') {
        // 事件监听器
        const event: EventInfo = {
          name: prop.arg?.content || 'unknown',
          handler: prop.exp?.content || '',
          modifiers: prop.modifiers || [],
          location
        }
        result.events.push(event)
      } else if (prop.name === 'model') {
        // v-model
        const model: ModelInfo = {
          property: prop.exp?.content || 'modelValue',
          event: prop.arg?.content || 'update:modelValue',
          modifiers: prop.modifiers || [],
          location
        }
        result.models.push(model)
      }
    }
  }

  /**
   * 处理插槽
   */
  private handleSlot(node: any, result: TemplateParseResult): void {
    const slot: SlotInfo = {
      name: this.getSlotName(node),
      props: this.getSlotProps(node),
      location: this.getLocation(node)
    }

    result.slots.push(slot)
  }

  /**
   * 获取插槽名称
   */
  private getSlotName(node: any): string {
    const nameProp = node.props?.find((prop: any) =>
      prop.type === 6 && prop.name === 'name'
    )
    return nameProp?.value?.content || 'default'
  }

  /**
   * 获取插槽属性
   */
  private getSlotProps(node: any): Record<string, any> {
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
   * 检查是否为组件
   */
  private isComponent(tag: string): boolean {
    // 自定义组件通常以大写字母开头或包含连字符
    return /^[A-Z]/.test(tag) || tag.includes('-')
  }

  /**
   * 获取节点位置信息
   */
  private getLocation(node: any): string {
    if (node.loc) {
      const { start, end } = node.loc
      return `${start.line}:${start.column}-${end.line}:${end.column}`
    }
    return 'unknown'
  }

  /**
   * 获取模板中使用的所有指令
   */
  getDirectives(result: TemplateParseResult): string[] {
    return Array.from(new Set(result.directives.map(d => d.name)))
  }

  /**
   * 获取模板中使用的所有组件
   */
  getComponents(result: TemplateParseResult): string[] {
    return Array.from(result.components)
  }

  /**
   * 获取模板中的所有事件
   */
  getEvents(result: TemplateParseResult): string[] {
    return Array.from(new Set(result.events.map(e => e.name)))
  }

  /**
   * 检查是否使用了特定指令
   */
  hasDirective(result: TemplateParseResult, directiveName: string): boolean {
    return result.directives.some(d => d.name === directiveName)
  }

  /**
   * 检查是否使用了 v-model
   */
  hasVModel(result: TemplateParseResult): boolean {
    return result.models.length > 0
  }

  /**
   * 检查是否使用了插槽
   */
  hasSlots(result: TemplateParseResult): boolean {
    return result.slots.length > 0
  }

  /**
   * 获取模板复杂度评分
   */
  getComplexityScore(result: TemplateParseResult): number {
    let score = 0

    // 指令复杂度
    score += result.directives.length * 2

    // 组件复杂度
    score += result.components.size * 3

    // 事件复杂度
    score += result.events.length * 1

    // v-model 复杂度
    score += result.models.length * 2

    // 插槽复杂度
    score += result.slots.length * 2

    return score
  }
}
