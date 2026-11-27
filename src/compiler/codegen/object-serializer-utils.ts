/**
 * 对象字面量序列化纯 helper。
 */

const MINI_PROGRAM_TYPE_CONSTRUCTORS = ['String', 'Number', 'Boolean', 'Object', 'Array'] as const

export class LiteralOptionValue {
  constructor(readonly value: unknown) {}
}

/**
 * 对象序列化占位符递增状态。
 */
export interface SerializerPlaceholderState {
  /** 当前占位符序号。 */
  index: number
}

/**
 * 生成全局唯一的序列化占位符。
 */
export function createSerializerPlaceholder(kind: string, placeholderState: SerializerPlaceholderState): string {
  return `__${kind}_PLACEHOLDER_${placeholderState.index++}__`
}

/**
 * 深度克隆对象并把函数、表达式和类型构造函数替换为占位符。
 */
export function deepCloneWithSerializerPlaceholders(
  obj: any,
  placeholders: Map<string, string>,
  placeholderState: SerializerPlaceholderState
): any {
  if (obj === null || typeof obj !== 'object') {
    return obj
  }

  if (Array.isArray(obj)) {
    return obj.map(item => deepCloneWithSerializerPlaceholders(item, placeholders, placeholderState))
  }

  const cloned: any = {}
  for (const [key, value] of Object.entries(obj)) {
    if (value instanceof LiteralOptionValue) {
      const placeholder = createSerializerPlaceholder('DATA', placeholderState)
      placeholders.set(placeholder, stringifyObjectLiteral(value.value, 2, true))
      cloned[key] = placeholder
    } else if (typeof value === 'function') {
      const placeholder = createSerializerPlaceholder('FUNCTION', placeholderState)
      placeholders.set(placeholder, value.toString())
      cloned[key] = placeholder
    } else if (typeof value === 'string' && isSerializerFunctionString(value)) {
      const placeholder = createSerializerPlaceholder('FUNCTION', placeholderState)
      const convertedFunction = convertArrowFunctionToRegular(value)
      placeholders.set(placeholder, convertedFunction)
      cloned[key] = placeholder
    } else if (typeof value === 'string' && isSerializerExpressionString(value)) {
      const placeholder = createSerializerPlaceholder('EXPRESSION', placeholderState)
      placeholders.set(placeholder, fixDateExpression(value))
      cloned[key] = placeholder
    } else if (typeof value === 'string' && isMiniProgramTypeConstructor(value)) {
      const placeholder = createSerializerPlaceholder('TYPE', placeholderState)
      placeholders.set(placeholder, value)
      cloned[key] = placeholder
    } else if (typeof value === 'object') {
      cloned[key] = deepCloneWithSerializerPlaceholders(value, placeholders, placeholderState)
    } else {
      cloned[key] = value
    }
  }

  return cloned
}

/**
 * 检查字符串是否为函数代码。
 */
export function isSerializerFunctionString(str: string): boolean {
  if (!str || typeof str !== 'string') return false

  if (str.includes('=>')) return true
  if (str.startsWith('function')) return true

  if (str.includes('{') && str.includes('}')) {
    return str.includes('return') || str.includes('if') || str.includes('for') || str.includes('while')
  }

  return false
}

/**
 * 将对象序列化为 JavaScript 对象字面量格式（不给属性名加引号）。
 */
export function stringifyObjectLiteral(obj: any, indent: number = 0, literal = false): string {
  if (obj === null) return 'null'
  if (obj === undefined) return 'undefined'
  if (typeof obj === 'boolean') return obj.toString()
  if (typeof obj === 'number') return Object.is(obj, -0) ? '-0' : obj.toString()
  if (typeof obj === 'string') {
    if (!literal && isSerializerExpressionString(obj)) {
      return obj
    }
    return JSON.stringify(obj)
  }

  if (Array.isArray(obj)) {
    const items = obj.map(item => stringifyObjectLiteral(item, indent + 2, literal))
    return `[${items.join(', ')}]`
  }

  if (typeof obj === 'object') {
    const spaces = ' '.repeat(indent)
    const nextSpaces = ' '.repeat(indent + 2)
    const entries = Object.entries(obj).map(([key, value]) => {
      const valueStr = stringifyObjectLiteral(value, indent + 2, literal)
      const keyStr = literal && key === '__proto__' ? '["__proto__"]'
        : literal && !/^[$a-zA-Z_][$\w]*$/.test(key) ? JSON.stringify(key) : key
      return `${nextSpaces}${keyStr}: ${valueStr}`
    })

    if (entries.length === 0) {
      return '{}'
    }

    return `{\n${entries.join(',\n')}\n${spaces}}`
  }

  return String(obj)
}

/**
 * 修复日期表达式中的八进制字面量问题。
 */
export function fixDateExpression(str: string): string {
  return str.replace(/new Date\((\d{4}-\d{2}-\d{2})\)/g, "new Date('$1')")
}

/**
 * 检查字符串是否为可直接输出的表达式代码。
 */
export function isSerializerExpressionString(str: string): boolean {
  if (!str || typeof str !== 'string') return false

  if (str === 'true' || str === 'false') return true
  if (/^\d+(\.\d+)?$/.test(str)) return true
  if (isMiniProgramTypeConstructor(str)) return true
  if (str.startsWith('new ') && !str.includes('this.')) return true
  if (str.startsWith('{') && str.endsWith('}') && !str.includes('this.')) return true
  if (str.startsWith('[') && str.endsWith(']') && !str.includes('this.')) return true

  if (str.includes('(') && str.includes(')') && !str.includes('=>') && !str.startsWith('function') && !str.includes('this.')) {
    return true
  }

  if (str.startsWith('this.')) return false
  if (/^\w+\(.*\)$/.test(str) && !str.includes('this.')) return true

  return false
}

/**
 * 将顶层箭头函数转换为普通函数。
 */
export function convertArrowFunctionToRegular(functionStr: string): string {
  if (!functionStr || typeof functionStr !== 'string') {
    return functionStr
  }

  const trimmed = functionStr.trim()

  if (trimmed.startsWith('function')) {
    return functionStr
  }

  const topLevelArrowStart = /^(?:async\s*)?(\([^)]*\)|[A-Za-z_$][\w$]*)\s*=>/s
  if (!topLevelArrowStart.test(trimmed)) {
    return functionStr
  }

  const arrowFunctionRegex = /^(?:async\s*)?(\([^)]*\)|[A-Za-z_$][\w$]*)\s*=>\s*(.+)$/s
  const match = trimmed.match(arrowFunctionRegex)

  if (match && match[1] && match[2]) {
    let params = match[1].trim()
    const body = match[2].trim()

    if (params.startsWith('(') && params.endsWith(')')) {
      params = params.slice(1, -1)
    }

    if (!body.startsWith('{')) {
      return `function(${params}) { return ${body} }`
    }

    return `function(${params}) ${body}`
  }

  return functionStr
}

/**
 * 检测并转换事件处理函数，使其能够从 dataset 中获取单个参数。
 */
export interface EventHandlerConversionOptions {
  /** 单参数 handler 的 payload 来源。dataset 用于原生事件参数，detail 用于组件自定义事件。 */
  singleParamSource?: 'dataset' | 'detail'
}

export function convertEventHandlerFunction(
  functionName: string,
  functionStr: string,
  options: EventHandlerConversionOptions = {}
): string {
  if (!functionStr || typeof functionStr !== 'string') {
    return functionStr
  }

  if (!isSerializerEventHandlerName(functionName)) {
    return functionStr
  }

  const functionRegex = /^function\s*\(\s*([^)]+)\s*\)\s*\{([\s\S]*)\}$/
  const functionMatch = functionStr.match(functionRegex)

  if (functionMatch && functionMatch[1] && functionMatch[2]) {
    const params = functionMatch[1].trim()
    const body = functionMatch[2].trim()

    if (params && !params.includes(',')) {
      return convertSingleParamEventHandler(params.trim(), body, options.singleParamSource || 'dataset')
    }
  }

  const arrowRegex = /^(\([^)]*\)|[^=]+)\s*=>\s*\{([\s\S]*)\}$/
  const arrowMatch = functionStr.match(arrowRegex)

  if (arrowMatch && arrowMatch[1] && arrowMatch[2]) {
    let params = arrowMatch[1].trim()
    const body = arrowMatch[2].trim()

    if (params.startsWith('(') && params.endsWith(')')) {
      params = params.slice(1, -1)
    }

    if (params && !params.includes(',')) {
      return convertSingleParamEventHandler(params.trim(), body, options.singleParamSource || 'dataset')
    }
  }

  return functionStr
}

/**
 * 转换字符串中的对象方法箭头函数为普通函数。
 */
export function convertObjectMethodArrowFunctions(str: string): string {
  const methodArrowRegex = /("[\w]+"):\s*(\([^)]*\)|\w*)\s*=>\s*\{([\s\S]*?)\}/g

  return str.replace(methodArrowRegex, (_match, methodName, params, body) => {
    let cleanParams = params.trim()
    if (cleanParams.startsWith('(') && cleanParams.endsWith(')')) {
      cleanParams = cleanParams.slice(1, -1)
    }

    return `${methodName}: function(${cleanParams}) {${body}}`
  })
}

function isMiniProgramTypeConstructor(str: string): boolean {
  return (MINI_PROGRAM_TYPE_CONSTRUCTORS as readonly string[]).includes(str)
}

function isSerializerEventHandlerName(functionName: string): boolean {
  const eventHandlerPatterns = [
    /^handle/i,
    /^on[A-Z]/,
    /Click$/,
    /Tap$/,
    /Press$/,
    /Touch$/,
  ]

  return eventHandlerPatterns.some(pattern => pattern.test(functionName))
}

function convertSingleParamEventHandler(
  paramName: string,
  body: string,
  source: 'dataset' | 'detail'
): string {
  if (isNativeEventParameterName(paramName)) {
    return `function(${paramName}) { ${body} }`
  }

  if (source === 'detail') {
    const newBody = `
    const ${paramName} = event.detail;
    ${body}`

    return `function(event) {${newBody}
  }`
  }

  const newBody = `
    // 从事件对象的dataset中获取参数
    const ${paramName} = event.currentTarget.dataset.arg0;
    ${body}`

  return `function(event) {${newBody}
  }`
}

/** 判断单参数事件 handler 是否已经接收微信原生事件对象。 */
function isNativeEventParameterName(paramName: string): boolean {
  return ['event', 'e', 'evt'].includes(paramName)
}
