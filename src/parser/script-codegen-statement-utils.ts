/**
 * Script AST 语句级代码片段生成工具。
 *
 * 通过回调接收表达式生成逻辑，避免与 script-codegen-utils 形成循环依赖。
 */

import type { ScriptCodegenVariables } from './script-codegen-node-utils.js'

/**
 * 语句代码生成依赖的表达式回调。
 */
export interface ScriptStatementCodegenContext {
  /** 生成表达式代码字符串。 */
  generateCodeString: (node: any, variables?: ScriptCodegenVariables) => string
  /** 提取表达式参数值或可嵌入代码片段。 */
  extractArgumentValue: (node: any, variables?: ScriptCodegenVariables) => any
}

/**
 * 生成块级语句代码片段。
 */
export function generateBlockStatementCode(
  node: any,
  context: ScriptStatementCodegenContext,
  variables?: ScriptCodegenVariables
): string {
  if (node.type === 'BlockStatement') {
    const statements = node.body
      .map((stmt: any) => generateStatementCode(stmt, context, variables))
      .join('\n    ')
    return `{\n    ${statements}\n  }`
  }
  return '{}'
}

/**
 * 生成单条语句代码片段。
 */
export function generateStatementCode(
  node: any,
  context: ScriptStatementCodegenContext,
  variables?: ScriptCodegenVariables
): string {
  switch (node.type) {
    case 'ReturnStatement':
      return `return ${node.argument ? context.generateCodeString(node.argument, variables) : ''}`
    case 'ExpressionStatement':
      return context.generateCodeString(node.expression, variables)
    case 'VariableDeclaration': {
      const declarations = node.declarations
        .map((decl: any) => {
          const init = decl.init ? ` = ${context.generateCodeString(decl.init, variables)}` : ''
          return `${decl.id.name}${init}`
        })
        .join(', ')
      return `${node.kind} ${declarations}`
    }
    case 'SwitchStatement':
      return generateSwitchStatementCode(node, context, variables)
    case 'IfStatement':
      return generateIfStatementCode(node, context, variables)
    case 'ForStatement':
      return generateForStatementCode(node, context, variables)
    case 'WhileStatement':
      return generateWhileStatementCode(node, context, variables)
    case 'BlockStatement':
      return generateBlockStatementCode(node, context, variables)
    case 'UpdateExpression':
    case 'AssignmentExpression':
      return context.generateCodeString(node, variables)
    case 'BreakStatement':
      return 'break'
    case 'ContinueStatement':
      return 'continue'
    default:
      return `// ${node.type}`
  }
}

function generateSwitchStatementCode(
  node: any,
  context: ScriptStatementCodegenContext,
  variables?: ScriptCodegenVariables
): string {
  const discriminant = context.extractArgumentValue(node.discriminant, variables)
  const cases = node.cases.map((caseNode: any) => {
    if (caseNode.test) {
      // 对于 case 测试值，需要生成正确的代码字符串
      const test = caseNode.test.type === 'StringLiteral'
        ? JSON.stringify(caseNode.test.value)
        : context.extractArgumentValue(caseNode.test, variables)
      const consequent = caseNode.consequent
        .map((stmt: any) => generateStatementCode(stmt, context, variables))
        .join('\n      ')
      return `    case ${test}:\n      ${consequent}`
    }

    const consequent = caseNode.consequent
      .map((stmt: any) => generateStatementCode(stmt, context, variables))
      .join('\n      ')
    return `    default:\n      ${consequent}`
  }).join('\n')

  return `switch (${discriminant}) {\n${cases}\n  }`
}

function generateIfStatementCode(
  node: any,
  context: ScriptStatementCodegenContext,
  variables?: ScriptCodegenVariables
): string {
  const test = context.extractArgumentValue(node.test, variables)
  const consequent = generateStatementCode(node.consequent, context, variables)
  const alternate = node.alternate ? ` else ${generateStatementCode(node.alternate, context, variables)}` : ''
  return `if (${test}) ${consequent}${alternate}`
}

function generateForStatementCode(
  node: any,
  context: ScriptStatementCodegenContext,
  variables?: ScriptCodegenVariables
): string {
  const init = node.init ? generateStatementCode(node.init, context, variables) : ''
  const test = node.test ? context.extractArgumentValue(node.test, variables) : ''
  const update = node.update ? context.extractArgumentValue(node.update, variables) : ''
  const body = generateStatementCode(node.body, context, variables)
  return `for (${init}; ${test}; ${update}) ${body}`
}

function generateWhileStatementCode(
  node: any,
  context: ScriptStatementCodegenContext,
  variables?: ScriptCodegenVariables
): string {
  const test = context.extractArgumentValue(node.test, variables)
  const body = generateStatementCode(node.body, context, variables)
  return `while (${test}) ${body}`
}
