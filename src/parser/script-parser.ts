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
  private currentResult: ScriptParseResult | null = null

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

      // 设置当前解析结果，供其他方法使用
      this.currentResult = result

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

      // 清理当前解析结果
      this.currentResult = null

      return result

    } catch (error) {
      // 清理当前解析结果
      this.currentResult = null
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
   * 生成代码字符串（用于函数体等）
   */
  private generateCodeString(node: any): string {
    switch (node.type) {
      case 'StringLiteral':
        return `'${node.value}'`
      case 'NumericLiteral':
        return String(node.value)
      case 'BooleanLiteral':
        return String(node.value)
      case 'NullLiteral':
        return 'null'
      case 'Identifier':
        return node.name
      case 'ArrayExpression':
        const elements = node.elements.map((el: any) => el ? this.generateCodeString(el) : 'null').join(', ')
        return `[${elements}]`
      case 'ObjectExpression':
        const properties = node.properties.map((prop: any) => {
          if (prop.type === 'ObjectProperty') {
            const key = prop.key.type === 'Identifier' ? prop.key.name : this.generateCodeString(prop.key)
            const value = this.generateCodeString(prop.value)
            return `${key}: ${value}`
          }
          return ''
        }).filter(Boolean).join(', ')
        return `{ ${properties} }`
      case 'ArrowFunctionExpression':
      case 'FunctionExpression':
        // 对于函数，生成函数代码字符串
        return this.generateFunctionCode(node)
      case 'BinaryExpression':
        return this.generateBinaryExpressionCode(node)
      case 'LogicalExpression':
        return this.generateLogicalExpressionCode(node)
      case 'MemberExpression':
        return this.generateMemberExpressionCode(node)
      case 'CallExpression':
        return this.generateCallExpressionCode(node)
      case 'UpdateExpression':
        return this.generateUpdateExpression(node)
      case 'AssignmentExpression':
        return this.generateAssignmentExpression(node)
      case 'UnaryExpression':
        return this.generateUnaryExpression(node)
      case 'NewExpression':
        return this.generateNewExpression(node)
      case 'ConditionalExpression':
        return this.generateConditionalExpression(node)
      case 'TemplateLiteral':
        return this.generateTemplateLiteral(node)
      default:
        return `[${node.type}]`
    }
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
        return this.transformVueIdentifier(node.name)
      case 'ArrayExpression':
        return node.elements.map((el: any) => el ? this.extractArgumentValue(el) : null)
      case 'ObjectExpression':
        // 生成对象字面量代码字符串
        const properties = node.properties.map((prop: any) => {
          if (prop.type === 'ObjectProperty') {
            const key = prop.key.type === 'Identifier' ? prop.key.name : JSON.stringify(prop.key.value)
            const value = this.extractArgumentValue(prop.value)

            // 只有真正的字符串字面量才需要添加引号
            // 对象、数组、函数、表达式等都不需要引号
            const needsQuotes = prop.value.type === 'StringLiteral'

            return `${key}: ${needsQuotes ? JSON.stringify(value) : value}`
          }
          return ''
        }).filter(Boolean).join(', ')
        return `{ ${properties} }`
      case 'ArrowFunctionExpression':
      case 'FunctionExpression':
        // 对于函数，生成函数代码字符串
        return this.generateFunctionCode(node)
      case 'CallExpression':
        // 对于函数调用，生成调用代码字符串
        return this.generateCallExpressionCode(node)
      case 'NewExpression':
        // 对于 new 表达式，生成构造函数调用代码
        return this.generateNewExpressionCode(node)
      case 'MemberExpression':
        // 对于成员访问表达式
        return this.generateMemberExpressionCode(node)
      case 'ConditionalExpression':
        // 对于三元运算符
        return this.generateConditionalExpressionCode(node)
      case 'BinaryExpression':
        // 对于二元运算符
        return this.generateBinaryExpressionCode(node)
      case 'LogicalExpression':
        // 对于逻辑运算符
        return this.generateLogicalExpressionCode(node)
      case 'TemplateLiteral':
        // 对于模板字面量
        return this.generateTemplateLiteral(node)
      case 'UpdateExpression':
        // 对于更新表达式（如 ++、--）
        return this.generateUpdateExpression(node)
      case 'AssignmentExpression':
        // 对于赋值表达式
        return this.generateAssignmentExpression(node)
      case 'UnaryExpression':
        // 对于一元表达式，生成一元运算符代码
        return this.generateUnaryExpression(node)
      case 'BreakStatement':
        return 'break'
      case 'ContinueStatement':
        return 'continue'
      default:
        return `[${node.type}]`
    }
  }

  /**
   * 生成函数代码
   */
  private generateFunctionCode(node: any): string {
    const params = node.params.map((param: any) => {
      if (param.type === 'Identifier') {
        return param.name
      }
      return 'param'
    }).join(', ')

    if (node.type === 'ArrowFunctionExpression') {
      if (node.body.type === 'BlockStatement') {
        return `(${params}) => ${this.generateBlockStatement(node.body)}`
      } else {
        return `(${params}) => ${this.extractArgumentValue(node.body)}`
      }
    } else {
      return `function(${params}) ${this.generateBlockStatement(node.body)}`
    }
  }

  /**
   * 生成块语句代码
   */
  private generateBlockStatement(node: any): string {
    if (node.type === 'BlockStatement') {
      const statements = node.body.map((stmt: any) => this.generateStatement(stmt)).join('\n    ')
      return `{\n    ${statements}\n  }`
    }
    return '{}'
  }

  /**
   * 生成语句代码
   */
  private generateStatement(node: any): string {
    switch (node.type) {
      case 'ReturnStatement':
        return `return ${node.argument ? this.generateCodeString(node.argument) : ''}`
      case 'ExpressionStatement':
        return this.generateCodeString(node.expression)
      case 'VariableDeclaration':
        const declarations = node.declarations.map((decl: any) => {
          const init = decl.init ? ` = ${this.generateCodeString(decl.init)}` : ''
          return `${decl.id.name}${init}`
        }).join(', ')
        return `${node.kind} ${declarations}`
      case 'SwitchStatement':
        return this.generateSwitchStatement(node)
      case 'IfStatement':
        return this.generateIfStatement(node)
      case 'ForStatement':
        return this.generateForStatement(node)
      case 'WhileStatement':
        return this.generateWhileStatement(node)
      case 'BlockStatement':
        return this.generateBlockStatement(node)
      case 'UpdateExpression':
        return this.generateUpdateExpression(node)
      case 'AssignmentExpression':
        return this.generateAssignmentExpression(node)
      case 'BreakStatement':
        return 'break'
      case 'ContinueStatement':
        return 'continue'
      default:
        return `// ${node.type}`
    }
  }

  /**
   * 生成函数调用代码
   */
  private generateCallExpressionCode(node: any): string {
    const callee = this.extractArgumentValue(node.callee)

    // 对于Vue响应式API调用，直接返回参数内容
    if (typeof callee === 'string' && ['ref', 'reactive', 'computed'].includes(callee)) {
      if (node.arguments.length > 0) {
        // 对于 reactive 和 ref，直接生成参数的代码
        return this.generateCodeString(node.arguments[0])
      }
    }

    // 特殊处理 emit 函数调用
    if (callee === 'this.triggerEvent' || callee === 'emit') {
      const args = node.arguments.map((arg: any) => {
        const value = this.extractArgumentValue(arg)
        // 如果是字符串字面量，需要添加引号
        if (arg.type === 'StringLiteral') {
          return JSON.stringify(value)
        }
        return value
      }).join(', ')
      return `this.triggerEvent(${args})`
    }

    const args = node.arguments.map((arg: any) => {
      const value = this.extractArgumentValue(arg)
      // 如果是字符串字面量，需要添加引号
      if (arg.type === 'StringLiteral') {
        return JSON.stringify(value)
      }
      return value
    }).join(', ')
    return `${callee}(${args})`
  }

  /**
   * 生成 new 表达式代码
   */
  private generateNewExpressionCode(node: any): string {
    const callee = this.extractArgumentValue(node.callee)
    const args = node.arguments.map((arg: any) => this.extractArgumentValue(arg)).join(', ')
    return `new ${callee}(${args})`
  }

  /**
   * 生成成员访问表达式代码
   */
  private generateMemberExpressionCode(node: any): string {
    const object = this.extractArgumentValue(node.object)
    const property = node.computed ?
      `[${this.extractArgumentValue(node.property)}]` :
      `.${node.property.name}`

    // 检查是否为响应式变量访问（如 visitCount.value）
    if (node.object.type === 'Identifier' &&
      node.property.name === 'value' &&
      this.currentResult &&
      this.currentResult.variables.has(node.object.name) &&
      this.currentResult.variables.get(node.object.name)?.isReactive) {
      // 转换为 this.variableName.value
      return `this.${node.object.name}${property}`
    }

    // 移除特殊处理逻辑，保持原始的 Vue 代码
    // 响应式变量访问现在由运行时代理系统自动处理
    return `${object}${property}`
  }

  /**
   * 生成三元运算符代码
   */
  private generateConditionalExpressionCode(node: any): string {
    const test = this.extractArgumentValue(node.test)
    const consequent = this.extractArgumentValue(node.consequent)
    const alternate = this.extractArgumentValue(node.alternate)
    return `${test} ? ${consequent} : ${alternate}`
  }

  /**
   * 生成二元运算符代码
   */
  private generateBinaryExpressionCode(node: any): string {
    const left = this.generateCodeString(node.left)
    const right = this.generateCodeString(node.right)
    return `${left} ${node.operator} ${right}`
  }

  /**
   * 生成逻辑运算符代码
   */
  private generateLogicalExpressionCode(node: any): string {
    const left = this.generateCodeString(node.left)
    const right = this.generateCodeString(node.right)
    return `${left} ${node.operator} ${right}`
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

  /**
   * 生成Switch语句
   */
  private generateSwitchStatement(node: any): string {
    const discriminant = this.extractArgumentValue(node.discriminant)
    const cases = node.cases.map((caseNode: any) => {
      if (caseNode.test) {
        // 对于 case 测试值，需要生成正确的代码字符串
        const test = caseNode.test.type === 'StringLiteral'
          ? JSON.stringify(caseNode.test.value)
          : this.extractArgumentValue(caseNode.test)
        const consequent = caseNode.consequent.map((stmt: any) => this.generateStatement(stmt)).join('\n      ')
        return `    case ${test}:\n      ${consequent}`
      } else {
        const consequent = caseNode.consequent.map((stmt: any) => this.generateStatement(stmt)).join('\n      ')
        return `    default:\n      ${consequent}`
      }
    }).join('\n')

    return `switch (${discriminant}) {\n${cases}\n  }`
  }

  /**
   * 生成If语句
   */
  private generateIfStatement(node: any): string {
    const test = this.extractArgumentValue(node.test)
    const consequent = this.generateStatement(node.consequent)
    const alternate = node.alternate ? ` else ${this.generateStatement(node.alternate)}` : ''
    return `if (${test}) ${consequent}${alternate}`
  }

  /**
   * 生成For语句
   */
  private generateForStatement(node: any): string {
    const init = node.init ? this.generateStatement(node.init) : ''
    const test = node.test ? this.extractArgumentValue(node.test) : ''
    const update = node.update ? this.extractArgumentValue(node.update) : ''
    const body = this.generateStatement(node.body)
    return `for (${init}; ${test}; ${update}) ${body}`
  }

  /**
   * 生成While语句
   */
  private generateWhileStatement(node: any): string {
    const test = this.extractArgumentValue(node.test)
    const body = this.generateStatement(node.body)
    return `while (${test}) ${body}`
  }

  /**
   * 生成模板字面量
   */
  private generateTemplateLiteral(node: any): string {
    let result = '`'

    for (let i = 0; i < node.quasis.length; i++) {
      // 添加字符串部分
      result += node.quasis[i].value.raw

      // 添加表达式部分（如果存在）
      if (i < node.expressions.length) {
        result += '${' + this.extractArgumentValue(node.expressions[i]) + '}'
      }
    }

    result += '`'
    return result
  }

  /**
   * 生成更新表达式（如 ++、--）
   */
  private generateUpdateExpression(node: any): string {
    // 移除字符串替换逻辑，保持原始的 Vue 代码
    // 响应式更新现在由运行时代理系统自动处理

    // 生成原始的更新表达式
    const argument = this.generateCodeString(node.argument)
    if (node.prefix) {
      return `${node.operator}${argument}`
    } else {
      return `${argument}${node.operator}`
    }
  }

  /**
   * 生成赋值表达式
   */
  private generateAssignmentExpression(node: any): string {
    const left = this.generateCodeString(node.left)
    const right = this.generateCodeString(node.right)

    // 移除特殊处理逻辑，保持原始的 Vue 代码
    // 响应式变量赋值现在由运行时代理系统自动处理
    return `${left} ${node.operator} ${right}`
  }

  /**
   * 生成一元表达式（如 !、-、+、typeof 等）
   */
  private generateUnaryExpression(node: any): string {
    const argument = this.generateCodeString(node.argument)
    if (node.prefix) {
      return `${node.operator}${argument}`
    } else {
      return `${argument}${node.operator}`
    }
  }

  /**
   * 生成 new 表达式
   */
  private generateNewExpression(node: any): string {
    const callee = this.generateCodeString(node.callee)
    const args = node.arguments.map((arg: any) => this.generateCodeString(arg)).join(', ')
    return `new ${callee}(${args})`
  }

  /**
   * 生成条件表达式（三元运算符）
   */
  private generateConditionalExpression(node: any): string {
    const test = this.generateCodeString(node.test)
    const consequent = this.generateCodeString(node.consequent)
    const alternate = this.generateCodeString(node.alternate)
    return `${test} ? ${consequent} : ${alternate}`
  }

  /**
   * 转换 Vue 标识符为小程序 API
   */
  private transformVueIdentifier(name: string): string {
    switch (name) {
      case 'props':
        return 'this.properties'
      case 'emit':
        return 'this.triggerEvent'
      default:
        return name
    }
  }
}
