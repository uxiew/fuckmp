/**
 * 页面 methods 代码生成工具。
 */

/**
 * 生成页面 methods 代码片段。
 */
export function generatePageMethodsCode(methods: Record<string, any>): string {
  const entries = Object.entries(methods).map(([name, method]) => {
    if (typeof method === 'function') {
      const funcStr = method.toString()
      return `  ${name}${funcStr.substring(funcStr.indexOf('('))}`
    } else if (method && typeof method === 'object' && method.body) {
      return generateObjectMethodCode(name, method.body.trim())
    } else if (typeof method === 'string') {
      return generateStringMethodCode(name, method.trim())
    }

    return `  ${name}() {
    // 方法实现
  }`
  })

  if (entries.length === 0) {
    return ''
  }

  return entries.join(',\n\n')
}

function generateObjectMethodCode(name: string, body: string): string {
  if (body.includes('=>')) {
    const arrowMatch = body.match(/^\((.*?)\)\s*=>\s*(.*)$/s)
    if (arrowMatch) {
      const params = arrowMatch[1] ?? ''
      let functionBody = arrowMatch[2]?.trim() ?? ''

      if (functionBody.startsWith('{') && functionBody.endsWith('}')) {
        functionBody = functionBody.slice(1, -1).trim()
        return `  ${name}(${params}) {
    ${functionBody}
  }`
      }

      return `  ${name}(${params}) {
    return ${functionBody}
  }`
    }
  }

  if (body.includes('function')) {
    const funcMatch = body.match(/function\s*\((.*?)\)\s*(.+)/)
    if (funcMatch) {
      const params = funcMatch[1] ?? ''
      const functionBody = funcMatch[2] ?? ''
      return `  ${name}(${params}) ${functionBody}`
    }
  }

  return `  ${name}() {
    ${body}
  }`
}

function generateStringMethodCode(name: string, body: string): string {
  if (body.includes('=>')) {
    const arrowMatch = body.match(/^\((.*?)\)\s*=>\s*(.*)$/s)
    if (arrowMatch) {
      const params = arrowMatch[1] ?? ''
      let functionBody = arrowMatch[2]?.trim() || ''

      if (functionBody.startsWith('{') && functionBody.endsWith('}')) {
        functionBody = functionBody.slice(1, -1).trim()
        return `  ${name}(${params}) {
    ${functionBody}
  }`
      }

      return `  ${name}(${params}) {
    return ${functionBody}
  }`
    }
  }

  return `  ${name}() {
    ${body}
  }`
}
