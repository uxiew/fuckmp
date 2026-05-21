/**
 * Script AST 代码片段生成工具。
 *
 * 这些函数只依赖 AST 节点和可选变量上下文，不持有 ScriptParser 实例状态。
 */

export type ScriptCodegenVariables = Map<string, { isReactive: boolean }>

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
    case 'ArrayExpression': {
      const elements = node.elements
        .map((el: any) => el ? generateCodeString(el, variables) : 'null')
        .join(', ')
      return `[${elements}]`
    }
    case 'ObjectExpression': {
      const properties = node.properties
        .map((prop: any) => {
          if (prop.type === 'ObjectProperty') {
            const key = prop.key.type === 'Identifier' ? prop.key.name : generateCodeString(prop.key, variables)
            const value = generateCodeString(prop.value, variables)
            return `${key}: ${value}`
          }
          return ''
        })
        .filter(Boolean)
        .join(', ')
      return `{ ${properties} }`
    }
    case 'ArrowFunctionExpression':
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
      return transformVueIdentifier(node.name)
    case 'ArrayExpression':
      return node.elements.map((el: any) => el ? extractArgumentValue(el, variables) : null)
    case 'ObjectExpression': {
      const obj: Record<string, any> = {}
      node.properties.forEach((prop: any) => {
        if (prop.type === 'ObjectProperty') {
          const key = prop.key.type === 'Identifier' ? prop.key.name : prop.key.value
          obj[key] = extractArgumentValue(prop.value, variables)
        }
      })
      return obj
    }
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
  const params = node.params.map((param: any) => {
    if (param.type === 'Identifier') {
      return param.name
    }
    return 'param'
  }).join(', ')

  if (node.type === 'ArrowFunctionExpression') {
    if (node.body.type === 'BlockStatement') {
      return `(${params}) => ${generateBlockStatement(node.body, variables)}`
    }
    return `(${params}) => ${extractArgumentValue(node.body, variables)}`
  }

  return `function(${params}) ${generateBlockStatement(node.body, variables)}`
}

function generateBlockStatement(node: any, variables?: ScriptCodegenVariables): string {
  if (node.type === 'BlockStatement') {
    const statements = node.body
      .map((stmt: any) => generateStatement(stmt, variables))
      .join('\n    ')
    return `{\n    ${statements}\n  }`
  }
  return '{}'
}

function generateStatement(node: any, variables?: ScriptCodegenVariables): string {
  switch (node.type) {
    case 'ReturnStatement':
      return `return ${node.argument ? generateCodeString(node.argument, variables) : ''}`
    case 'ExpressionStatement':
      return generateCodeString(node.expression, variables)
    case 'VariableDeclaration': {
      const declarations = node.declarations
        .map((decl: any) => {
          const init = decl.init ? ` = ${generateCodeString(decl.init, variables)}` : ''
          return `${decl.id.name}${init}`
        })
        .join(', ')
      return `${node.kind} ${declarations}`
    }
    case 'SwitchStatement':
      return generateSwitchStatement(node, variables)
    case 'IfStatement':
      return generateIfStatement(node, variables)
    case 'ForStatement':
      return generateForStatement(node, variables)
    case 'WhileStatement':
      return generateWhileStatement(node, variables)
    case 'BlockStatement':
      return generateBlockStatement(node, variables)
    case 'UpdateExpression':
      return generateUpdateExpression(node, variables)
    case 'AssignmentExpression':
      return generateAssignmentExpression(node, variables)
    case 'BreakStatement':
      return 'break'
    case 'ContinueStatement':
      return 'continue'
    default:
      return `// ${node.type}`
  }
}

function generateCallExpressionCode(node: any, variables?: ScriptCodegenVariables): string {
  const callee = extractArgumentValue(node.callee, variables)

  // 对于Vue响应式API调用，直接返回参数内容
  if (typeof callee === 'string' && ['ref', 'reactive', 'computed'].includes(callee)) {
    if (node.arguments.length > 0) {
      const arg = node.arguments[0]
      // 对于 computed，如果参数是箭头函数，提取函数体
      if (callee === 'computed' && arg.type === 'ArrowFunctionExpression') {
        if (arg.body.type === 'BlockStatement') {
          return generateBlockStatement(arg.body, variables)
        }
        return generateCodeString(arg.body, variables)
      }
      // 对于 reactive 和 ref，直接生成参数的代码
      return generateCodeString(arg, variables)
    }
  }

  // 特殊处理 emit 函数调用
  if (callee === 'this.triggerEvent' || callee === 'emit') {
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
  const callee = extractArgumentValue(node.callee, variables)
  const args = node.arguments
    .map((arg: any) => extractArgumentValue(arg, variables))
    .join(', ')
  return `new ${callee}(${args})`
}

function generateMemberExpressionCode(node: any, variables?: ScriptCodegenVariables): string {
  const object = extractArgumentValue(node.object, variables)
  const property = node.computed
    ? `[${extractArgumentValue(node.property, variables)}]`
    : `.${node.property.name}`

  // 检查是否为响应式变量访问（如 visitCount.value）
  if (node.object.type === 'Identifier' &&
    node.property.name === 'value' &&
    variables?.has(node.object.name) &&
    variables.get(node.object.name)?.isReactive) {
    // 转换为 this.variableName.value
    return `this.${node.object.name}${property}`
  }

  // 移除特殊处理逻辑，保持原始的 Vue 代码
  // 响应式变量访问现在由运行时代理系统自动处理
  return `${object}${property}`
}

function generateConditionalExpressionCode(node: any, variables?: ScriptCodegenVariables): string {
  const test = extractArgumentValue(node.test, variables)
  const consequent = extractArgumentValue(node.consequent, variables)
  const alternate = extractArgumentValue(node.alternate, variables)
  return `${test} ? ${consequent} : ${alternate}`
}

function generateBinaryExpressionCode(node: any, variables?: ScriptCodegenVariables): string {
  const left = generateCodeString(node.left, variables)
  const right = generateCodeString(node.right, variables)
  return `${left} ${node.operator} ${right}`
}

function generateLogicalExpressionCode(node: any, variables?: ScriptCodegenVariables): string {
  const left = generateCodeString(node.left, variables)
  const right = generateCodeString(node.right, variables)
  return `${left} ${node.operator} ${right}`
}

function generateSwitchStatement(node: any, variables?: ScriptCodegenVariables): string {
  const discriminant = extractArgumentValue(node.discriminant, variables)
  const cases = node.cases.map((caseNode: any) => {
    if (caseNode.test) {
      // 对于 case 测试值，需要生成正确的代码字符串
      const test = caseNode.test.type === 'StringLiteral'
        ? JSON.stringify(caseNode.test.value)
        : extractArgumentValue(caseNode.test, variables)
      const consequent = caseNode.consequent
        .map((stmt: any) => generateStatement(stmt, variables))
        .join('\n      ')
      return `    case ${test}:\n      ${consequent}`
    }

    const consequent = caseNode.consequent
      .map((stmt: any) => generateStatement(stmt, variables))
      .join('\n      ')
    return `    default:\n      ${consequent}`
  }).join('\n')

  return `switch (${discriminant}) {\n${cases}\n  }`
}

function generateIfStatement(node: any, variables?: ScriptCodegenVariables): string {
  const test = extractArgumentValue(node.test, variables)
  const consequent = generateStatement(node.consequent, variables)
  const alternate = node.alternate ? ` else ${generateStatement(node.alternate, variables)}` : ''
  return `if (${test}) ${consequent}${alternate}`
}

function generateForStatement(node: any, variables?: ScriptCodegenVariables): string {
  const init = node.init ? generateStatement(node.init, variables) : ''
  const test = node.test ? extractArgumentValue(node.test, variables) : ''
  const update = node.update ? extractArgumentValue(node.update, variables) : ''
  const body = generateStatement(node.body, variables)
  return `for (${init}; ${test}; ${update}) ${body}`
}

function generateWhileStatement(node: any, variables?: ScriptCodegenVariables): string {
  const test = extractArgumentValue(node.test, variables)
  const body = generateStatement(node.body, variables)
  return `while (${test}) ${body}`
}

function generateTemplateLiteral(node: any, variables?: ScriptCodegenVariables): string {
  let result = '`'

  for (let i = 0; i < node.quasis.length; i++) {
    result += node.quasis[i].value.raw

    if (i < node.expressions.length) {
      result += '${' + extractArgumentValue(node.expressions[i], variables) + '}'
    }
  }

  result += '`'
  return result
}

function quoteStringLiteral(value: string): string {
  return `'${value
    .replace(/\\/g, '\\\\')
    .replace(/'/g, "\\'")
    .replace(/\r/g, '\\r')
    .replace(/\n/g, '\\n')
    .replace(/\u2028/g, '\\u2028')
    .replace(/\u2029/g, '\\u2029')}'`
}

function generateUpdateExpression(node: any, variables?: ScriptCodegenVariables): string {
  // 移除字符串替换逻辑，保持原始的 Vue 代码
  // 响应式更新现在由运行时代理系统自动处理
  const argument = generateCodeString(node.argument, variables)
  if (node.prefix) {
    return `${node.operator}${argument}`
  }
  return `${argument}${node.operator}`
}

function generateAssignmentExpression(node: any, variables?: ScriptCodegenVariables): string {
  const left = generateCodeString(node.left, variables)
  const right = generateCodeString(node.right, variables)

  // 移除特殊处理逻辑，保持原始的 Vue 代码
  // 响应式变量赋值现在由运行时代理系统自动处理
  return `${left} ${node.operator} ${right}`
}

function generateUnaryExpression(node: any, variables?: ScriptCodegenVariables): string {
  const argument = generateCodeString(node.argument, variables)
  if (node.prefix) {
    return `${node.operator}${argument}`
  }
  return `${argument}${node.operator}`
}

function generateNewExpression(node: any, variables?: ScriptCodegenVariables): string {
  const callee = generateCodeString(node.callee, variables)
  const args = node.arguments
    .map((arg: any) => generateCodeString(arg, variables))
    .join(', ')
  return `new ${callee}(${args})`
}

function generateConditionalExpression(node: any, variables?: ScriptCodegenVariables): string {
  const test = generateCodeString(node.test, variables)
  const consequent = generateCodeString(node.consequent, variables)
  const alternate = generateCodeString(node.alternate, variables)
  return `${test} ? ${consequent} : ${alternate}`
}

function transformVueIdentifier(name: string): string {
  switch (name) {
    case 'props':
      return 'this.properties'
    case 'emit':
      return 'this.triggerEvent'
    default:
      return name
  }
}
