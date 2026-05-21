/**
 * Script 解析器
 */

import { parseScript, traverseAST, isCallExpression, isIdentifier } from '@/utils/index.js'
import { VUE3_MACROS } from '@/types/index.js'
import type { File, ImportDeclaration, CallExpression, VariableDeclaration } from '@babel/types'
import { logger } from '@/utils/index.js'
import { extractArgumentValue } from './script-codegen-utils.js'

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
    const isStyle = source.endsWith('.scss') || source.endsWith('.sass') || source.endsWith('.css')

    const importInfo: ImportInfo = {
      source,
      specifiers: [],
      isVue,
      isComponent,
      isStyle
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
        arguments: node.arguments.map(arg => extractArgumentValue(arg, result.variables)),
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
      if (declarator.id.type === 'ObjectPattern' &&
        declarator.init &&
        isCallExpression(declarator.init) &&
        isIdentifier(declarator.init.callee) &&
        declarator.init.callee.name === 'defineProps') {
        const variableInfo: VariableInfo = {
          name: `__definePropsDestructure_${result.variables.size}`,
          type: node.kind as 'const' | 'let' | 'var',
          init: this.extractDefinePropsDestructureInfo(declarator.id, result),
          isReactive: false,
          macroType: 'definePropsDestructure'
        }

        result.variables.set(variableInfo.name, variableInfo)
      } else if (declarator.id.type === 'ArrayPattern' &&
        declarator.init &&
        isCallExpression(declarator.init) &&
        isIdentifier(declarator.init.callee) &&
        declarator.init.callee.name === 'defineModel') {
        const modelVariableName = this.getArrayPatternFirstIdentifier(declarator.id)
        if (!modelVariableName) {
          return
        }

        const variableInfo: VariableInfo = {
          name: modelVariableName,
          type: node.kind as 'const' | 'let' | 'var',
          init: this.extractDefineModelInfo(declarator.init, modelVariableName, result),
          isReactive: false,
          macroType: 'defineModel'
        }

        result.variables.set(variableInfo.name, variableInfo)
      } else if (declarator.id.type === 'Identifier') {
        const name = declarator.id.name
        let isReactive = false
        let macroType: string | undefined

        // 检查是否为响应式变量或 <script setup> 编译宏变量
        let initValue: any = undefined
        if (declarator.init && isCallExpression(declarator.init) && isIdentifier(declarator.init.callee)) {
          const calleeName = declarator.init.callee.name
          if (['ref', 'reactive', 'computed'].includes(calleeName)) {
            isReactive = true
            macroType = calleeName
            // 对于响应式变量，提取第一个参数作为初始值
            if (declarator.init.arguments.length > 0) {
              initValue = extractArgumentValue(declarator.init.arguments[0], result.variables)
            }
          } else if (calleeName === 'defineModel') {
            macroType = calleeName
            initValue = this.extractDefineModelInfo(declarator.init, name, result)
          } else if (calleeName === 'withDefaults') {
            macroType = calleeName
            initValue = this.extractWithDefaultsInfo(declarator.init, result)
          } else if (calleeName === 'defineSlots') {
            macroType = calleeName
            initValue = { variable: name }
          } else if (calleeName === 'useTemplateRef') {
            macroType = calleeName
            initValue = this.extractUseTemplateRefInfo(declarator.init, name, result)
          } else if (calleeName === 'useId') {
            macroType = calleeName
            initValue = { variable: name }
          } else if (calleeName === 'inject') {
            macroType = calleeName
            initValue = {
              variable: name,
              key: declarator.init.arguments[0] ? extractArgumentValue(declarator.init.arguments[0], result.variables) : ''
            }
          } else {
            initValue = extractArgumentValue(declarator.init, result.variables)
          }
        } else if (declarator.init) {
          initValue = extractArgumentValue(declarator.init, result.variables)
        }

        const variableInfo: VariableInfo = {
          name,
          type: node.kind as 'const' | 'let' | 'var',
          init: initValue,
          isReactive,
          ...(macroType && { macroType })
        }

        result.variables.set(name, variableInfo)
      }
    })
  }


  /**
   * 提取 Vue 3.5 defineProps 响应式解构的默认值和别名。
   */
  private extractDefinePropsDestructureInfo(pattern: any, result: ScriptParseResult): Record<string, any> {
    const defaults: Record<string, any> = {}
    const aliases: Record<string, string> = {}

    pattern.properties.forEach((property: any) => {
      if (property.type !== 'ObjectProperty') return

      const propName = this.getObjectPropertyKey(property.key)
      const localName = this.getDestructureLocalName(property.value)
      if (!propName || !localName) return

      aliases[localName] = propName

      if (property.value.type === 'AssignmentPattern') {
        defaults[propName] = this.extractDefaultValue(property.value.right, result)
      }
    })

    return { defaults, aliases }
  }

  /**
   * 获取对象属性 key。
   */
  private getObjectPropertyKey(key: any): string {
    if (key.type === 'Identifier') return key.name
    if (key.type === 'StringLiteral' || key.type === 'NumericLiteral') return String(key.value)
    return ''
  }

  /**
   * 获取数组解构的第一个标识符，用于 defineModel tuple 返回值。
   */
  private getArrayPatternFirstIdentifier(pattern: any): string {
    const firstElement = pattern.elements?.[0]
    return firstElement?.type === 'Identifier' ? firstElement.name : ''
  }

  /**
   * 获取 defineProps 解构后的局部变量名。
   */
  private getDestructureLocalName(value: any): string {
    if (value.type === 'Identifier') return value.name
    if (value.type === 'AssignmentPattern' && value.left.type === 'Identifier') return value.left.name
    return ''
  }


  /**
   * 提取 withDefaults(defineProps(), defaults) 中的默认值。
   */
  private extractWithDefaultsInfo(node: CallExpression, result: ScriptParseResult): Record<string, any> {
    const defaultsNode = node.arguments[1]
    return {
      defaults: defaultsNode ? this.extractDefaultsObject(defaultsNode, result) : {}
    }
  }

  /**
   * 提取 withDefaults 的对象字面量默认值。
   */
  private extractDefaultsObject(node: any, result: ScriptParseResult): Record<string, any> {
    if (!node || node.type !== 'ObjectExpression') {
      return {}
    }

    const defaults: Record<string, any> = {}
    node.properties.forEach((property: any) => {
      if (property.type !== 'ObjectProperty') return

      const key = property.key.type === 'Identifier' ? property.key.name : property.key.value
      defaults[key] = this.extractDefaultValue(property.value, result)
    })

    return defaults
  }

  /**
   * 提取单个 prop 默认值；数组/对象 factory 会取其返回的静态值。
   */
  private extractDefaultValue(node: any, result: ScriptParseResult): any {
    if (!node) {
      return undefined
    }

    if (node.type === 'ArrowFunctionExpression' || node.type === 'FunctionExpression') {
      if (node.body?.type === 'BlockStatement') {
        const returnStatement = node.body.body?.find((statement: any) => statement.type === 'ReturnStatement')
        return returnStatement?.argument ? extractArgumentValue(returnStatement.argument, result.variables) : undefined
      }
      return extractArgumentValue(node.body, result.variables)
    }

    return extractArgumentValue(node, result.variables)
  }

  /**
   * 提取 defineModel 变量信息。
   */
  private extractDefineModelInfo(node: CallExpression, variableName: string, result: ScriptParseResult): Record<string, any> {
    const firstArg = node.arguments[0]
    const secondArg = node.arguments[1]
    const hasNamedModel = firstArg?.type === 'StringLiteral'
    const optionsNode = hasNamedModel ? secondArg : firstArg
    const options = optionsNode ? extractArgumentValue(optionsNode, result.variables) : {}

    return {
      property: hasNamedModel ? (firstArg as any).value : 'modelValue',
      variable: variableName,
      type: this.extractDefineModelType(node),
      default: options && typeof options === 'object' && 'default' in options ? options.default : undefined,
      required: options && typeof options === 'object' && 'required' in options ? options.required : false
    }
  }

  /**
   * 从 defineModel 泛型或默认值中推断小程序 property 类型。
   */
  private extractDefineModelType(node: CallExpression): string {
    const typeParam = (node as any).typeParameters?.params?.[0]
    switch (typeParam?.type) {
      case 'TSNumberKeyword':
        return 'Number'
      case 'TSBooleanKeyword':
        return 'Boolean'
      case 'TSArrayType':
        return 'Array'
      case 'TSTypeLiteral':
      case 'TSTypeReference':
        return 'Object'
      case 'TSStringKeyword':
      default:
        return 'String'
    }
  }

  /**
   * 提取 Vue 3.5 useTemplateRef 的 ref key。
   */
  private extractUseTemplateRefInfo(node: CallExpression, variableName: string, result: ScriptParseResult): Record<string, any> {
    const firstArg = node.arguments[0]
    const refName = firstArg ? extractArgumentValue(firstArg, result.variables) : variableName

    return {
      variable: variableName,
      ref: typeof refName === 'string' ? refName : variableName
    }
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
      value: node.declaration ? extractArgumentValue(node.declaration, result.variables) : undefined
    }

    result.exports.push(exportInfo)
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
