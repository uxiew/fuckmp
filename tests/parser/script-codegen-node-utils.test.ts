import { describe, expect, it } from 'vitest'
import { parseScript } from '@/utils/index'
import {
  generateArrayExpressionCode,
  generateObjectExpressionCode,
  generateTemplateLiteralCode,
  quoteStringLiteral,
  transformVueIdentifier
} from '@/parser/script-codegen-node-utils.js'

function expressionOf(source: string): any {
  const ast = parseScript(`const __value = ${source}`)
  const declaration = ast.program.body[0]
  if (declaration?.type !== 'VariableDeclaration') {
    throw new Error('未找到变量声明')
  }
  return declaration.declarations[0]?.init
}

function expressionCode(node: any): string {
  switch (node.type) {
    case 'StringLiteral':
      return quoteStringLiteral(node.value)
    case 'NumericLiteral':
      return String(node.value)
    case 'Identifier':
      return node.name
    default:
      return `[${node.type}]`
  }
}

describe('script codegen node utils', () => {
  it('保持字符串字面量转义和 Vue 标识符映射旧语义', () => {
    expect(quoteStringLiteral("it's\nready\u2028")).toBe("'it\\'s\\nready\\u2028'")
    expect(transformVueIdentifier('props')).toBe('this.properties')
    expect(transformVueIdentifier('emit')).toBe('this.triggerEvent')
    expect(transformVueIdentifier('count')).toBe('count')
  })

  it('生成数组和对象表达式片段', () => {
    expect(generateArrayExpressionCode(expressionOf(`[1, , 'x']`), expressionCode)).toBe(`[1, null, 'x']`)
    expect(generateObjectExpressionCode(expressionOf(`({ a: 1, 'b-c': value })`), expressionCode)).toBe(
      `{ a: 1, 'b-c': value }`
    )
  })

  it('生成模板字面量片段', () => {
    const template = expressionOf('`Hello ${user}`')

    expect(generateTemplateLiteralCode(template, expressionCode)).toBe('`Hello ${user}`')
  })
})
