/**
 * 响应式系统宏处理器
 */

import type { CallExpression } from '@babel/types'
import type { TransformContext, MacroHandler } from '@/types/index.js'
import { logger } from '@/utils/index.js'
import {
  extractReactivityDependencies,
  extractReactivityFunctionBody,
  extractReactivityLiteralValue,
  getReactivityPropertyKey
} from './reactivity-utils.js'

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
    const initialValue = arg ? extractReactivityLiteralValue(arg) : null

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
    const initialValue = arg ? extractReactivityLiteralValue(arg) : {}

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
      getter = extractReactivityFunctionBody(arg)
      dependencies = extractReactivityDependencies(arg)
    } else if (arg.type === 'ObjectExpression') {
      // 包含 getter 和 setter 的对象
      arg.properties.forEach((prop: any) => {
        if (prop.type === 'ObjectProperty') {
          const key = getReactivityPropertyKey(prop.key)
          if (key === 'get') {
            getter = extractReactivityFunctionBody(prop.value)
            dependencies = extractReactivityDependencies(prop.value)
          } else if (key === 'set') {
            setter = extractReactivityFunctionBody(prop.value)
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
