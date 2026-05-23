/**
 * 插槽系统插件
 * 将 Vue 的插槽系统转换为小程序的插槽实现
 */

import { BaseTransformPlugin } from '../base/transform-plugin'
import type { TransformResult } from '../base/transform-plugin'
import type { ASTNode } from '../../types/ast'
import type { TransformContext } from '../../types/compiler'
import {
  extractFallbackContent,
  extractSlotContent,
  extractSlotName,
  extractSlotProps,
  extractSlotTarget,
  generateSlotCode,
  generateSlotsRuntimeConfig,
  generateSlotUsageCode,
  hasSlotDirective
} from './slots-plugin-utils.js'

export class SlotsPlugin extends BaseTransformPlugin {
  readonly name = 'slots-plugin'
  readonly version = '1.0.0'
  readonly priority = 75

  supports(node: ASTNode, context: TransformContext): boolean {
    // 检查是否为插槽相关的节点
    return node.type === 'VueSlot' ||
      (node.type === 'Element' && node.tagName === 'slot') ||
      (node.type === 'Element' && node.tagName === 'template' && hasSlotDirective(node))
  }

  async transform(node: ASTNode, context: TransformContext): Promise<TransformResult> {
    try {
      if (!this.supports(node, context)) {
        return this.createUnhandledResult()
      }

      if (node.type === 'VueSlot' || (node.type === 'Element' && node.tagName === 'slot')) {
        return this.transformSlotDefinition(node, context)
      }

      if (node.type === 'Element' && node.tagName === 'template') {
        return this.transformSlotUsage(node, context)
      }

      return this.createUnhandledResult()
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error)
      return this.createErrorResult(`插槽转换失败: ${message}`)
    }
  }

  /**
   * 转换插槽定义
   */
  private transformSlotDefinition(node: ASTNode, context: TransformContext): TransformResult {
    const slotName = extractSlotName(node) || 'default'
    const slotProps = extractSlotProps(node)
    const fallbackContent = extractFallbackContent(node)

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
    const slotCode = generateSlotCode(slotName, slotProps)

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
    const slotTarget = extractSlotTarget(node)
    const slotProps = extractSlotProps(node)
    const slotContent = extractSlotContent(node)

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
    const slotUsageCode = generateSlotUsageCode(slotTarget, slotProps, slotContent)

    this.debug('转换插槽使用', {
      slotTarget,
      slotProps,
      slotUsageCode
    })

    return this.createSuccessResult(slotUsageCode, contextUpdates)
  }

  /**
   * 生成插槽的运行时配置
   */
  generateRuntimeConfig(slots: Record<string, any>): any {
    return generateSlotsRuntimeConfig(slots)
  }
}
