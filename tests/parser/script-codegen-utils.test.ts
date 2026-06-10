import { describe, expect, it } from 'vitest'
import { parseScript } from '@/utils/index'
import { extractArgumentValue, generateCodeString } from '@/parser/script-codegen-utils'

function expressionOf(source: string): any {
  const ast = parseScript(`const __value = ${source}`)
  const declaration = ast.program.body[0]
  if (declaration?.type !== 'VariableDeclaration') {
    throw new Error('未找到变量声明')
  }
  return declaration.declarations[0]?.init
}

describe('script-codegen-utils', () => {
  it('生成安全的字符串字面量代码', () => {
    const expression = expressionOf(`'it\\'s\\nready'`)

    expect(generateCodeString(expression)).toBe(`'it\\'s\\nready'`)
  })

  it('保留模板字面量和表达式代码', () => {
    const expression = expressionOf('`Hello ${user.name}`')

    expect(generateCodeString(expression)).toBe('`Hello ${user.name}`')
  })

  it('转换 emit 调用为小程序 triggerEvent 调用', () => {
    const expression = expressionOf(`emit('save', payload)`)

    expect(extractArgumentValue(expression)).toBe(`this.triggerEvent('save', payload)`)
  })

  it('在提供响应式变量上下文时转换 value 成员访问', () => {
    const expression = expressionOf('count.value + 1')
    const variables = new Map<string, { isReactive: boolean }>([
      ['count', { isReactive: true }]
    ])

    expect(generateCodeString(expression, variables)).toBe('this.count.value + 1')
  })

  it('生成 new、条件和更新表达式代码', () => {
    expect(generateCodeString(expressionOf(`new Date('2026-05-21')`))).toBe(`new Date('2026-05-21')`)
    expect(generateCodeString(expressionOf('isReady ? count++ : --fallback'))).toBe('isReady ? count++ : --fallback')
  })

  it('提取条件表达式代码时保留字符串字面量引号', () => {
    const expression = expressionOf(`status === 'ok' ? '通过' : '失败'`)

    expect(extractArgumentValue(expression)).toBe(`status === 'ok' ? '通过' : '失败'`)
  })
})
