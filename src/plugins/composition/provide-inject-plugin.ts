/**
 * provide/inject 依赖注入插件
 * 将 Vue 的依赖注入系统转换为小程序的实现
 */

import { BaseTransformPlugin } from '../base/transform-plugin'
import type { TransformResult } from '../base/transform-plugin'
import type { ASTNode } from '../../types/ast'
import type { TransformContext } from '../../types/compiler'

export class ProvideInjectPlugin extends BaseTransformPlugin {
  readonly name = 'provide-inject-plugin'
  readonly version = '1.0.0'
  readonly priority = 70

  supports(node: ASTNode, context: TransformContext): boolean {
    // 检查是否为 provide 或 inject 调用
    return this.isVueMacro(node, 'provide') ||
      this.isVueMacro(node, 'inject') ||
      (node.type === 'CallExpression' &&
        node.callee?.type === 'Identifier' &&
        ['provide', 'inject'].includes(node.callee.name))
  }

  async transform(node: ASTNode, context: TransformContext): Promise<TransformResult> {
    try {
      if (!this.supports(node, context)) {
        return this.createUnhandledResult()
      }

      const functionName = node.callee?.name

      switch (functionName) {
        case 'provide':
          return this.transformProvide(node, context)
        case 'inject':
          return this.transformInject(node, context)
        default:
          return this.createUnhandledResult()
      }
    } catch (error) {
      return this.createErrorResult(`provide/inject 转换失败: ${error.message}`)
    }
  }

  /**
   * 转换 provide 调用
   */
  private transformProvide(node: ASTNode, context: TransformContext): TransformResult {
    const args = node.arguments || []

    if (args.length < 2) {
      return this.createErrorResult('provide() 需要至少两个参数：key 和 value')
    }

    const key = this.extractProvideKey(args[0])
    const value = this.extractProvideValue(args[1])

    if (!key) {
      return this.createErrorResult('provide() 的第一个参数必须是字符串或Symbol')
    }

    // 生成提供者配置
    const providerConfig = {
      key,
      value,
      reactive: this.isReactiveValue(value)
    }

    // 更新上下文
    const contextUpdates = {
      di: {
        ...context.di,
        providers: {
          ...context.di?.providers,
          [key]: providerConfig
        }
      }
    }

    // 生成运行时代码
    const runtimeCode = this.generateProvideCode(key, value)

    this.debug('转换 provide', {
      key,
      value,
      reactive: providerConfig.reactive
    })

    return this.createSuccessResult(runtimeCode, contextUpdates)
  }

  /**
   * 转换 inject 调用
   */
  private transformInject(node: ASTNode, context: TransformContext): TransformResult {
    const args = node.arguments || []

    if (args.length === 0) {
      return this.createErrorResult('inject() 需要至少一个参数：key')
    }

    const key = this.extractInjectKey(args[0])
    const defaultValue = args.length > 1 ? this.extractInjectDefault(args[1]) : undefined
    const required = args.length > 2 ? this.extractInjectRequired(args[2]) : false

    if (!key) {
      return this.createErrorResult('inject() 的第一个参数必须是字符串或Symbol')
    }

    // 生成注入者配置
    const injectorConfig = {
      key,
      defaultValue,
      required
    }

    // 生成变量名
    const variableName = this.generateInjectVariableName(key)

    // 更新上下文
    const contextUpdates = {
      di: {
        ...context.di,
        injectors: {
          ...context.di?.injectors,
          [variableName]: injectorConfig
        }
      },
      data: {
        ...context.data,
        [variableName]: defaultValue
      }
    }

    // 生成运行时代码
    const runtimeCode = this.generateInjectCode(key, variableName, defaultValue)

    this.debug('转换 inject', {
      key,
      variableName,
      defaultValue,
      required
    })

    return this.createSuccessResult(runtimeCode, contextUpdates)
  }

  /**
   * 提取 provide 的 key
   */
  private extractProvideKey(keyNode: ASTNode): string | null {
    if (keyNode.type === 'StringLiteral') {
      return keyNode.value
    }

    if (keyNode.type === 'Identifier') {
      return keyNode.name
    }

    // 处理 Symbol
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
   * 提取 provide 的 value
   */
  private extractProvideValue(valueNode: ASTNode): any {
    switch (valueNode.type) {
      case 'StringLiteral':
      case 'NumericLiteral':
      case 'BooleanLiteral':
        return valueNode.value
      case 'NullLiteral':
        return null
      case 'ObjectExpression':
        return this.extractObjectValue(valueNode)
      case 'ArrayExpression':
        return this.extractArrayValue(valueNode)
      case 'Identifier':
        return `{{${valueNode.name}}}`
      case 'CallExpression':
        // 处理响应式值
        if (this.isReactiveAPI(valueNode, 'any')) {
          return this.extractReactiveValue(valueNode)
        }
        return this.generateCallExpression(valueNode)
      default:
        return null
    }
  }

  /**
   * 提取 inject 的 key
   */
  private extractInjectKey(keyNode: ASTNode): string | null {
    return this.extractProvideKey(keyNode)
  }

  /**
   * 提取 inject 的默认值
   */
  private extractInjectDefault(defaultNode: ASTNode): any {
    return this.extractProvideValue(defaultNode)
  }

  /**
   * 提取 inject 的 required 标志
   */
  private extractInjectRequired(requiredNode: ASTNode): boolean {
    if (requiredNode.type === 'BooleanLiteral') {
      return requiredNode.value
    }
    return false
  }

  /**
   * 检查是否为响应式值
   */
  private isReactiveValue(value: any): boolean {
    return typeof value === 'string' &&
      (value.includes('reactive(') ||
        value.includes('ref(') ||
        value.includes('computed('))
  }

  /**
   * 提取响应式值
   */
  private extractReactiveValue(node: ASTNode): any {
    const calleeName = node.callee?.name
    const args = node.arguments || []

    switch (calleeName) {
      case 'ref':
        return args.length > 0 ? this.extractProvideValue(args[0]) : null
      case 'reactive':
        return args.length > 0 ? this.extractProvideValue(args[0]) : {}
      case 'computed':
        return args.length > 0 ? this.generateCallExpression(args[0]) : null
      default:
        return null
    }
  }

  /**
   * 提取对象值
   */
  private extractObjectValue(node: ASTNode): Record<string, any> {
    const result: Record<string, any> = {}

    if (node.properties) {
      for (const prop of node.properties) {
        if (prop.type === 'ObjectProperty' || prop.type === 'Property') {
          const key = this.extractPropertyKey(prop.key)
          const value = this.extractProvideValue(prop.value)
          if (key !== null) {
            result[key] = value
          }
        }
      }
    }

    return result
  }

  /**
   * 提取数组值
   */
  private extractArrayValue(node: ASTNode): any[] {
    const result: any[] = []

    if (node.elements) {
      for (const element of node.elements) {
        if (element) {
          result.push(this.extractProvideValue(element))
        } else {
          result.push(null)
        }
      }
    }

    return result
  }

  /**
   * 提取属性键
   */
  private extractPropertyKey(keyNode: ASTNode): string | null {
    if (keyNode.type === 'Identifier') {
      return keyNode.name
    }
    if (keyNode.type === 'StringLiteral') {
      return keyNode.value
    }
    return null
  }

  /**
   * 生成函数调用表达式
   */
  private generateCallExpression(node: ASTNode): string {
    const callee = node.callee?.name || 'unknown'
    const args = node.arguments?.map(arg => this.extractProvideValue(arg)).join(', ') || ''
    return `${callee}(${args})`
  }

  /**
   * 生成 provide 运行时代码
   */
  private generateProvideCode(key: string, value: any): string {
    return `this._provide('${key}', ${JSON.stringify(value)})`
  }

  /**
   * 生成 inject 运行时代码
   */
  private generateInjectCode(key: string, variableName: string, defaultValue?: any): string {
    const defaultValueStr = defaultValue !== undefined ? JSON.stringify(defaultValue) : 'undefined'
    return `this.data.${variableName} = this._inject('${key}', ${defaultValueStr})`
  }

  /**
   * 生成注入变量名
   */
  private generateInjectVariableName(key: string): string {
    // 将key转换为有效的变量名
    let varName = key.replace(/[^a-zA-Z0-9_$]/g, '_')

    // 确保以字母或下划线开头
    if (!/^[a-zA-Z_$]/.test(varName)) {
      varName = '_' + varName
    }

    return varName
  }

  /**
   * 生成依赖注入的运行时配置
   */
  generateRuntimeConfig(di: any): any {
    return {
      type: 'dependency-injection',
      providers: Object.entries(di.providers || {}).map(([key, config]) => ({
        key,
        value: config.value,
        reactive: config.reactive
      })),
      injectors: Object.entries(di.injectors || {}).map(([varName, config]) => ({
        variableName: varName,
        key: config.key,
        defaultValue: config.defaultValue,
        required: config.required
      }))
    }
  }

  /**
   * 验证依赖注入配置
   */
  private validateDIConfig(config: any): boolean {
    // 验证提供者
    if (config.providers) {
      for (const [key, provider] of Object.entries(config.providers)) {
        if (!provider.key || provider.value === undefined) {
          return false
        }
      }
    }

    // 验证注入者
    if (config.injectors) {
      for (const [varName, injector] of Object.entries(config.injectors)) {
        if (!injector.key) {
          return false
        }
      }
    }

    return true
  }

  /**
   * 优化依赖注入
   */
  private optimizeDI(di: any): any {
    const optimized = { ...di }

    // 移除未使用的提供者
    if (optimized.providers && optimized.injectors) {
      const usedKeys = new Set(
        Object.values(optimized.injectors).map((injector: any) => injector.key)
      )

      optimized.providers = Object.fromEntries(
        Object.entries(optimized.providers).filter(([key, provider]) =>
          usedKeys.has((provider as any).key)
        )
      )
    }

    return optimized
  }
}
