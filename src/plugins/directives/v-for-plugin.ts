/**
 * v-for 指令转换插件
 * 将 Vue 的列表渲染转换为小程序的列表渲染语法
 */

import { BaseTransformPlugin } from '../base/transform-plugin'
import type { TransformResult } from '../base/transform-plugin'
import type { ASTNode } from '../../types/ast'
import type { TransformContext } from '../../types/compiler'
import {
  generateVForRuntimeConfig,
  generateWxForCode,
  parseVForExpression
} from './v-for-plugin-utils.js'

export class VForPlugin extends BaseTransformPlugin {
  readonly name = 'v-for-plugin'
  readonly version = '1.0.0'
  readonly priority = 85

  supports(node: ASTNode, _context: TransformContext): boolean {
    // 检查是否为 v-for 指令
    return node.type === 'VueDirective' && node.name === 'for'
  }

  async transform(node: ASTNode, _context: TransformContext): Promise<TransformResult> {
    try {
      if (!this.supports(node, _context)) {
        return this.createUnhandledResult()
      }

      const expression = node.expression
      return this.transformVFor(expression)
    } catch (error) {
      return this.createErrorResult(`v-for 转换失败: ${(error as Error).message}`)
    }
  }

  /**
   * 转换 v-for 指令
   */
  private transformVFor(expression: ASTNode): TransformResult {
    const forConfig = parseVForExpression(expression)
    if (!forConfig) {
      return this.createErrorResult('v-for 指令表达式格式错误')
    }

    // 生成小程序的wx:for语法
    const wxForCode = generateWxForCode(forConfig)

    this.debug('转换 v-for', { forConfig, wxForCode })

    return this.createSuccessResult(wxForCode)
  }

  /**
   * 生成列表渲染的运行时配置
   */
  generateRuntimeConfig(lists: Record<string, any>): any {
    return generateVForRuntimeConfig(lists)
  }
}
