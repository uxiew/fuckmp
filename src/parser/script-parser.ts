/**
 * Script 解析器
 */

import { parseScript, traverseAST } from '@/utils/index.js'
import { VUE3_MACROS } from '@/types/index.js'
import type { File, FunctionDeclaration, ImportDeclaration, CallExpression, VariableDeclaration } from '@babel/types'
import { logger } from '@/utils/index.js'
import type { NodePath } from '@babel/traverse'
import { isCallExpression } from '@babel/types'
import { getVueCallName, isSetupCall, isSetupDeclaration } from './script-binding-utils.js'
import { lowerLocalComposables } from './script-composable-utils.js'
import { lowerMacroReferences } from './script-native-macro-utils.js'
import {
  createExportInfo,
  createFunctionInfo,
  createImportInfo,
  createVariableInfoFromDeclarator,
  createVueMacroCall
} from './script-parser-utils.js'

/**
 * Script 解析结果
 */
export interface ScriptParseResult {
  /** AST */
  ast: File
  /** 导入的模块 */
  imports: Map<string, ImportInfo>
  /** Vue3 宏调用 */
  macros: Map<string, MacroCall[]>
  /** 变量声明 */
  variables: Map<string, VariableInfo>
  /** 函数声明 */
  functions: Map<string, FunctionInfo>
  /** 导出信息 */
  exports: ExportInfo[]
  nativeMacroReferencesLowered?: true
}

/**
 * 导入信息
 */
export interface ImportInfo {
  source: string
  specifiers: Array<{
    type: 'default' | 'named' | 'namespace'
    imported?: string
    local: string
  }>
  isVue: boolean
  isComponent: boolean
  isStyle: boolean
}

/**
 * 宏调用信息
 */
export interface MacroCall {
  name: string
  arguments: any[]
  location: string
  typeParameters?: any
  runtimeArgument?: CallExpression['arguments'][number]
}

/**
 * 变量信息
 */
export interface VariableInfo {
  name: string
  type: 'const' | 'let' | 'var'
  init?: any
  isReactive: boolean
  macroType?: string
}

/**
 * 函数信息
 */
export interface FunctionInfo {
  name: string
  params: string[]
  isAsync: boolean
  isArrow: boolean
  body?: string
}

/**
 * 导出信息
 */
export interface ExportInfo {
  type: 'default' | 'named'
  name?: string
  value?: any
}

/**
 * Script 解析器类
 */
export class ScriptParser {
  /**
   * 解析脚本内容
   */
  async parseScript(content: string, filename: string): Promise<ScriptParseResult> {
    try {
      logger.debug(`解析脚本: ${filename}`)

      // 解析为 AST
      const ast = parseScript(content)
      lowerLocalComposables(ast, filename)
      lowerMacroReferences(ast, filename)

      // 初始化结果
      const result: ScriptParseResult = {
        ast,
        imports: new Map(),
        macros: new Map(),
        variables: new Map(),
        functions: new Map(),
        exports: [],
        nativeMacroReferencesLowered: true
      }

      // 遍历 AST 收集信息
      traverseAST(ast, {
        ImportDeclaration: (path) => {
          this.handleImportDeclaration(path.node, result)
        },
        CallExpression: (path) => {
          if (isSetupCall(path)) this.handleCallExpression(path, result)
        },
        VariableDeclaration: (path) => {
          if (isSetupDeclaration(path)) this.handleVariableDeclaration(path, result)
        },
        FunctionDeclaration: (path) => {
          if (isSetupDeclaration(path)) this.handleFunctionDeclaration(path.node, result)
        },
        ExportDefaultDeclaration: (path) => {
          this.handleExportDeclaration(path.node, result, 'default')
        },
        ExportNamedDeclaration: (path) => {
          this.handleExportDeclaration(path.node, result, 'named')
        }
      })

      logger.debug(`脚本解析完成: ${filename}`)

      return result

    } catch (error) {
      logger.error(`脚本解析失败: ${filename}`, error as Error)
      throw error
    }
  }

  /**
   * 处理导入声明
   */
  private handleImportDeclaration(node: ImportDeclaration, result: ScriptParseResult): void {
    const importInfo = createImportInfo(node)
    result.imports.set(importInfo.source, importInfo)
  }

  /**
   * 处理调用表达式
   */
  private handleCallExpression(path: NodePath<CallExpression>, result: ScriptParseResult): void {
    const name = getVueCallName(path.node, path.scope)
    const macroCall = createVueMacroCall(path.node, result.variables, name)
    if (!macroCall) return

    if (!result.macros.has(macroCall.name)) {
      result.macros.set(macroCall.name, [])
    }
    result.macros.get(macroCall.name)!.push(macroCall)
  }

  /**
   * 处理变量声明
   */
  private handleVariableDeclaration(path: NodePath<VariableDeclaration>, result: ScriptParseResult): void {
    const { node, scope } = path
    node.declarations.forEach(declarator => {
      const name = isCallExpression(declarator.init) ? getVueCallName(declarator.init, scope) : null
      const variableInfo = createVariableInfoFromDeclarator(declarator, node.kind as 'const' | 'let' | 'var', result, name)
      if (variableInfo) {
        result.variables.set(variableInfo.name, variableInfo)
      }
    })
  }

  /**
   * 处理函数声明
   */
  private handleFunctionDeclaration(node: FunctionDeclaration, result: ScriptParseResult): void {
    const functionInfo = createFunctionInfo(node, result.variables)
    if (functionInfo) {
      result.functions.set(functionInfo.name, functionInfo)
    }
  }

  /**
   * 处理导出声明
   */
  private handleExportDeclaration(node: any, result: ScriptParseResult, type: 'default' | 'named'): void {
    result.exports.push(createExportInfo(node, result, type))
  }

  /**
   * 检查是否使用了特定的 Vue3 特性
   */
  isUsingFeature(result: ScriptParseResult, feature: keyof typeof VUE3_MACROS): boolean {
    const macroName = VUE3_MACROS[feature]
    return result.macros.has(macroName) ||
      Array.from(result.imports.values()).some(imp =>
        imp.isVue && imp.specifiers.some(spec => spec.imported === macroName)
      )
  }

  /**
   * 获取组件的 props 定义
   */
  getPropsDefinition(result: ScriptParseResult): any {
    const definePropsCall = result.macros.get('defineProps')?.[0]
    return definePropsCall?.arguments[0] || {}
  }

  /**
   * 获取组件的 emits 定义
   */
  getEmitsDefinition(result: ScriptParseResult): string[] {
    const defineEmitsCall = result.macros.get('defineEmits')?.[0]
    const emitsArg = defineEmitsCall?.arguments[0]

    if (Array.isArray(emitsArg)) {
      return emitsArg
    } else if (typeof emitsArg === 'object' && emitsArg !== null) {
      return Object.keys(emitsArg)
    }

    return []
  }

  /**
   * 获取响应式变量
   */
  getReactiveVariables(result: ScriptParseResult): Map<string, VariableInfo> {
    const reactiveVars = new Map<string, VariableInfo>()

    result.variables.forEach((variable, name) => {
      if (variable.isReactive) {
        reactiveVars.set(name, variable)
      }
    })

    return reactiveVars
  }
}
