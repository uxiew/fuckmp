/**
 * v-for 指令转换插件的纯工具函数。
 */

import type { ASTNode } from '../../types/ast.js'

/**
 * v-for 表达式解析后的配置。
 */
export interface VForExpressionConfig {
  items: string
  itemName: string
  indexName?: string
  keyField?: string
}

/**
 * 解析 Vue `v-for` 字符串表达式。
 */
export function parseVForExpression(expression: ASTNode): VForExpressionConfig | null {
  if (!expression || expression.type !== 'StringLiteral') {
    return null
  }

  const expr = expression.value as string

  const patterns = [
    /^\s*\(\s*([a-zA-Z_$][a-zA-Z0-9_$]*)\s*,\s*([a-zA-Z_$][a-zA-Z0-9_$]*)\s*\)\s+(?:in|of)\s+(.+)\s*$/,
    /^\s*([a-zA-Z_$][a-zA-Z0-9_$]*)\s+(?:in|of)\s+(.+)\s*$/
  ]

  for (const pattern of patterns) {
    const match = expr.match(pattern)
    if (match) {
      if (match.length === 4) {
        return {
          items: match[3]?.trim() || '',
          itemName: match[1]?.trim() || '',
          indexName: match[2]?.trim() || ''
        }
      }

      if (match.length === 3) {
        return {
          items: match[2]?.trim() || '',
          itemName: match[1]?.trim() || '',
          indexName: 'index'
        }
      }
    }
  }

  return null
}

/**
 * 生成小程序 `wx:for` 属性字符串。
 */
export function generateWxForCode(forConfig: VForExpressionConfig): string {
  const parts: string[] = []

  parts.push(`wx:for="{{${forConfig.items}}}"`)

  if (forConfig.itemName !== 'item') {
    parts.push(`wx:for-item="${forConfig.itemName}"`)
  }

  if (forConfig.indexName && forConfig.indexName !== 'index') {
    parts.push(`wx:for-index="${forConfig.indexName}"`)
  }

  if (forConfig.keyField) {
    parts.push(`wx:key="${forConfig.keyField}"`)
  } else {
    parts.push('wx:key="index"')
  }

  return parts.join(' ')
}

/**
 * 生成列表渲染的运行时配置。
 */
export function generateVForRuntimeConfig(lists: Record<string, any>): any {
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
 * 校验列表表达式是否包含明显危险调用或全局对象访问。
 */
export function validateListExpression(items: string): boolean {
  try {
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
 * 生成过滤后的列表表达式。
 */
export function generateListFilter(items: string, filter?: string): string {
  if (!filter) return items

  return `${items}.filter(${filter})`
}

/**
 * 生成排序后的列表表达式。
 */
export function generateListSorter(items: string, sorter?: string): string {
  if (!sorter) return items

  return `${items}.sort(${sorter})`
}
