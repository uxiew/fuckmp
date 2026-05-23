/**
 * 生命周期宏处理器纯函数工具。
 */

import { LIFECYCLE_MAP } from '@/types/index.js'
import { logger } from '@/utils/index.js'

/**
 * 从生命周期宏参数中提取可注入到小程序生命周期中的回调代码。
 */
export function extractLifecycleCallback(node: any): string {
  if (node.type === 'ArrowFunctionExpression' || node.type === 'FunctionExpression') {
    return extractFunctionBody(node)
  }

  if (node.type === 'Identifier') {
    return `this.${node.name}()`
  }

  if (node.type === 'StringLiteral' && typeof node.value === 'string') {
    return extractCallbackFunctionString(node.value)
  }

  return '// 无效的回调函数'
}

/**
 * 获取对应的小程序生命周期钩子。
 */
export function resolveMiniprogramLifecycleHook(vueHook: string, isPage: boolean): string {
  const mapping = LIFECYCLE_MAP[vueHook as keyof typeof LIFECYCLE_MAP]

  if (!mapping) {
    logger.warn(`未知的 Vue 生命周期钩子: ${vueHook}`)
    return 'unknown'
  }

  if (isPage) {
    switch (vueHook) {
      case 'onMounted':
        return 'onReady'
      case 'onUnmounted':
        return 'onUnload'
      case 'onActivated':
        return 'onShow'
      case 'onDeactivated':
        return 'onHide'
      default:
        return mapping
    }
  }

  switch (vueHook) {
    case 'onBeforeMount':
      return 'created'
    case 'onMounted':
      return 'attached'
    case 'onBeforeUnmount':
    case 'onUnmounted':
      return 'detached'
    case 'onActivated':
      return 'pageLifetimes.show'
    case 'onDeactivated':
      return 'pageLifetimes.hide'
    default:
      return mapping
  }
}

/**
 * 从解析阶段保留下来的函数字符串中提取函数体。
 */
function extractCallbackFunctionString(source: string): string {
  const trimmed = source.trim()

  if (!trimmed) {
    return '// 空生命周期回调'
  }

  const arrowIndex = trimmed.indexOf('=>')
  if (arrowIndex >= 0) {
    return unwrapFunctionBody(trimmed.slice(arrowIndex + 2))
  }

  const functionBodyMatch = trimmed.match(/^function\s*\([^)]*\)\s*([\s\S]*)$/)
  if (functionBodyMatch?.[1]) {
    return unwrapFunctionBody(functionBodyMatch[1])
  }

  if (/^[A-Za-z_$][\w$]*$/.test(trimmed)) {
    return `this.${trimmed}()`
  }

  return trimmed
}

/**
 * 去掉函数字符串最外层代码块，保留内部语句。
 */
function unwrapFunctionBody(source: string): string {
  const trimmed = source.trim()

  if (trimmed.startsWith('{') && trimmed.endsWith('}')) {
    return trimmed.slice(1, -1).trim()
  }

  return trimmed
}

/**
 * 提取函数体。
 */
function extractFunctionBody(funcNode: any): string {
  if (funcNode.body.type === 'BlockStatement') {
    return funcNode.body.body
      .map((stmt: any) => generateStatementCode(stmt))
      .join('\n      ')
  }

  return generateExpressionCode(funcNode.body)
}

/**
 * 生成语句代码。
 */
function generateStatementCode(stmt: any): string {
  switch (stmt.type) {
    case 'ExpressionStatement':
      return generateExpressionCode(stmt.expression)
    case 'VariableDeclaration':
      return generateVariableDeclaration(stmt)
    case 'IfStatement':
      return generateIfStatement(stmt)
    case 'ForStatement':
    case 'WhileStatement':
      return generateLoopStatement(stmt)
    case 'ReturnStatement':
      return stmt.argument ? `return ${generateExpressionCode(stmt.argument)}` : 'return'
    case 'BlockStatement':
      return stmt.body.map((s: any) => generateStatementCode(s)).join('\n      ')
    default:
      return `// 未支持的语句类型: ${stmt.type}`
  }
}

/**
 * 生成表达式代码。
 */
function generateExpressionCode(expr: any): string {
  if (!expr) return ''

  switch (expr.type) {
    case 'Identifier':
      return expr.name
    case 'MemberExpression':
      return generateMemberExpressionCode(expr)
    case 'CallExpression':
      return generateCallExpressionCode(expr)
    case 'AssignmentExpression':
      return `${generateExpressionCode(expr.left)} ${expr.operator} ${generateExpressionCode(expr.right)}`
    case 'BinaryExpression':
      return `${generateExpressionCode(expr.left)} ${expr.operator} ${generateExpressionCode(expr.right)}`
    case 'StringLiteral':
      return quoteStringLiteral(expr.value)
    case 'NumericLiteral':
      return expr.value.toString()
    case 'BooleanLiteral':
      return expr.value.toString()
    case 'ThisExpression':
      return 'this'
    case 'ObjectExpression':
      return generateObjectExpressionCode(expr)
    case 'ArrayExpression':
      return generateArrayExpressionCode(expr)
    default:
      return `/* 未支持的表达式: ${expr.type} */`
  }
}

/**
 * 生成成员表达式代码。
 */
function generateMemberExpressionCode(expr: any): string {
  const object = generateExpressionCode(expr.object)
  const property = expr.computed
    ? `[${generateExpressionCode(expr.property)}]`
    : `.${expr.property.name}`

  return `${object}${property}`
}

/**
 * 生成调用表达式代码。
 */
function generateCallExpressionCode(expr: any): string {
  const callee = generateExpressionCode(expr.callee)
  const args = expr.arguments.map((arg: any) => generateExpressionCode(arg)).join(', ')
  return `${callee}(${args})`
}

/**
 * 生成对象表达式代码。
 */
function generateObjectExpressionCode(expr: any): string {
  const properties = expr.properties.map((prop: any) => {
    if (prop.type === 'ObjectProperty') {
      const key = prop.key.type === 'Identifier' ? prop.key.name : generateExpressionCode(prop.key)
      const value = generateExpressionCode(prop.value)
      return `${key}: ${value}`
    }
    return ''
  }).filter(Boolean)

  return `{ ${properties.join(', ')} }`
}

/**
 * 生成数组表达式代码。
 */
function generateArrayExpressionCode(expr: any): string {
  const elements = expr.elements.map((el: any) => el ? generateExpressionCode(el) : 'null')
  return `[${elements.join(', ')}]`
}

/**
 * 生成变量声明。
 */
function generateVariableDeclaration(stmt: any): string {
  const declarations = stmt.declarations.map((decl: any) => {
    const id = decl.id.name
    const init = decl.init ? generateExpressionCode(decl.init) : 'undefined'
    return `${id} = ${init}`
  })

  return `${stmt.kind} ${declarations.join(', ')}`
}

/**
 * 生成 if 语句。
 */
function generateIfStatement(stmt: any): string {
  const test = generateExpressionCode(stmt.test)
  const consequent = generateStatementCode(stmt.consequent)
  const alternate = stmt.alternate ? generateStatementCode(stmt.alternate) : ''

  return `if (${test}) {
        ${consequent}
      }${alternate ? ` else {
        ${alternate}
      }` : ''}`
}

/**
 * 生成循环语句。
 */
function generateLoopStatement(stmt: any): string {
  return `// 循环语句暂不支持转换: ${stmt.type}`
}

/**
 * 生成单引号字符串字面量，并转义会破坏最终 JS 语法的字符。
 */
function quoteStringLiteral(value: string): string {
  return `'${value
    .replace(/\\/g, '\\\\')
    .replace(/'/g, "\\'")
    .replace(/\r/g, '\\r')
    .replace(/\n/g, '\\n')
    .replace(/\u2028/g, '\\u2028')
    .replace(/\u2029/g, '\\u2029')}'`
}
