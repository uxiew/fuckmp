/**
 * 提取响应式宏中的字面量值。
 */
export function extractReactivityLiteralValue(node: any): any {
  switch (node.type) {
    case 'StringLiteral':
      return node.value
    case 'NumericLiteral':
      return node.value
    case 'BooleanLiteral':
      return node.value
    case 'NullLiteral':
      return null
    case 'ArrayExpression':
      return node.elements.map((el: any) => el ? extractReactivityLiteralValue(el) : null)
    case 'ObjectExpression': {
      const obj: Record<string, any> = {}
      node.properties.forEach((prop: any) => {
        if (prop.type === 'ObjectProperty') {
          const key = getReactivityPropertyKey(prop.key)
          obj[key] = extractReactivityLiteralValue(prop.value)
        }
      })
      return obj
    }
    case 'Identifier':
      return `{{${node.name}}}`
    default:
      return null
  }
}

/**
 * 获取响应式宏对象属性键名。
 */
export function getReactivityPropertyKey(keyNode: any): string {
  if (keyNode.type === 'Identifier') {
    return keyNode.name
  } else if (keyNode.type === 'StringLiteral') {
    return keyNode.value
  }
  return 'unknown'
}

/**
 * 提取响应式宏中的函数体代码。
 */
export function extractReactivityFunctionBody(funcNode: any): string {
  if (funcNode.body.type === 'BlockStatement') {
    return funcNode.body.body
      .map((stmt: any) => generateReactivityStatementCode(stmt))
      .join('\n')
  }

  return `return ${generateReactivityExpressionCode(funcNode.body)}`
}

/**
 * 按旧逻辑提取响应式计算属性依赖。
 */
export function extractReactivityDependencies(funcNode: any): string[] {
  const dependencies: Set<string> = new Set()

  traverseReactivityNode(funcNode.body, (node: any) => {
    if (node.type === 'Identifier' && node.name !== 'this') {
      dependencies.add(node.name)
    }
  })

  return Array.from(dependencies)
}

/**
 * 生成响应式宏语句代码。
 */
export function generateReactivityStatementCode(stmt: any): string {
  switch (stmt.type) {
    case 'ReturnStatement':
      return `return ${generateReactivityExpressionCode(stmt.argument)}`
    case 'ExpressionStatement':
      return generateReactivityExpressionCode(stmt.expression)
    default:
      return '// 未支持的语句类型'
  }
}

/**
 * 生成响应式宏表达式代码。
 */
export function generateReactivityExpressionCode(expr: any): string {
  if (!expr) return ''

  switch (expr.type) {
    case 'Identifier':
      return `this.data.${expr.name}`
    case 'MemberExpression': {
      const object = generateReactivityExpressionCode(expr.object)
      const property = expr.computed
        ? `[${generateReactivityExpressionCode(expr.property)}]`
        : `.${expr.property.name}`
      return `${object}${property}`
    }
    case 'BinaryExpression': {
      const left = generateReactivityExpressionCode(expr.left)
      const right = generateReactivityExpressionCode(expr.right)
      return `${left} ${expr.operator} ${right}`
    }
    case 'CallExpression': {
      const callee = generateReactivityExpressionCode(expr.callee)
      const args = expr.arguments.map((arg: any) => generateReactivityExpressionCode(arg)).join(', ')
      return `${callee}(${args})`
    }
    case 'StringLiteral':
      return `'${expr.value}'`
    case 'NumericLiteral':
      return expr.value.toString()
    case 'BooleanLiteral':
      return expr.value.toString()
    case 'ObjectExpression': {
      const properties = expr.properties.map((prop: any) => {
        if (prop.type === 'ObjectProperty') {
          const key = prop.key.type === 'Identifier' ? prop.key.name : generateReactivityExpressionCode(prop.key)
          const value = generateReactivityExpressionCode(prop.value)
          return `${key}: ${value}`
        }
        return ''
      }).filter(Boolean)
      return `{ ${properties.join(', ')} }`
    }
    case 'ArrayExpression': {
      const elements = expr.elements.map((el: any) => el ? generateReactivityExpressionCode(el) : 'null')
      return `[${elements.join(', ')}]`
    }
    default:
      return '/* 未支持的表达式 */'
  }
}

/**
 * 深度遍历响应式宏 AST 节点。
 */
function traverseReactivityNode(node: any, visitor: (node: any) => void): void {
  if (!node || typeof node !== 'object') return

  visitor(node)

  Object.values(node).forEach(value => {
    if (Array.isArray(value)) {
      value.forEach(item => traverseReactivityNode(item, visitor))
    } else if (value && typeof value === 'object') {
      traverseReactivityNode(value, visitor)
    }
  })
}
