/**
 * Script 转换值工具函数。
 */

/**
 * 将脚本初始值解析为可写入小程序 data / properties 的值。
 */
export function parseScriptInitValue(value: any): any {
  if (typeof value !== 'string') {
    return value
  }

  const trimmedValue = value.trim()

  if ((trimmedValue.startsWith('"') && trimmedValue.endsWith('"')) ||
    (trimmedValue.startsWith("'") && trimmedValue.endsWith("'"))) {
    return trimmedValue.slice(1, -1)
  }

  if (/^-?\d+(\.\d+)?$/.test(trimmedValue)) {
    return parseFloat(trimmedValue)
  }

  if (trimmedValue === 'true') return true
  if (trimmedValue === 'false') return false
  if (trimmedValue === 'null') return null
  if (trimmedValue === 'undefined') return undefined

  if (trimmedValue.startsWith('{') && trimmedValue.endsWith('}')) {
    return parseLooseLiteral(trimmedValue)
  }

  if (trimmedValue.startsWith('[') && trimmedValue.endsWith(']')) {
    return parseLooseLiteral(trimmedValue)
  }

  return trimmedValue
}

/**
 * 从运行时默认值推断小程序 property 构造函数。
 */
export function inferConstructorFromValue(value: any): any {
  if (Array.isArray(value)) return Array
  if (typeof value === 'number') return Number
  if (typeof value === 'boolean') return Boolean
  if (value && typeof value === 'object') return Object
  return String
}

/**
 * 将普通值转换为宏处理器可消费的 Babel 风格字面量节点。
 */
export function createLiteralNodeFromValue(value: any): any {
  if (typeof value === 'string') {
    return { type: 'StringLiteral', value }
  }

  if (typeof value === 'number') {
    return { type: 'NumericLiteral', value }
  }

  if (typeof value === 'boolean') {
    return { type: 'BooleanLiteral', value }
  }

  if (value === null) {
    return { type: 'NullLiteral' }
  }

  if (Array.isArray(value)) {
    return {
      type: 'ArrayExpression',
      elements: value.map(item => createLiteralNodeFromValue(item))
    }
  }

  if (typeof value === 'object') {
    return {
      type: 'ObjectExpression',
      properties: Object.entries(value).map(([key, val]) => ({
        type: 'ObjectProperty',
        key: { type: 'Identifier', name: key },
        value: createLiteralNodeFromValue(val)
      }))
    }
  }

  return { type: 'Identifier', name: 'undefined' }
}

/**
 * 解析 JSON 或宽松对象 / 数组字面量，解析失败时保留原字符串。
 */
function parseLooseLiteral(value: string): any {
  try {
    return JSON.parse(value)
  } catch {
    try {
      return new Function('return ' + value)()
    } catch {
      return value
    }
  }
}
