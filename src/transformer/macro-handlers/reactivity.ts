/**
 * 响应式系统宏处理器
 */

import type { CallExpression } from '@babel/types'
import type { TransformContext, MacroHandler } from '@/types/index.js'
import { logger } from '@/utils/index.js'

/**
 * 响应式变量信息
 */
export interface ReactiveVariable {
  name: string
  type: 'ref' | 'reactive' | 'computed'
  initialValue: any
  dependencies?: string[]
  getter?: string
  setter?: string
}

/**
 * ref 宏处理器
 */
export const refHandler: MacroHandler = (node: any, context: TransformContext) => {
  try {
    logger.debug(`处理 ref 宏: ${context.filename}`)

    const arg = node.arguments[0]
    const initialValue = arg ? extractLiteralValue(arg) : null

    const reactiveVar: ReactiveVariable = {
      name: '', // 将在变量声明处理时设置
      type: 'ref',
      initialValue
    }

    logger.debug(`ref 处理完成: 初始值 ${JSON.stringify(initialValue)}`)
    return reactiveVar

  } catch (error) {
    logger.error(`ref 处理失败: ${context.filename}`, error as Error)
    throw error
  }
}

/**
 * reactive 宏处理器
 */
export const reactiveHandler: MacroHandler = (node: any, context: TransformContext) => {
  try {
    logger.debug(`处理 reactive 宏: ${context.filename}`)

    const arg = node.arguments[0]
    const initialValue = arg ? extractLiteralValue(arg) : {}

    const reactiveVar: ReactiveVariable = {
      name: '', // 将在变量声明处理时设置
      type: 'reactive',
      initialValue
    }

    logger.debug(`reactive 处理完成: 初始值 ${JSON.stringify(initialValue)}`)
    return reactiveVar

  } catch (error) {
    logger.error(`reactive 处理失败: ${context.filename}`, error as Error)
    throw error
  }
}

/**
 * computed 宏处理器
 */
export const computedHandler: MacroHandler = (node: any, context: TransformContext) => {
  try {
    logger.debug(`处理 computed 宏: ${context.filename}`)

    const arg = node.arguments[0]
    if (!arg) {
      throw new Error('computed 需要一个参数')
    }

    let getter = ''
    let setter = ''
    let dependencies: string[] = []

    if (arg.type === 'ArrowFunctionExpression' || arg.type === 'FunctionExpression') {
      // 简单的 getter 函数
      getter = extractFunctionBody(arg)
      dependencies = extractDependencies(arg)
    } else if (arg.type === 'ObjectExpression') {
      // 包含 getter 和 setter 的对象
      arg.properties.forEach((prop: any) => {
        if (prop.type === 'ObjectProperty') {
          const key = getPropertyKey(prop.key)
          if (key === 'get') {
            getter = extractFunctionBody(prop.value)
            dependencies = extractDependencies(prop.value)
          } else if (key === 'set') {
            setter = extractFunctionBody(prop.value)
          }
        }
      })
    }

    const reactiveVar: ReactiveVariable = {
      name: '', // 将在变量声明处理时设置
      type: 'computed',
      initialValue: undefined,
      dependencies,
      getter,
      setter
    }

    logger.debug(`computed 处理完成: ${dependencies.length} 个依赖`)
    return reactiveVar

  } catch (error) {
    logger.error(`computed 处理失败: ${context.filename}`, error as Error)
    throw error
  }
}

/**
 * 提取字面量值
 */
function extractLiteralValue(node: any): any {
  switch (node.type) {
    case 'StringLiteral':
      return node.value
    case 'NumericLiteral':
      return node.value
    case 'BooleanLiteral':
      return node.value
    case 'NullLiteral':
      return null
    case 'ArrayExpression':
      return node.elements.map((el: any) => el ? extractLiteralValue(el) : null)
    case 'ObjectExpression':
      const obj: Record<string, any> = {}
      node.properties.forEach((prop: any) => {
        if (prop.type === 'ObjectProperty') {
          const key = getPropertyKey(prop.key)
          obj[key] = extractLiteralValue(prop.value)
        }
      })
      return obj
    case 'Identifier':
      return `{{${node.name}}}`
    default:
      return null
  }
}

/**
 * 获取属性键名
 */
function getPropertyKey(keyNode: any): string {
  if (keyNode.type === 'Identifier') {
    return keyNode.name
  } else if (keyNode.type === 'StringLiteral') {
    return keyNode.value
  }
  return 'unknown'
}

/**
 * 提取函数体
 */
function extractFunctionBody(funcNode: any): string {
  if (funcNode.body.type === 'BlockStatement') {
    // 函数体是代码块
    return funcNode.body.body
      .map((stmt: any) => generateStatementCode(stmt))
      .join('\n')
  } else {
    // 箭头函数的表达式体
    return `return ${generateExpressionCode(funcNode.body)}`
  }
}

/**
 * 提取依赖
 */
function extractDependencies(funcNode: any): string[] {
  const dependencies: Set<string> = new Set()

  // 简单的依赖提取，遍历函数体中的标识符
  traverseNode(funcNode.body, (node: any) => {
    if (node.type === 'Identifier' && node.name !== 'this') {
      dependencies.add(node.name)
    }
  })

  return Array.from(dependencies)
}

/**
 * 遍历节点
 */
function traverseNode(node: any, visitor: (node: any) => void): void {
  if (!node || typeof node !== 'object') return

  visitor(node)

  Object.values(node).forEach(value => {
    if (Array.isArray(value)) {
      value.forEach(item => traverseNode(item, visitor))
    } else if (value && typeof value === 'object') {
      traverseNode(value, visitor)
    }
  })
}

/**
 * 生成语句代码
 */
function generateStatementCode(stmt: any): string {
  switch (stmt.type) {
    case 'ReturnStatement':
      return `return ${generateExpressionCode(stmt.argument)}`
    case 'ExpressionStatement':
      return generateExpressionCode(stmt.expression)
    default:
      return '// 未支持的语句类型'
  }
}

/**
 * 生成表达式代码
 */
function generateExpressionCode(expr: any): string {
  if (!expr) return ''

  switch (expr.type) {
    case 'Identifier':
      return `this.data.${expr.name}`
    case 'MemberExpression':
      const object = generateExpressionCode(expr.object)
      const property = expr.computed
        ? `[${generateExpressionCode(expr.property)}]`
        : `.${expr.property.name}`
      return `${object}${property}`
    case 'BinaryExpression':
      const left = generateExpressionCode(expr.left)
      const right = generateExpressionCode(expr.right)
      return `${left} ${expr.operator} ${right}`
    case 'CallExpression':
      const callee = generateExpressionCode(expr.callee)
      const args = expr.arguments.map((arg: any) => generateExpressionCode(arg)).join(', ')
      return `${callee}(${args})`
    case 'StringLiteral':
      return `'${expr.value}'`
    case 'NumericLiteral':
      return expr.value.toString()
    case 'BooleanLiteral':
      return expr.value.toString()
    default:
      return '/* 未支持的表达式 */'
  }
}

/**
 * 生成响应式数据代码
 */
export function generateReactiveDataCode(variables: Map<string, ReactiveVariable>): string {
  const dataEntries: string[] = []

  variables.forEach((variable, name) => {
    if (variable.type === 'ref' || variable.type === 'reactive') {
      const value = JSON.stringify(variable.initialValue)
      dataEntries.push(`    ${name}: ${value}`)
    }
  })

  return `{
${dataEntries.join(',\n')}
  }`
}

/**
 * 生成计算属性代码
 */
export function generateComputedCode(variables: Map<string, ReactiveVariable>): string {
  const computedMethods: string[] = []

  variables.forEach((variable, name) => {
    if (variable.type === 'computed') {
      computedMethods.push(`    _computed_${name}() {
      ${variable.getter}
    }`)
    }
  })

  return computedMethods.join(',\n\n')
}

/**
 * 生成响应式设置代码
 */
export function generateReactivitySetupCode(variables: Map<string, ReactiveVariable>): string {
  const setupCode: string[] = []

  variables.forEach((variable, name) => {
    if (variable.type === 'computed') {
      setupCode.push(`      // 设置计算属性: ${name}
      Object.defineProperty(this.data, '${name}', {
        get: () => this._computed_${name}(),
        enumerable: true,
        configurable: true
      })`)
    }
  })

  return setupCode.join('\n')
}

/**
 * 生成数据更新代码
 */
export function generateDataUpdateCode(variables: Map<string, ReactiveVariable>): string {
  const updateMethods: string[] = []

  variables.forEach((variable, name) => {
    if (variable.type === 'ref') {
      updateMethods.push(`    _update_${name}(value) {
      this.setData({
        ${name}: value
      })
      this._updateComputed()
    }`)
    } else if (variable.type === 'reactive') {
      updateMethods.push(`    _update_${name}(key, value) {
      this.setData({
        [\`${name}.\${key}\`]: value
      })
      this._updateComputed()
    }`)
    }
  })

  return updateMethods.join(',\n\n')
}

/**
 * 生成计算属性更新代码
 */
export function generateComputedUpdateCode(variables: Map<string, ReactiveVariable>): string {
  const computedVars = Array.from(variables.entries())
    .filter(([, variable]) => variable.type === 'computed')
    .map(([name]) => name)

  if (computedVars.length === 0) {
    return '    _updateComputed() {\n      // 没有计算属性需要更新\n    }'
  }

  const updateEntries = computedVars.map(name => `      ${name}: this._computed_${name}()`)

  return `    _updateComputed() {
      this.setData({
${updateEntries.join(',\n')}
      })
    }`
}
