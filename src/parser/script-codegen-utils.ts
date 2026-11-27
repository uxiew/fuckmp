/**
 * Script AST 代码片段生成工具。
 *
 * 这些函数只依赖 AST 节点和可选变量上下文，不持有 ScriptParser 实例状态。
 */

import {
  extractObjectExpressionValue,
  generateArrayExpressionCode,
  generateAssignmentExpressionCode as generateNodeAssignmentExpressionCode,
  generateFunctionParamsCode,
  generateInfixExpressionCode,
  generateMemberExpressionCode as generateNodeMemberExpressionCode,
  generateNewExpressionCode as generateNodeNewExpressionCode,
  generateObjectExpressionCode,
  generateTemplateLiteralCode,
  generateTernaryExpressionCode,
  generateUnaryExpressionCode as generateNodeUnaryExpressionCode,
  generateUpdateExpressionCode as generateNodeUpdateExpressionCode,
  quoteStringLiteral,
  transformVueIdentifier
} from './script-codegen-node-utils.js'
import type { ScriptCodegenVariables } from './script-codegen-node-utils.js'
import {
  generateBlockStatementCode
} from './script-codegen-statement-utils.js'
import type { ScriptStatementCodegenContext } from './script-codegen-statement-utils.js'

export type { ScriptCodegenVariables } from './script-codegen-node-utils.js'

const statementCodegenContext: ScriptStatementCodegenContext = {
  generateCodeString,
  extractArgumentValue
}

/**
 * 生成代码字符串（用于函数体等）。
 */
export function generateCodeString(node: any, variables?: ScriptCodegenVariables): string {
  switch (node.type) {
    case 'StringLiteral':
      return quoteStringLiteral(node.value)
    case 'NumericLiteral':
      return String(node.value)
    case 'BooleanLiteral':
      return String(node.value)
    case 'NullLiteral':
      return 'null'
    case 'Identifier':
      return node.name
    case 'ThisExpression':
      return 'this'
    case 'ArrayExpression':
      return generateArrayExpressionCode(node, generateCodeString, variables)
    case 'ObjectExpression':
      return generateObjectExpressionCode(node, generateCodeString, variables)
    case 'ArrowFunctionExpression':
    case 'FunctionDeclaration':
    case 'FunctionExpression':
      return generateFunctionCode(node, variables)
    case 'BinaryExpression':
      return generateBinaryExpressionCode(node, variables)
    case 'LogicalExpression':
      return generateLogicalExpressionCode(node, variables)
    case 'MemberExpression':
      return generateMemberExpressionCode(node, variables)
    case 'CallExpression':
      return generateCallExpressionCode(node, variables)
    case 'UpdateExpression':
      return generateUpdateExpression(node, variables)
    case 'AssignmentExpression':
      return generateAssignmentExpression(node, variables)
    case 'UnaryExpression':
      return generateUnaryExpression(node, variables)
    case 'NewExpression':
      return generateNewExpression(node, variables)
    case 'ConditionalExpression':
      return generateConditionalExpression(node, variables)
    case 'TemplateLiteral':
      return generateTemplateLiteral(node, variables)
    default:
      return `[${node.type}]`
  }
}

/**
 * 提取 AST 参数值。
 */
export function extractArgumentValue(node: any, variables?: ScriptCodegenVariables): any {
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
      return variables ? node.name : transformVueIdentifier(node.name)
    case 'ThisExpression':
      return 'this'
    case 'ArrayExpression':
      return node.elements.map((el: any) => el ? extractArgumentValue(el, variables) : null)
    case 'ObjectExpression':
      return extractObjectExpressionValue(node, extractArgumentValue, variables)
    case 'ArrowFunctionExpression':
    case 'FunctionExpression':
      return generateFunctionCode(node, variables)
    case 'CallExpression':
      return generateCallExpressionCode(node, variables)
    case 'NewExpression':
      return generateNewExpressionCode(node, variables)
    case 'MemberExpression':
      return generateMemberExpressionCode(node, variables)
    case 'ConditionalExpression':
      return generateConditionalExpressionCode(node, variables)
    case 'BinaryExpression':
      return generateBinaryExpressionCode(node, variables)
    case 'LogicalExpression':
      return generateLogicalExpressionCode(node, variables)
    case 'TemplateLiteral':
      return generateTemplateLiteral(node, variables)
    case 'UpdateExpression':
      return generateUpdateExpression(node, variables)
    case 'AssignmentExpression':
      return generateAssignmentExpression(node, variables)
    case 'UnaryExpression':
      return generateUnaryExpression(node, variables)
    case 'BreakStatement':
      return 'break'
    case 'ContinueStatement':
      return 'continue'
    default:
      return `[${node.type}]`
  }
}

function generateFunctionCode(node: any, variables?: ScriptCodegenVariables): string {
  const params = generateFunctionParamsCode(node)

  if (node.type === 'ArrowFunctionExpression' || node.type === 'FunctionDeclaration') {
    if (node.body.type === 'BlockStatement') {
      return `(${params}) => ${generateBlockStatementCode(node.body, statementCodegenContext, variables)}`
    }
    return `(${params}) => ${extractArgumentValue(node.body, variables)}`
  }

  return `function(${params}) ${generateBlockStatementCode(node.body, statementCodegenContext, variables)}`
}

function generateCallExpressionCode(node: any, variables?: ScriptCodegenVariables): string {
  const callee = extractArgumentValue(node.callee, variables)

  // 对于Vue响应式API调用，直接返回参数内容
  if (!variables && typeof callee === 'string' && ['ref', 'reactive', 'computed'].includes(callee)) {
    if (node.arguments.length > 0) {
      const arg = node.arguments[0]
      // 对于 computed，如果参数是箭头函数，提取函数体
      if (callee === 'computed' && arg.type === 'ArrowFunctionExpression') {
        if (arg.body.type === 'BlockStatement') {
          return generateBlockStatementCode(arg.body, statementCodegenContext, variables)
        }
        return generateCodeString(arg.body, variables)
      }
      // 对于 reactive 和 ref，直接生成参数的代码
      return generateCodeString(arg, variables)
    }
  }

  // 特殊处理 emit 函数调用
  if (callee === 'this.triggerEvent' || (callee === 'emit' && !variables)) {
    const args = node.arguments
      .map((arg: any) => generateCodeString(arg, variables))
      .join(', ')
    return `this.triggerEvent(${args})`
  }

  const args = node.arguments
    .map((arg: any) => generateCodeString(arg, variables))
    .join(', ')
  return `${callee}(${args})`
}

function generateNewExpressionCode(node: any, variables?: ScriptCodegenVariables): string {
  return generateNodeNewExpressionCode(node, extractArgumentValue, variables)
}

function generateMemberExpressionCode(node: any, variables?: ScriptCodegenVariables): string {
  return generateNodeMemberExpressionCode(node, extractArgumentValue, variables)
}

function generateConditionalExpressionCode(node: any, variables?: ScriptCodegenVariables): string {
  return generateTernaryExpressionCode(node, generateCodeString, variables)
}

function generateBinaryExpressionCode(node: any, variables?: ScriptCodegenVariables): string {
  return generateInfixExpressionCode(node, generateCodeString, variables)
}

function generateLogicalExpressionCode(node: any, variables?: ScriptCodegenVariables): string {
  return generateInfixExpressionCode(node, generateCodeString, variables)
}

function generateTemplateLiteral(node: any, variables?: ScriptCodegenVariables): string {
  return generateTemplateLiteralCode(node, extractArgumentValue, variables)
}

function generateUpdateExpression(node: any, variables?: ScriptCodegenVariables): string {
  return generateNodeUpdateExpressionCode(node, generateCodeString, variables)
}

function generateAssignmentExpression(node: any, variables?: ScriptCodegenVariables): string {
  return generateNodeAssignmentExpressionCode(node, generateCodeString, variables)
}

function generateUnaryExpression(node: any, variables?: ScriptCodegenVariables): string {
  return generateNodeUnaryExpressionCode(node, generateCodeString, variables)
}

function generateNewExpression(node: any, variables?: ScriptCodegenVariables): string {
  return generateNodeNewExpressionCode(node, generateCodeString, variables)
}

function generateConditionalExpression(node: any, variables?: ScriptCodegenVariables): string {
  return generateTernaryExpressionCode(node, generateCodeString, variables)
}
