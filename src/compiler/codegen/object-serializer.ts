/**
 * 对象字面量序列化器。
 *
 * 负责把编译上下文中的对象、函数串和表达式串转换为小程序可执行的
 * JavaScript 对象字面量，保持 CodeGenerator 输出格式稳定。
 */
export class ObjectLiteralSerializer {
  /**
   * 将对象序列化为字符串，保留函数
   */
  stringifyWithFunctions(obj: any): string {
    const functionPlaceholders = new Map<string, string>()
    let placeholderIndex = 0

    // 第一步：深度克隆对象并处理函数和表达式
    const processedObj = this.deepCloneWithPlaceholders(obj, functionPlaceholders, placeholderIndex)

    // 第二步：序列化对象，使用自定义格式
    let result = this.stringifyObjectLiteral(processedObj, 2)

    // 第三步：恢复函数
    for (const [placeholder, functionCode] of functionPlaceholders) {
      result = result.replace(`"${placeholder}"`, functionCode)
    }

    // 第四步：转换所有剩余的箭头函数为普通函数
    result = this.convertAllArrowFunctions(result)

    return result
  }

  /**
   * 深度克隆对象并处理函数和表达式
   */
  private deepCloneWithPlaceholders(obj: any, placeholders: Map<string, string>, placeholderIndex: number): any {
    if (obj === null || typeof obj !== 'object') {
      return obj
    }

    if (Array.isArray(obj)) {
      return obj.map(item => this.deepCloneWithPlaceholders(item, placeholders, placeholderIndex))
    }

    const cloned: any = {}
    for (const [key, value] of Object.entries(obj)) {
      if (typeof value === 'function') {
        const placeholder = `__FUNCTION_PLACEHOLDER_${placeholderIndex++}__`
        placeholders.set(placeholder, value.toString())
        cloned[key] = placeholder
      } else if (typeof value === 'string' && this.isFunctionString(value)) {
        // 检查是否为函数字符串，并转换箭头函数为普通函数
        const placeholder = `__FUNCTION_PLACEHOLDER_${placeholderIndex++}__`
        const convertedFunction = this.convertArrowFunctionToRegular(value)
        placeholders.set(placeholder, convertedFunction)
        cloned[key] = placeholder
      } else if (typeof value === 'string' && this.isExpressionString(value)) {
        // 检查是否为表达式字符串（如 new Date(), 对象字面量等）
        const placeholder = `__EXPRESSION_PLACEHOLDER_${placeholderIndex++}__`
        // 修复日期表达式中的八进制字面量问题
        const fixedValue = this.fixDateExpression(value)
        placeholders.set(placeholder, fixedValue)
        cloned[key] = placeholder
      } else if (typeof value === 'string' && ['String', 'Number', 'Boolean', 'Object', 'Array'].includes(value)) {
        // 特殊处理小程序类型构造函数，避免被JSON.stringify包装成字符串
        const placeholder = `__TYPE_PLACEHOLDER_${placeholderIndex++}__`
        placeholders.set(placeholder, value)
        cloned[key] = placeholder
      } else if (typeof value === 'object') {
        cloned[key] = this.deepCloneWithPlaceholders(value, placeholders, placeholderIndex)
      } else {
        cloned[key] = value
      }
    }

    return cloned
  }

  /**
   * 检查字符串是否为函数代码
   */
  private isFunctionString(str: string): boolean {
    if (!str || typeof str !== 'string') return false

    // 检查是否为箭头函数
    if (str.includes('=>')) return true

    // 检查是否为普通函数
    if (str.startsWith('function')) return true

    // 检查是否为函数体（包含大括号和return等关键字）
    if (str.includes('{') && str.includes('}')) {
      return str.includes('return') || str.includes('if') || str.includes('for') || str.includes('while')
    }

    return false
  }

  /**
   * 将对象序列化为 JavaScript 对象字面量格式（不给属性名加引号）
   */
  stringifyObjectLiteral(obj: any, indent: number = 0): string {
    if (obj === null) return 'null'
    if (obj === undefined) return 'undefined'
    if (typeof obj === 'boolean') return obj.toString()
    if (typeof obj === 'number') return obj.toString()
    if (typeof obj === 'string') {
      // 检查是否为表达式字符串，如果是则不添加引号
      if (this.isExpressionString(obj)) {
        return obj
      }
      return JSON.stringify(obj)
    }

    if (Array.isArray(obj)) {
      const items = obj.map(item => this.stringifyObjectLiteral(item, indent + 2))
      return `[${items.join(', ')}]`
    }

    if (typeof obj === 'object') {
      const spaces = ' '.repeat(indent)
      const nextSpaces = ' '.repeat(indent + 2)
      const entries = Object.entries(obj).map(([key, value]) => {
        const valueStr = this.stringifyObjectLiteral(value, indent + 2)
        return `${nextSpaces}${key}: ${valueStr}`
      })

      if (entries.length === 0) {
        return '{}'
      }

      return `{\n${entries.join(',\n')}\n${spaces}}`
    }

    return String(obj)
  }

  /**
   * 修复日期表达式中的八进制字面量问题
   */
  private fixDateExpression(str: string): string {
    // 修复 new Date(2023-01-15) 格式的日期表达式
    // 将其转换为 new Date('2023-01-15') 格式
    return str.replace(/new Date\((\d{4}-\d{2}-\d{2})\)/g, "new Date('$1')")
  }

  /**
   * 检查字符串是否为表达式代码
   */
  private isExpressionString(str: string): boolean {
    if (!str || typeof str !== 'string') return false

    // 检查是否为布尔值
    if (str === 'true' || str === 'false') return true

    // 检查是否为数字
    if (/^\d+(\.\d+)?$/.test(str)) return true

    // 检查是否为小程序类型构造函数（不加引号）
    if (['String', 'Number', 'Boolean', 'Object', 'Array'].includes(str)) return true

    // 检查是否为 new 表达式（但不包含this的表达式，因为在data中不能使用this）
    if (str.startsWith('new ') && !str.includes('this.')) return true

    // 检查是否为对象字面量
    if (str.startsWith('{') && str.endsWith('}') && !str.includes('this.')) return true

    // 检查是否为数组字面量
    if (str.startsWith('[') && str.endsWith(']') && !str.includes('this.')) return true

    // 检查是否为计算表达式（但不包含this）
    if (str.includes('(') && str.includes(')') && !str.includes('=>') && !str.startsWith('function') && !str.includes('this.')) {
      return true
    }

    // 不允许this.开头的表达式在data中使用
    if (str.startsWith('this.')) return false

    // 检查是否为函数调用（但不包含this）
    if (/^\w+\(.*\)$/.test(str) && !str.includes('this.')) return true

    return false
  }

  /**
   * 将箭头函数转换为普通函数
   */
  private convertArrowFunctionToRegular(functionStr: string): string {
    if (!functionStr || typeof functionStr !== 'string') {
      return functionStr
    }

    const trimmed = functionStr.trim()

    // 只转换顶层箭头函数。普通 function 内部可能包含嵌套箭头函数，
    // 不能把整个函数字符串误判为箭头函数参数。
    if (trimmed.startsWith('function')) {
      return functionStr
    }

    const topLevelArrowStart = /^(?:async\s*)?(\([^)]*\)|[A-Za-z_$][\w$]*)\s*=>/s
    if (!topLevelArrowStart.test(trimmed)) {
      return functionStr
    }

    // 匹配 (参数) => { 函数体 } 或 参数 => { 函数体 }
    const arrowFunctionRegex = /^(?:async\s*)?(\([^)]*\)|[A-Za-z_$][\w$]*)\s*=>\s*(.+)$/s
    const match = trimmed.match(arrowFunctionRegex)

    if (match && match[1] && match[2]) {
      let params = match[1].trim()
      const body = match[2].trim()

      // 移除参数周围的括号（如果只有一个参数且没有括号）
      if (params.startsWith('(') && params.endsWith(')')) {
        params = params.slice(1, -1)
      }

      // 如果函数体不是以 { 开始，说明是表达式，需要添加 return
      if (!body.startsWith('{')) {
        return `function(${params}) { return ${body} }`
      } else {
        return `function(${params}) ${body}`
      }
    }

    return functionStr
  }

  /**
   * 检测并转换事件处理函数，使其能够从dataset中获取参数
   */
  convertEventHandlerFunction(functionName: string, functionStr: string): string {
    if (!functionStr || typeof functionStr !== 'string') {
      return functionStr
    }

    // 检测是否为事件处理器
    if (!this.isEventHandlerName(functionName)) {
      return functionStr
    }

    // 检测普通函数格式: function(params) { body }
    const functionRegex = /^function\s*\(\s*([^)]+)\s*\)\s*\{([\s\S]*)\}$/
    const functionMatch = functionStr.match(functionRegex)

    if (functionMatch && functionMatch[1] && functionMatch[2]) {
      const params = functionMatch[1].trim()
      const body = functionMatch[2].trim()

      // 如果函数只有一个参数，则转换它
      if (params && !params.includes(',')) {
        const paramName = params.trim()

        // 在函数体开头添加从dataset获取参数的代码
        const newBody = `
    // 从事件对象的dataset中获取参数
    const ${paramName} = event.currentTarget.dataset.arg0;
    ${body}`

        return `function(event) {${newBody}
  }`
      }
    }

    // 检测箭头函数格式: (params) => { body } 或 params => { body }
    const arrowRegex = /^(\([^)]*\)|[^=]+)\s*=>\s*\{([\s\S]*)\}$/
    const arrowMatch = functionStr.match(arrowRegex)

    if (arrowMatch && arrowMatch[1] && arrowMatch[2]) {
      let params = arrowMatch[1].trim()
      const body = arrowMatch[2].trim()

      // 移除参数周围的括号（如果存在）
      if (params.startsWith('(') && params.endsWith(')')) {
        params = params.slice(1, -1)
      }

      // 如果函数只有一个参数，则转换它
      if (params && !params.includes(',')) {
        const paramName = params.trim()

        // 在函数体开头添加从dataset获取参数的代码
        const newBody = `
    // 从事件对象的dataset中获取参数
    const ${paramName} = event.currentTarget.dataset.arg0;
    ${body}`

        return `function(event) {${newBody}
  }`
      }
    }

    return functionStr
  }

  /**
   * 判断函数名是否看起来像事件处理器
   */
  private isEventHandlerName(functionName: string): boolean {
    const eventHandlerPatterns = [
      /^handle/i,      // handleClick, handleMenuClick
      /^on[A-Z]/,      // onClick, onSubmit
      /Click$/,        // menuClick, buttonClick
      /Tap$/,          // menuTap, itemTap
      /Press$/,        // longPress
      /Touch$/,        // touchStart, touchEnd
    ]

    return eventHandlerPatterns.some(pattern => pattern.test(functionName))
  }

  /**
   * 转换字符串中的所有箭头函数为普通函数
   */
  private convertAllArrowFunctions(str: string): string {
    // 匹配对象方法中的箭头函数：  "methodName": (params) => { body }
    // 更精确的正则表达式，处理多行函数体
    const methodArrowRegex = /("[\w]+"):\s*(\([^)]*\)|\w*)\s*=>\s*\{([\s\S]*?)\}/g

    return str.replace(methodArrowRegex, (match, methodName, params, body) => {
      // 移除参数周围的括号（如果存在）
      let cleanParams = params.trim()
      if (cleanParams.startsWith('(') && cleanParams.endsWith(')')) {
        cleanParams = cleanParams.slice(1, -1)
      }

      return `${methodName}: function(${cleanParams}) {${body}}`
    })
  }
}
