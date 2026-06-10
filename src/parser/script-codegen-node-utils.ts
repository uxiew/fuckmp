/**
 * Script AST 节点级代码生成工具。
 */

export type ScriptCodegenVariables = Map<string, { isReactive: boolean }>
export type CodegenNodeRenderer<T = string> = (node: any, variables?: ScriptCodegenVariables) => T

/** 生成安全的单引号字符串字面量。 */
export function quoteStringLiteral(value: string): string {
  return `'${value
    .replace(/\\/g, '\\\\')
    .replace(/'/g, "\\'")
    .replace(/\r/g, '\\r')
    .replace(/\n/g, '\\n')
    .replace(/\u2028/g, '\\u2028')
    .replace(/\u2029/g, '\\u2029')}'`
}

/** 转换 Vue 运行时特殊标识符。 */
export function transformVueIdentifier(name: string): string {
  switch (name) {
    case 'props':
      return 'this.properties'
    case 'emit':
      return 'this.triggerEvent'
    default:
      return name
  }
}

/** 生成数组表达式代码。 */
export function generateArrayExpressionCode(
  node: any,
  renderNode: CodegenNodeRenderer,
  variables?: ScriptCodegenVariables
): string {
  const elements = node.elements
    .map((el: any) => el ? renderNode(el, variables) : 'null')
    .join(', ')
  return `[${elements}]`
}

/** 生成对象表达式代码。 */
export function generateObjectExpressionCode(
  node: any,
  renderNode: CodegenNodeRenderer,
  variables?: ScriptCodegenVariables
): string {
  const properties = node.properties
    .map((prop: any) => {
      if (prop.type === 'ObjectProperty') {
        const key = prop.key.type === 'Identifier' ? prop.key.name : renderNode(prop.key, variables)
        const value = renderNode(prop.value, variables)
        return `${key}: ${value}`
      }
      return ''
    })
    .filter(Boolean)
    .join(', ')
  return `{ ${properties} }`
}

/** 提取对象表达式参数值。 */
export function extractObjectExpressionValue(
  node: any,
  extractNode: CodegenNodeRenderer<any>,
  variables?: ScriptCodegenVariables
): Record<string, any> {
  const obj: Record<string, any> = {}
  node.properties.forEach((prop: any) => {
    if (prop.type === 'ObjectProperty') {
      const key = prop.key.type === 'Identifier' ? prop.key.name : prop.key.value
      obj[key] = extractNode(prop.value, variables)
    }
  })
  return obj
}

/** 生成函数参数列表。 */
export function generateFunctionParamsCode(node: any): string {
  return node.params.map((param: any) => {
    if (param.type === 'Identifier') {
      return param.name
    }
    return 'param'
  }).join(', ')
}

/** 生成成员表达式代码。 */
export function generateMemberExpressionCode(
  node: any,
  extractNode: CodegenNodeRenderer<any>,
  variables?: ScriptCodegenVariables
): string {
  const object = extractNode(node.object, variables)
  const property = node.computed
    ? `[${extractNode(node.property, variables)}]`
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

/** 生成二元或逻辑表达式代码。 */
export function generateInfixExpressionCode(
  node: any,
  renderNode: CodegenNodeRenderer,
  variables?: ScriptCodegenVariables
): string {
  const left = renderNode(node.left, variables)
  const right = renderNode(node.right, variables)
  return `${left} ${node.operator} ${right}`
}

/** 生成条件表达式代码。 */
export function generateTernaryExpressionCode(
  node: any,
  renderNode: CodegenNodeRenderer<any>,
  variables?: ScriptCodegenVariables
): string {
  const test = renderNode(node.test, variables)
  const consequent = renderNode(node.consequent, variables)
  const alternate = renderNode(node.alternate, variables)
  return `${test} ? ${consequent} : ${alternate}`
}

/** 生成更新表达式代码。 */
export function generateUpdateExpressionCode(
  node: any,
  renderNode: CodegenNodeRenderer,
  variables?: ScriptCodegenVariables
): string {
  // 移除字符串替换逻辑，保持原始的 Vue 代码
  // 响应式更新现在由运行时代理系统自动处理
  const argument = renderNode(node.argument, variables)
  if (node.prefix) {
    return `${node.operator}${argument}`
  }
  return `${argument}${node.operator}`
}

/** 生成赋值表达式代码。 */
export function generateAssignmentExpressionCode(
  node: any,
  renderNode: CodegenNodeRenderer,
  variables?: ScriptCodegenVariables
): string {
  const left = renderNode(node.left, variables)
  const right = renderNode(node.right, variables)

  // 移除特殊处理逻辑，保持原始的 Vue 代码
  // 响应式变量赋值现在由运行时代理系统自动处理
  return `${left} ${node.operator} ${right}`
}

/** 生成一元表达式代码。 */
export function generateUnaryExpressionCode(
  node: any,
  renderNode: CodegenNodeRenderer,
  variables?: ScriptCodegenVariables
): string {
  const argument = renderNode(node.argument, variables)
  if (node.prefix) {
    return `${node.operator}${argument}`
  }
  return `${argument}${node.operator}`
}

/** 生成 new 表达式代码。 */
export function generateNewExpressionCode(
  node: any,
  renderNode: CodegenNodeRenderer<any>,
  variables?: ScriptCodegenVariables
): string {
  const callee = renderNode(node.callee, variables)
  const args = node.arguments
    .map((arg: any) => renderNode(arg, variables))
    .join(', ')
  return `new ${callee}(${args})`
}

/** 生成模板字面量代码。 */
export function generateTemplateLiteralCode(
  node: any,
  renderNode: CodegenNodeRenderer<any>,
  variables?: ScriptCodegenVariables
): string {
  let result = '`'

  for (let i = 0; i < node.quasis.length; i++) {
    result += node.quasis[i].value.raw

    if (i < node.expressions.length) {
      result += '${' + renderNode(node.expressions[i], variables) + '}'
    }
  }

  result += '`'
  return result
}
