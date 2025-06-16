/**
 * 生命周期宏处理器
 */

import type { CallExpression } from '@babel/types'
import type { TransformContext, MacroHandler } from '@/types/index.js'
import { LIFECYCLE_MAP } from '@/types/index.js'
import { logger } from '@/utils/index.js'

/**
 * 生命周期钩子信息
 */
export interface LifecycleHook {
  name: string
  callback: string
  miniprogramHook: string
  isPageHook: boolean
}

/**
 * 生命周期宏处理器工厂
 */
export function createLifecycleHandler(hookName: string): MacroHandler {
  return (node: any, context: TransformContext) => {
    try {
      logger.debug(`处理 ${hookName} 生命周期钩子: ${context.filename}`)

      const arg = node.arguments[0]
      if (!arg) {
        throw new Error(`${hookName} 需要一个回调函数参数`)
      }

      // 提取回调函数
      const callback = extractCallbackFunction(arg)

      // 获取对应的小程序生命周期钩子
      const miniprogramHook = getMiniprogramHook(hookName, context.isPage)

      const lifecycleHook: LifecycleHook = {
        name: hookName,
        callback,
        miniprogramHook,
        isPageHook: context.isPage
      }

      // 更新上下文
      if (!context.lifecycle[miniprogramHook]) {
        context.lifecycle[miniprogramHook] = ''
      }
      context.lifecycle[miniprogramHook] += callback + '\n'

      logger.debug(`${hookName} 处理完成: 映射到 ${miniprogramHook}`)
      return lifecycleHook

    } catch (error) {
      logger.error(`${hookName} 处理失败: ${context.filename}`, error as Error)
      throw error
    }
  }
}

/**
 * 提取回调函数
 */
function extractCallbackFunction(node: any): string {
  if (node.type === 'ArrowFunctionExpression' || node.type === 'FunctionExpression') {
    return extractFunctionBody(node)
  } else if (node.type === 'Identifier') {
    return `this.${node.name}()`
  }

  return '// 无效的回调函数'
}

/**
 * 提取函数体
 */
function extractFunctionBody(funcNode: any): string {
  if (funcNode.body.type === 'BlockStatement') {
    // 函数体是代码块
    return funcNode.body.body
      .map((stmt: any) => generateStatementCode(stmt))
      .join('\n      ')
  } else {
    // 箭头函数的表达式体
    return generateExpressionCode(funcNode.body)
  }
}

/**
 * 获取对应的小程序生命周期钩子
 */
function getMiniprogramHook(vueHook: string, isPage: boolean): string {
  const mapping = LIFECYCLE_MAP[vueHook as keyof typeof LIFECYCLE_MAP]

  if (!mapping) {
    logger.warn(`未知的 Vue 生命周期钩子: ${vueHook}`)
    return 'unknown'
  }

  // 处理页面生命周期
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

  // 处理组件生命周期
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
 * 生成语句代码
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
 * 生成表达式代码
 */
function generateExpressionCode(expr: any): string {
  if (!expr) return ''

  switch (expr.type) {
    case 'Identifier':
      return expr.name
    case 'MemberExpression':
      const object = generateExpressionCode(expr.object)
      const property = expr.computed
        ? `[${generateExpressionCode(expr.property)}]`
        : `.${expr.property.name}`
      return `${object}${property}`
    case 'CallExpression':
      const callee = generateExpressionCode(expr.callee)
      const args = expr.arguments.map((arg: any) => generateExpressionCode(arg)).join(', ')
      return `${callee}(${args})`
    case 'AssignmentExpression':
      const left = generateExpressionCode(expr.left)
      const right = generateExpressionCode(expr.right)
      return `${left} ${expr.operator} ${right}`
    case 'BinaryExpression':
      const leftBin = generateExpressionCode(expr.left)
      const rightBin = generateExpressionCode(expr.right)
      return `${leftBin} ${expr.operator} ${rightBin}`
    case 'StringLiteral':
      return `'${expr.value}'`
    case 'NumericLiteral':
      return expr.value.toString()
    case 'BooleanLiteral':
      return expr.value.toString()
    case 'ThisExpression':
      return 'this'
    default:
      return `/* 未支持的表达式: ${expr.type} */`
  }
}

/**
 * 生成变量声明
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
 * 生成 if 语句
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
 * 生成循环语句
 */
function generateLoopStatement(stmt: any): string {
  return `// 循环语句暂不支持转换: ${stmt.type}`
}

/**
 * 生成生命周期代码
 */
export function generateLifecycleCode(
  lifecycleHooks: Record<string, string>,
  isPage: boolean
): string {
  if (isPage) {
    return generatePageLifecycleCode(lifecycleHooks)
  } else {
    return generateComponentLifecycleCode(lifecycleHooks)
  }
}

/**
 * 生成页面生命周期代码
 */
function generatePageLifecycleCode(lifecycleHooks: Record<string, string>): string {
  const hooks: string[] = []

  Object.entries(lifecycleHooks).forEach(([hookName, code]) => {
    if (code.trim()) {
      hooks.push(`  ${hookName}(options) {
    ${code.trim()}
  }`)
    }
  })

  return hooks.join(',\n\n')
}

/**
 * 生成组件生命周期代码
 */
function generateComponentLifecycleCode(lifecycleHooks: Record<string, string>): string {
  const lifetimes: string[] = []
  const pageLifetimes: string[] = []

  Object.entries(lifecycleHooks).forEach(([hookName, code]) => {
    if (!code.trim()) return

    if (hookName.startsWith('pageLifetimes.')) {
      const pageLiftimeName = hookName.replace('pageLifetimes.', '')
      pageLifetimes.push(`    ${pageLiftimeName}() {
      ${code.trim()}
    }`)
    } else {
      lifetimes.push(`    ${hookName}() {
      ${code.trim()}
    }`)
    }
  })

  const result: string[] = []

  if (lifetimes.length > 0) {
    result.push(`  lifetimes: {
${lifetimes.join(',\n\n')}
  }`)
  }

  if (pageLifetimes.length > 0) {
    result.push(`  pageLifetimes: {
${pageLifetimes.join(',\n\n')}
  }`)
  }

  return result.join(',\n\n')
}

/**
 * 验证生命周期钩子
 */
export function validateLifecycleHook(hookName: string, isPage: boolean): {
  valid: boolean
  message?: string
} {
  const validVueHooks = Object.keys(LIFECYCLE_MAP)

  if (!validVueHooks.includes(hookName)) {
    return {
      valid: false,
      message: `未知的 Vue 生命周期钩子: ${hookName}`
    }
  }

  // 检查页面特定的钩子
  const pageOnlyHooks = ['onLoad', 'onShow', 'onReady', 'onHide', 'onUnload']
  if (!isPage && pageOnlyHooks.includes(hookName)) {
    return {
      valid: false,
      message: `生命周期钩子 ${hookName} 只能在页面组件中使用`
    }
  }

  return { valid: true }
}

/**
 * 获取支持的生命周期钩子列表
 */
export function getSupportedHooks(isPage: boolean): string[] {
  const allHooks = Object.keys(LIFECYCLE_MAP)

  if (isPage) {
    return allHooks
  } else {
    // 组件不支持页面特定的钩子
    const pageOnlyHooks = ['onLoad', 'onShow', 'onReady', 'onHide', 'onUnload']
    return allHooks.filter(hook => !pageOnlyHooks.includes(hook))
  }
}
