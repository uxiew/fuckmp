/**
 * provide/inject 依赖注入插件
 * 将 Vue 的依赖注入系统转换为小程序的实现
 */

import { BaseTransformPlugin } from '../base/transform-plugin'
import type { TransformResult } from '../base/transform-plugin'
import type { ASTNode } from '../../types/ast'
import type { TransformContext } from '../../types/compiler'
import {
  createDependencyInjectionRuntimeConfig,
  extractProvideInjectKey,
  extractProvideInjectRequired,
  extractProvideInjectValue,
  generateInjectRuntimeCode,
  generateInjectVariableName,
  generateProvideRuntimeCode,
  isProvideInjectCall,
  isProvideInjectReactiveValue
} from './provide-inject-plugin-utils'

export class ProvideInjectPlugin extends BaseTransformPlugin {
  readonly name = 'provide-inject-plugin'
  readonly version = '1.0.0'
  readonly priority = 70

  supports(node: ASTNode, context: TransformContext): boolean {
    // 检查是否为 provide 或 inject 调用
    return this.isVueMacro(node, 'provide') ||
      this.isVueMacro(node, 'inject') ||
      isProvideInjectCall(node)
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
      const message = error instanceof Error ? error.message : String(error)
      return this.createErrorResult(`provide/inject 转换失败: ${message}`)
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

    const key = extractProvideInjectKey(args[0])
    const value = extractProvideInjectValue(args[1])

    if (!key) {
      return this.createErrorResult('provide() 的第一个参数必须是字符串或Symbol')
    }

    // 生成提供者配置
    const providerConfig = {
      key,
      value,
      reactive: isProvideInjectReactiveValue(value)
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
    const runtimeCode = generateProvideRuntimeCode(key, value)

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

    const key = extractProvideInjectKey(args[0])
    const defaultValue = args.length > 1 ? extractProvideInjectValue(args[1]) : undefined
    const required = args.length > 2 ? extractProvideInjectRequired(args[2]) : false

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
    const variableName = generateInjectVariableName(key)

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
    const runtimeCode = generateInjectRuntimeCode(key, variableName, defaultValue)

    this.debug('转换 inject', {
      key,
      variableName,
      defaultValue,
      required
    })

    return this.createSuccessResult(runtimeCode, contextUpdates)
  }

  /**
   * 生成依赖注入的运行时配置
   */
  generateRuntimeConfig(di: any): any {
    return createDependencyInjectionRuntimeConfig(di)
  }
}
