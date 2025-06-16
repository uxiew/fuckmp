/**
 * Script 解析器
 */

import { parseScript, traverseAST, isImportDeclaration, isCallExpression, isIdentifier } from '@/utils/index.js'
import { VUE3_MACROS } from '@/types/index.js'
import type { File, ImportDeclaration, CallExpression, VariableDeclaration } from '@babel/types'
import type { ParseResult } from '@/types/index.js'
import { logger } from '@/utils/index.js'

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
}

/**
 * 宏调用信息
 */
export interface MacroCall {
  name: string
  arguments: any[]
  location: string
  typeParameters?: any
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

      // 初始化结果
      const result: ScriptParseResult = {
        ast,
        imports: new Map(),
        macros: new Map(),
        variables: new Map(),
        functions: new Map(),
        exports: []
      }

      // 遍历 AST 收集信息
      traverseAST(ast, {
        ImportDeclaration: (path) => {
          this.handleImportDeclaration(path.node, result)
        },
        CallExpression: (path) => {
          this.handleCallExpression(path.node, result)
        },
        VariableDeclaration: (path) => {
          this.handleVariableDeclaration(path.node, result)
        },
        FunctionDeclaration: (path) => {
          this.handleFunctionDeclaration(path.node, result)
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
    const source = node.source.value
    const isVue = source === 'vue'
    const isComponent = source.endsWith('.vue')

    const importInfo: ImportInfo = {
      source,
      specifiers: [],
      isVue,
      isComponent
    }

    // 处理导入说明符
    node.specifiers.forEach(spec => {
      if (spec.type === 'ImportDefaultSpecifier') {
        importInfo.specifiers.push({
          type: 'default',
          local: spec.local.name
        })
      } else if (spec.type === 'ImportSpecifier') {
        importInfo.specifiers.push({
          type: 'named',
          imported: isIdentifier(spec.imported) ? spec.imported.name : spec.imported.value,
          local: spec.local.name
        })
      } else if (spec.type === 'ImportNamespaceSpecifier') {
        importInfo.specifiers.push({
          type: 'namespace',
          local: spec.local.name
        })
      }
    })

    result.imports.set(source, importInfo)
  }

  /**
   * 处理调用表达式
   */
  private handleCallExpression(node: CallExpression, result: ScriptParseResult): void {
    if (!isIdentifier(node.callee)) return

    const calleeName = node.callee.name

    // 检查是否为 Vue3 宏
    if (Object.values(VUE3_MACROS).includes(calleeName as any)) {
      const macroCall: MacroCall = {
        name: calleeName,
        arguments: node.arguments.map(arg => this.extractArgumentValue(arg)),
        location: node.loc ? `${node.loc.start.line}:${node.loc.start.column}` : 'unknown',
        // 添加 TypeScript 泛型参数支持
        typeParameters: (node as any).typeParameters
      }

      if (!result.macros.has(calleeName)) {
        result.macros.set(calleeName, [])
      }
      result.macros.get(calleeName)!.push(macroCall)
    }
  }

  /**
   * 处理变量声明
   */
  private handleVariableDeclaration(node: VariableDeclaration, result: ScriptParseResult): void {
    node.declarations.forEach(declarator => {
      if (declarator.id.type === 'Identifier') {
        const name = declarator.id.name
        let isReactive = false
        let macroType: string | undefined

        // 检查是否为响应式变量
        if (declarator.init && isCallExpression(declarator.init) && isIdentifier(declarator.init.callee)) {
          const calleeName = declarator.init.callee.name
          if (['ref', 'reactive', 'computed'].includes(calleeName)) {
            isReactive = true
            macroType = calleeName
          }
        }

        const variableInfo: VariableInfo = {
          name,
          type: node.kind as 'const' | 'let' | 'var',
          init: declarator.init ? this.extractArgumentValue(declarator.init) : undefined,
          isReactive,
          ...(macroType && { macroType })
        }

        result.variables.set(name, variableInfo)
      }
    })
  }

  /**
   * 处理函数声明
   */
  private handleFunctionDeclaration(node: any, result: ScriptParseResult): void {
    if (node.id && isIdentifier(node.id)) {
      const functionInfo: FunctionInfo = {
        name: node.id.name,
        params: node.params.map((param: any) =>
          isIdentifier(param) ? param.name : 'unknown'
        ),
        isAsync: node.async || false,
        isArrow: false
      }

      result.functions.set(functionInfo.name, functionInfo)
    }
  }

  /**
   * 处理导出声明
   */
  private handleExportDeclaration(node: any, result: ScriptParseResult, type: 'default' | 'named'): void {
    const exportInfo: ExportInfo = {
      type,
      name: type === 'named' && node.declaration?.id?.name ? node.declaration.id.name : undefined,
      value: node.declaration ? this.extractArgumentValue(node.declaration) : undefined
    }

    result.exports.push(exportInfo)
  }

  /**
   * 提取参数值
   */
  private extractArgumentValue(node: any): any {
    switch (node.type) {
      case 'StringLiteral':
        return node.value
      case 'NumericLiteral':
        return node.value
      case 'BooleanLiteral':
        return node.value
      case 'NullLiteral':
        return null
      case 'Identifier':
        return node.name
      case 'ArrayExpression':
        return node.elements.map((el: any) => el ? this.extractArgumentValue(el) : null)
      case 'ObjectExpression':
        const obj: Record<string, any> = {}
        node.properties.forEach((prop: any) => {
          if (prop.type === 'ObjectProperty') {
            const key = prop.key.type === 'Identifier' ? prop.key.name : prop.key.value
            obj[key] = this.extractArgumentValue(prop.value)
          }
        })
        return obj
      default:
        return `[${node.type}]`
    }
  }

  /**
   * 检查是否使用了特定的 Vue3 特性
   */
  isUsingFeature(result: ScriptParseResult, feature: keyof typeof VUE3_MACROS): boolean {
    const macroName = VUE3_MACROS[feature]
    return result.macros.has(macroName) ||
      Array.from(result.imports.values()).some(imp =>
        imp.isVue && imp.specifiers.some(spec => spec.local === macroName)
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
