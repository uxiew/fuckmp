/**
 * v-for 指令转换插件
 * 将 Vue 的列表渲染转换为小程序的列表渲染语法
 */

import { BaseTransformPlugin } from '../base/transform-plugin'
import type { TransformResult } from '../base/transform-plugin'
import type { ASTNode } from '../../types/ast'
import type { TransformContext } from '../../types/compiler'

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
    const forConfig = this.parseForExpression(expression)
    if (!forConfig) {
      return this.createErrorResult('v-for 指令表达式格式错误')
    }

    // 生成小程序的wx:for语法
    const wxForCode = this.generateWxForCode(forConfig)

    this.debug('转换 v-for', { forConfig, wxForCode })

    return this.createSuccessResult(wxForCode)
  }

  /**
   * 解析 v-for 表达式
   */
  private parseForExpression(expression: ASTNode): {
    items: string
    itemName: string
    indexName?: string
    keyField?: string
  } | null {
    if (!expression || expression.type !== 'StringLiteral') {
      return null
    }

    const expr = expression.value as string

    // 支持的格式：
    // item in items
    // (item, index) in items
    // item of items
    // (item, index) of items

    const patterns = [
      // (item, index) in items
      /^\s*\(\s*([a-zA-Z_$][a-zA-Z0-9_$]*)\s*,\s*([a-zA-Z_$][a-zA-Z0-9_$]*)\s*\)\s+(?:in|of)\s+(.+)\s*$/,
      // item in items
      /^\s*([a-zA-Z_$][a-zA-Z0-9_$]*)\s+(?:in|of)\s+(.+)\s*$/
    ]

    for (const pattern of patterns) {
      const match = expr.match(pattern)
      if (match) {
        if (match.length === 4) {
          // (item, index) in items
          return {
            items: match[3]?.trim() || '',
            itemName: match[1]?.trim() || '',
            indexName: match[2]?.trim() || ''
          }
        } else if (match.length === 3) {
          // item in items
          return {
            items: match[2]?.trim() || '',
            itemName: match[1]?.trim() || '',
            indexName: 'index' // 默认索引名
          }
        }
      }
    }

    return null
  }

  /**
   * 生成小程序的wx:for代码
   */
  private generateWxForCode(forConfig: {
    items: string
    itemName: string
    indexName?: string
    keyField?: string
  }): string {
    const parts: string[] = []

    // wx:for
    parts.push(`wx:for="{{${forConfig.items}}}"`)

    // wx:for-item
    if (forConfig.itemName !== 'item') {
      parts.push(`wx:for-item="${forConfig.itemName}"`)
    }

    // wx:for-index
    if (forConfig.indexName && forConfig.indexName !== 'index') {
      parts.push(`wx:for-index="${forConfig.indexName}"`)
    }

    // wx:key
    if (forConfig.keyField) {
      parts.push(`wx:key="${forConfig.keyField}"`)
    } else {
      // 默认使用索引作为key
      parts.push(`wx:key="index"`)
    }

    return parts.join(' ')
  }

  /**
   * 生成元素模板
   */
  private generateElementTemplate(element: any): string {
    if (!element) return ''

    // 这里应该根据实际的元素结构生成模板
    // 简化实现，返回元素的字符串表示
    return element.outerHTML || element.toString() || ''
  }

  /**
   * 生成列表键
   */
  private generateListKey(items: string, itemName: string): string {
    const hash = this.simpleHash(`${items}_${itemName}`)
    return `list_${hash}`
  }

  /**
   * 简单哈希函数
   */
  private simpleHash(str: string): string {
    let hash = 0
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i)
      hash = ((hash << 5) - hash) + char
      hash = hash & hash // 转换为32位整数
    }
    return Math.abs(hash).toString(36)
  }

  /**
   * 生成列表渲染的运行时配置
   */
  generateRuntimeConfig(lists: Record<string, any>): any {
    return {
      type: 'list',
      lists: Object.entries(lists).map(([key, config]) => ({
        key,
        items: config.items,
        itemName: config.itemName,
        indexName: config.indexName,
        keyField: config.keyField,
        template: config.template
      }))
    }
  }

  /**
   * 优化列表表达式
   */
  private optimizeListExpression(items: string): string {
    // 简单的表达式优化
    return items.trim()
  }

  /**
   * 验证列表表达式
   */
  private validateListExpression(items: string): boolean {
    // 简单的验证
    try {
      // 检查是否包含危险的代码
      const dangerousPatterns = [
        /eval\s*\(/,
        /Function\s*\(/,
        /setTimeout\s*\(/,
        /setInterval\s*\(/,
        /document\./,
        /window\./,
        /global\./
      ]

      for (const pattern of dangerousPatterns) {
        if (pattern.test(items)) {
          return false
        }
      }

      return true
    } catch (error) {
      return false
    }
  }

  /**
   * 检测key字段
   */
  private detectKeyField(element: any): string | undefined {
    // 检查元素是否有:key属性
    if (element && element.attributes) {
      for (const attr of element.attributes) {
        if (attr.name === ':key' || attr.name === 'v-bind:key') {
          return attr.value
        }
      }
    }
    return undefined
  }

  /**
   * 生成性能优化的列表渲染
   */
  private generateOptimizedListRendering(forConfig: any): {
    code: string
    optimizations: string[]
  } {
    const optimizations: string[] = []
    let code = this.generateWxForCode(forConfig)

    // 如果没有指定key，建议使用唯一标识
    if (!forConfig.keyField) {
      optimizations.push('建议为列表项指定唯一的key以提高渲染性能')
    }

    // 检查是否为嵌套循环
    if (forConfig.items.includes('.')) {
      optimizations.push('检测到嵌套数据结构，建议优化数据结构以提高性能')
    }

    return { code, optimizations }
  }

  /**
   * 处理嵌套v-for
   */
  private handleNestedVFor(
    expression: ASTNode,
    element: any,
    context: TransformContext,
    parentForConfig?: any
  ): TransformResult {
    const forConfig = this.parseForExpression(expression)
    if (!forConfig) {
      return this.createErrorResult('嵌套 v-for 指令表达式格式错误')
    }

    // 为嵌套循环生成唯一的变量名
    if (parentForConfig) {
      forConfig.itemName = `${parentForConfig.itemName}_${forConfig.itemName}`
      if (forConfig.indexName) {
        forConfig.indexName = `${parentForConfig.indexName}_${forConfig.indexName}`
      }
    }

    return this.transformVFor(expression)
  }

  /**
   * 生成列表过滤器
   */
  private generateListFilter(items: string, filter?: string): string {
    if (!filter) return items

    // 生成过滤后的列表表达式
    return `${items}.filter(${filter})`
  }

  /**
   * 生成列表排序器
   */
  private generateListSorter(items: string, sorter?: string): string {
    if (!sorter) return items

    // 生成排序后的列表表达式
    return `${items}.sort(${sorter})`
  }
}
