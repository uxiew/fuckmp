/**
 * 插槽系统插件
 * 将 Vue 的插槽系统转换为小程序的插槽实现
 */

import { BaseTransformPlugin } from '../base/transform-plugin'
import type { TransformResult } from '../base/transform-plugin'
import type { ASTNode } from '../../types/ast'
import type { TransformContext } from '../../types/compiler'

export class SlotsPlugin extends BaseTransformPlugin {
  readonly name = 'slots-plugin'
  readonly version = '1.0.0'
  readonly priority = 75

  supports(node: ASTNode, context: TransformContext): boolean {
    // 检查是否为插槽相关的节点
    return node.type === 'VueSlot' ||
      (node.type === 'Element' && node.tagName === 'slot') ||
      (node.type === 'Element' && node.tagName === 'template' && this.hasSlotDirective(node))
  }

  async transform(node: ASTNode, context: TransformContext): Promise<TransformResult> {
    try {
      if (!this.supports(node, context)) {
        return this.createUnhandledResult()
      }

      if (node.type === 'VueSlot' || (node.type === 'Element' && node.tagName === 'slot')) {
        return this.transformSlotDefinition(node, context)
      } else if (node.type === 'Element' && node.tagName === 'template') {
        return this.transformSlotUsage(node, context)
      }

      return this.createUnhandledResult()
    } catch (error) {
      return this.createErrorResult(`插槽转换失败: ${error.message}`)
    }
  }

  /**
   * 转换插槽定义
   */
  private transformSlotDefinition(node: ASTNode, context: TransformContext): TransformResult {
    const slotName = this.extractSlotName(node) || 'default'
    const slotProps = this.extractSlotProps(node)
    const fallbackContent = this.extractFallbackContent(node)

    // 生成插槽配置
    const slotConfig = {
      name: slotName,
      props: slotProps,
      fallback: fallbackContent,
      type: 'definition'
    }

    // 更新上下文
    const contextUpdates = {
      template: {
        ...context.template,
        slots: {
          ...context.template?.slots,
          [slotName]: slotConfig
        }
      }
    }

    // 生成小程序的slot标签
    const slotCode = this.generateSlotCode(slotName, slotProps)

    this.debug('转换插槽定义', {
      slotName,
      slotProps,
      slotCode
    })

    return this.createSuccessResult(slotCode, contextUpdates)
  }

  /**
   * 转换插槽使用
   */
  private transformSlotUsage(node: ASTNode, context: TransformContext): TransformResult {
    const slotTarget = this.extractSlotTarget(node)
    const slotProps = this.extractSlotProps(node)
    const slotContent = this.extractSlotContent(node)

    if (!slotTarget) {
      return this.createErrorResult('插槽使用必须指定目标插槽')
    }

    // 生成插槽使用配置
    const slotUsageConfig = {
      target: slotTarget,
      props: slotProps,
      content: slotContent,
      type: 'usage'
    }

    // 更新上下文
    const contextUpdates = {
      template: {
        ...context.template,
        slots: {
          ...context.template?.slots,
          [`${slotTarget}_usage`]: slotUsageConfig
        }
      }
    }

    // 生成小程序的slot使用代码
    const slotUsageCode = this.generateSlotUsageCode(slotTarget, slotProps, slotContent)

    this.debug('转换插槽使用', {
      slotTarget,
      slotProps,
      slotUsageCode
    })

    return this.createSuccessResult(slotUsageCode, contextUpdates)
  }

  /**
   * 检查是否有插槽指令
   */
  private hasSlotDirective(node: ASTNode): boolean {
    if (!node.directives) return false

    return node.directives.some((directive: any) =>
      directive.name === 'slot' || directive.name.startsWith('slot:')
    )
  }

  /**
   * 提取插槽名称
   */
  private extractSlotName(node: ASTNode): string | null {
    // 从name属性提取
    if (node.attributes) {
      for (const attr of node.attributes) {
        if (attr.name === 'name') {
          return attr.value
        }
      }
    }

    // 从Vue插槽节点提取
    if (node.type === 'VueSlot') {
      return node.name
    }

    return null
  }

  /**
   * 提取插槽属性
   */
  private extractSlotProps(node: ASTNode): Record<string, any> {
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

  /**
   * 提取回退内容
   */
  private extractFallbackContent(node: ASTNode): any {
    if (node.children && node.children.length > 0) {
      return this.generateChildrenTemplate(node.children)
    }

    if (node.type === 'VueSlot' && node.fallback) {
      return node.fallback
    }

    return null
  }

  /**
   * 提取插槽目标
   */
  private extractSlotTarget(node: ASTNode): string | null {
    // 从v-slot指令提取
    if (node.directives) {
      for (const directive of node.directives) {
        if (directive.name === 'slot') {
          return directive.argument || 'default'
        }
      }
    }

    // 从#slot简写提取
    if (node.attributes) {
      for (const attr of node.attributes) {
        if (attr.name.startsWith('#')) {
          return attr.name.substring(1)
        }
      }
    }

    return null
  }

  /**
   * 提取插槽内容
   */
  private extractSlotContent(node: ASTNode): any {
    if (node.children && node.children.length > 0) {
      return this.generateChildrenTemplate(node.children)
    }
    return null
  }

  /**
   * 生成插槽代码
   */
  private generateSlotCode(slotName: string, props: Record<string, any>): string {
    const parts: string[] = []

    // 基本slot标签
    parts.push(`<slot name="${slotName}"`)

    // 添加属性
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

  /**
   * 生成插槽使用代码
   */
  private generateSlotUsageCode(
    slotTarget: string,
    props: Record<string, any>,
    content: any
  ): string {
    const parts: string[] = []

    if (slotTarget === 'default') {
      // 默认插槽直接放置内容
      parts.push(this.generateContentTemplate(content))
    } else {
      // 具名插槽使用view包装
      parts.push(`<view slot="${slotTarget}"`)

      // 添加属性
      for (const [key, value] of Object.entries(props)) {
        if (typeof value === 'string') {
          parts.push(`${key}="${value}"`)
        } else {
          parts.push(`${key}="{{${JSON.stringify(value)}}}"`)
        }
      }

      parts.push('>')
      parts.push(this.generateContentTemplate(content))
      parts.push('</view>')
    }

    return parts.join('')
  }

  /**
   * 生成子元素模板
   */
  private generateChildrenTemplate(children: any[]): string {
    return children.map(child => this.generateContentTemplate(child)).join('')
  }

  /**
   * 生成内容模板
   */
  private generateContentTemplate(content: any): string {
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

  /**
   * 生成作用域插槽
   */
  private generateScopedSlot(
    slotName: string,
    slotProps: Record<string, any>,
    content: any
  ): string {
    // 小程序中的作用域插槽实现
    const scopeData = Object.entries(slotProps)
      .map(([key, value]) => `${key}: ${JSON.stringify(value)}`)
      .join(', ')

    return `
      <template name="${slotName}_scoped">
        <view data-scope="{${scopeData}}">
          ${this.generateContentTemplate(content)}
        </view>
      </template>
    `
  }

  /**
   * 生成插槽的运行时配置
   */
  generateRuntimeConfig(slots: Record<string, any>): any {
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

  /**
   * 验证插槽配置
   */
  private validateSlotConfig(config: any): boolean {
    // 验证插槽名称
    if (!config.name || typeof config.name !== 'string') {
      return false
    }

    // 验证插槽类型
    if (!['definition', 'usage'].includes(config.type)) {
      return false
    }

    return true
  }

  /**
   * 优化插槽渲染
   */
  private optimizeSlotRendering(slots: Record<string, any>): Record<string, any> {
    const optimized: Record<string, any> = {}

    for (const [name, config] of Object.entries(slots)) {
      // 移除空的插槽
      if (!config.content && !config.fallback) {
        continue
      }

      // 合并相同名称的插槽
      if (optimized[name]) {
        optimized[name] = this.mergeSlotConfigs(optimized[name], config)
      } else {
        optimized[name] = config
      }
    }

    return optimized
  }

  /**
   * 合并插槽配置
   */
  private mergeSlotConfigs(config1: any, config2: any): any {
    return {
      ...config1,
      ...config2,
      props: { ...config1.props, ...config2.props }
    }
  }
}
