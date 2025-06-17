/**
 * 转换插件基类
 * 为Vue特性转换提供统一的插件接口
 */

import type { ASTNode } from '../../types/ast'
import type { TransformContext } from '../../types/compiler'

/**
 * 转换结果
 */
export interface TransformResult {
  /** 是否处理了该节点 */
  handled: boolean
  /** 转换后的代码 */
  code?: string
  /** 上下文更新 */
  contextUpdates?: Partial<TransformContext>
  /** 依赖的其他插件 */
  dependencies?: string[]
  /** 错误信息 */
  errors?: string[]
  /** 警告信息 */
  warnings?: string[]
}

/**
 * 转换插件接口
 */
export interface TransformPlugin {
  /** 插件名称 */
  readonly name: string
  /** 插件版本 */
  readonly version: string
  /** 优先级（数字越大优先级越高） */
  readonly priority: number
  /** 支持的Vue版本 */
  readonly supportedVueVersions: string[]
  /** 依赖的其他插件 */
  readonly dependencies: string[]

  /**
   * 检查是否支持该节点
   */
  supports(node: ASTNode, context: TransformContext): boolean

  /**
   * 转换节点
   */
  transform(node: ASTNode, context: TransformContext): Promise<TransformResult>

  /**
   * 插件初始化
   */
  initialize?(context: TransformContext): Promise<void>

  /**
   * 插件清理
   */
  cleanup?(): Promise<void>
}

/**
 * 转换插件基类
 */
export abstract class BaseTransformPlugin implements TransformPlugin {
  abstract readonly name: string
  abstract readonly version: string
  abstract readonly priority: number

  readonly supportedVueVersions: string[] = ['3.x']
  readonly dependencies: string[] = []

  abstract supports(node: ASTNode, context: TransformContext): boolean
  abstract transform(node: ASTNode, context: TransformContext): Promise<TransformResult>

  /**
   * 创建成功的转换结果
   */
  protected createSuccessResult(code: string, contextUpdates?: Partial<TransformContext>): TransformResult {
    return {
      handled: true,
      code,
      contextUpdates: contextUpdates || {},
      errors: [],
      warnings: []
    }
  }

  /**
   * 创建失败的转换结果
   */
  protected createErrorResult(error: string): TransformResult {
    return {
      handled: false,
      errors: [error],
      warnings: []
    }
  }

  /**
   * 创建警告的转换结果
   */
  protected createWarningResult(warning: string, code?: string): TransformResult {
    return {
      handled: !!code,
      code: code || '',
      warnings: [warning],
      errors: []
    }
  }

  /**
   * 创建未处理的结果
   */
  protected createUnhandledResult(): TransformResult {
    return {
      handled: false,
      errors: [],
      warnings: []
    }
  }

  /**
   * 检查节点类型
   */
  protected isNodeType(node: ASTNode, type: string): boolean {
    return node.type === type
  }

  /**
   * 检查是否为Vue宏调用
   */
  protected isVueMacro(node: ASTNode, macroName: string): boolean {
    return node.type === 'CallExpression' &&
      node.callee?.type === 'Identifier' &&
      node.callee?.name === macroName
  }

  /**
   * 检查是否为响应式API调用
   */
  protected isReactiveAPI(node: ASTNode, apiName: string): boolean {
    return node.type === 'CallExpression' &&
      node.callee?.type === 'Identifier' &&
      ['ref', 'reactive', 'computed', 'watch', 'watchEffect'].includes(node.callee?.name) &&
      (apiName === 'any' || node.callee?.name === apiName)
  }

  /**
   * 提取字符串字面量值
   */
  protected extractStringLiteral(node: ASTNode): string | null {
    if (node.type === 'Literal' && typeof node.value === 'string') {
      return node.value
    }
    if (node.type === 'StringLiteral') {
      return node.value
    }
    return null
  }

  /**
   * 提取标识符名称
   */
  protected extractIdentifierName(node: ASTNode): string | null {
    if (node.type === 'Identifier') {
      return node.name
    }
    return null
  }

  /**
   * 生成小程序兼容的变量名
   */
  protected generateMiniProgramVarName(name: string): string {
    // 确保变量名符合小程序规范
    return name.replace(/[^a-zA-Z0-9_$]/g, '_')
  }

  /**
   * 生成小程序兼容的方法名
   */
  protected generateMiniProgramMethodName(name: string): string {
    // 确保方法名符合小程序规范
    return name.replace(/[^a-zA-Z0-9_$]/g, '_')
  }

  /**
   * 记录调试信息
   */
  protected debug(message: string, data?: any): void {
    if (process.env.NODE_ENV === 'development') {
      console.log(`[${this.name}] ${message}`, data || '')
    }
  }

  /**
   * 记录警告信息
   */
  protected warn(message: string, data?: any): void {
    console.warn(`[${this.name}] ${message}`, data || '')
  }

  /**
   * 记录错误信息
   */
  protected error(message: string, data?: any): void {
    console.error(`[${this.name}] ${message}`, data || '')
  }
}
