/**
 * provide/inject 插件纯函数工具。
 */

import type { ASTNode } from '../../types/ast'

/**
 * 判断节点是否为 provide/inject 调用。
 */
export function isProvideInjectCall(node: ASTNode): boolean {
  return node.type === 'CallExpression' &&
    node.callee?.type === 'Identifier' &&
    ['provide', 'inject'].includes(node.callee.name)
}

/**
 * 提取 provide/inject 的 key。
 */
export function extractProvideInjectKey(keyNode: ASTNode): string | null {
  if (keyNode.type === 'StringLiteral') {
    return keyNode.value
  }

  if (keyNode.type === 'Identifier') {
    return keyNode.name
  }

  if (keyNode.type === 'CallExpression' &&
    keyNode.callee?.type === 'Identifier' &&
    keyNode.callee.name === 'Symbol') {
    const args = keyNode.arguments || []
    if (args.length > 0 && args[0].type === 'StringLiteral') {
      return `Symbol(${args[0].value})`
    }
    return 'Symbol()'
  }

  return null
}

/**
 * 提取 provide/inject 的值。
 */
export function extractProvideInjectValue(valueNode: ASTNode): any {
  switch (valueNode.type) {
    case 'StringLiteral':
    case 'NumericLiteral':
    case 'BooleanLiteral':
      return valueNode.value
    case 'NullLiteral':
      return null
    case 'ObjectExpression':
      return extractObjectValue(valueNode)
    case 'ArrayExpression':
      return extractArrayValue(valueNode)
    case 'Identifier':
      return `{{${valueNode.name}}}`
    case 'CallExpression':
      if (isReactiveApiCall(valueNode, 'any')) {
        return extractReactiveValue(valueNode)
      }
      return generateCallExpression(valueNode)
    default:
      return null
  }
}

/**
 * 提取 inject 的 required 标志。
 */
export function extractProvideInjectRequired(requiredNode: ASTNode): boolean {
  if (requiredNode.type === 'BooleanLiteral') {
    return requiredNode.value
  }
  return false
}

/**
 * 判断提取后的 provide 值是否为响应式表达式字符串。
 */
export function isProvideInjectReactiveValue(value: any): boolean {
  return typeof value === 'string' &&
    (value.includes('reactive(') ||
      value.includes('ref(') ||
      value.includes('computed('))
}

/**
 * 生成 provide 运行时代码。
 */
export function generateProvideRuntimeCode(key: string, value: any): string {
  return `this._provide('${key}', ${JSON.stringify(value)})`
}

/**
 * 生成 inject 运行时代码。
 */
export function generateInjectRuntimeCode(key: string, variableName: string, defaultValue?: any): string {
  const defaultValueStr = defaultValue !== undefined ? JSON.stringify(defaultValue) : 'undefined'
  return `this.data.${variableName} = this._inject('${key}', ${defaultValueStr})`
}

/**
 * 根据 inject key 生成小程序 data 变量名。
 */
export function generateInjectVariableName(key: string): string {
  let varName = key.replace(/[^a-zA-Z0-9_$]/g, '_')

  if (!/^[a-zA-Z_$]/.test(varName)) {
    varName = '_' + varName
  }

  return varName
}

/**
 * 生成依赖注入 runtime 配置。
 */
export function createDependencyInjectionRuntimeConfig(di: any): any {
  return {
    type: 'dependency-injection',
    providers: Object.entries(di.providers || {}).map(([key, config]) => {
      const provider = config as { value: any; reactive: boolean }
      return {
        key,
        value: provider.value,
        reactive: provider.reactive
      }
    }),
    injectors: Object.entries(di.injectors || {}).map(([varName, config]) => {
      const injector = config as { key: string; defaultValue: any; required: boolean }
      return {
        variableName: varName,
        key: injector.key,
        defaultValue: injector.defaultValue,
        required: injector.required
      }
    })
  }
}

/**
 * 判断节点是否为响应式 API 调用。
 */
function isReactiveApiCall(node: ASTNode, apiName: string): boolean {
  return node.type === 'CallExpression' &&
    node.callee?.type === 'Identifier' &&
    ['ref', 'reactive', 'computed', 'watch', 'watchEffect'].includes(node.callee?.name) &&
    (apiName === 'any' || node.callee?.name === apiName)
}

/**
 * 提取响应式 API 的静态值。
 */
function extractReactiveValue(node: ASTNode): any {
  const calleeName = node.callee?.name
  const args = node.arguments || []

  switch (calleeName) {
    case 'ref':
      return args.length > 0 ? extractProvideInjectValue(args[0]) : null
    case 'reactive':
      return args.length > 0 ? extractProvideInjectValue(args[0]) : {}
    case 'computed':
      return args.length > 0 ? generateCallExpression(args[0]) : null
    default:
      return null
  }
}

/**
 * 提取对象表达式的静态值。
 */
function extractObjectValue(node: ASTNode): Record<string, any> {
  const result: Record<string, any> = {}

  if (node.properties) {
    for (const prop of node.properties) {
      if (prop.type === 'ObjectProperty' || prop.type === 'Property') {
        const key = extractPropertyKey(prop.key)
        const value = extractProvideInjectValue(prop.value)
        if (key !== null) {
          result[key] = value
        }
      }
    }
  }

  return result
}

/**
 * 提取数组表达式的静态值。
 */
function extractArrayValue(node: ASTNode): any[] {
  const result: any[] = []

  if (node.elements) {
    for (const element of node.elements) {
      if (element) {
        result.push(extractProvideInjectValue(element))
      } else {
        result.push(null)
      }
    }
  }

  return result
}

/**
 * 提取对象属性 key。
 */
function extractPropertyKey(keyNode: ASTNode): string | null {
  if (keyNode.type === 'Identifier') {
    return keyNode.name
  }
  if (keyNode.type === 'StringLiteral') {
    return keyNode.value
  }
  return null
}

/**
 * 生成函数调用表达式字符串。
 */
function generateCallExpression(node: ASTNode): string {
  const callee = node.callee?.name || 'unknown'
  const args = node.arguments?.map((arg: ASTNode) => extractProvideInjectValue(arg)).join(', ') || ''
  return `${callee}(${args})`
}
