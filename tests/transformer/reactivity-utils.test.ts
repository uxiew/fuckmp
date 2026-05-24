import { describe, expect, it } from 'vitest'
import {
  extractReactivityDependencies,
  extractReactivityFunctionBody,
  extractReactivityLiteralValue,
  generateReactivityExpressionCode,
  generateReactivityStatementCode,
  getReactivityPropertyKey
} from '@/transformer/macro-handlers/reactivity-utils.js'

describe('reactivity-utils', () => {
  it('提取响应式宏字面量并保留 Identifier 模板占位旧语义', () => {
    expect(extractReactivityLiteralValue({ type: 'StringLiteral', value: 'hello' })).toBe('hello')
    expect(extractReactivityLiteralValue({ type: 'NumericLiteral', value: 3 })).toBe(3)
    expect(extractReactivityLiteralValue({ type: 'BooleanLiteral', value: false })).toBe(false)
    expect(extractReactivityLiteralValue({ type: 'NullLiteral' })).toBeNull()
    expect(extractReactivityLiteralValue({ type: 'Identifier', name: 'count' })).toBe('{{count}}')
    expect(extractReactivityLiteralValue({
      type: 'ArrayExpression',
      elements: [
        { type: 'StringLiteral', value: 'a' },
        null,
        { type: 'Identifier', name: 'count' }
      ]
    })).toEqual(['a', null, '{{count}}'])
    expect(extractReactivityLiteralValue({
      type: 'ObjectExpression',
      properties: [{
        type: 'ObjectProperty',
        key: { type: 'Identifier', name: 'active' },
        value: { type: 'BooleanLiteral', value: true }
      }, {
        type: 'ObjectProperty',
        key: { type: 'StringLiteral', value: 'label' },
        value: { type: 'StringLiteral', value: 'ok' }
      }]
    })).toEqual({ active: true, label: 'ok' })
  })

  it('提取 property key 时保留未知 key fallback', () => {
    expect(getReactivityPropertyKey({ type: 'Identifier', name: 'get' })).toBe('get')
    expect(getReactivityPropertyKey({ type: 'StringLiteral', value: 'set' })).toBe('set')
    expect(getReactivityPropertyKey({ type: 'NumericLiteral', value: 1 })).toBe('unknown')
  })

  it('生成响应式表达式代码时保留 this.data 前缀和旧 fallback', () => {
    expect(generateReactivityExpressionCode({ type: 'Identifier', name: 'count' })).toBe('this.data.count')
    expect(generateReactivityExpressionCode({
      type: 'MemberExpression',
      object: { type: 'Identifier', name: 'user' },
      property: { type: 'Identifier', name: 'name' },
      computed: false
    })).toBe('this.data.user.name')
    expect(generateReactivityExpressionCode({
      type: 'BinaryExpression',
      operator: '+',
      left: { type: 'Identifier', name: 'count' },
      right: { type: 'NumericLiteral', value: 1 }
    })).toBe('this.data.count + 1')
    expect(generateReactivityExpressionCode({
      type: 'CallExpression',
      callee: { type: 'Identifier', name: 'format' },
      arguments: [
        { type: 'Identifier', name: 'count' },
        { type: 'StringLiteral', value: 'px' }
      ]
    })).toBe("this.data.format(this.data.count, 'px')")
    expect(generateReactivityExpressionCode({ type: 'RegExpLiteral', pattern: 'x' })).toBe('/* 未支持的表达式 */')
  })

  it('生成响应式函数体与语句代码', () => {
    expect(generateReactivityStatementCode({
      type: 'ReturnStatement',
      argument: {
        type: 'BinaryExpression',
        operator: '+',
        left: { type: 'Identifier', name: 'count' },
        right: { type: 'NumericLiteral', value: 1 }
      }
    })).toBe('return this.data.count + 1')
    expect(generateReactivityStatementCode({ type: 'IfStatement' })).toBe('// 未支持的语句类型')
    expect(extractReactivityFunctionBody({
      body: {
        type: 'BlockStatement',
        body: [{
          type: 'ReturnStatement',
          argument: { type: 'Identifier', name: 'count' }
        }]
      }
    })).toBe('return this.data.count')
    expect(extractReactivityFunctionBody({
      body: {
        type: 'BinaryExpression',
        operator: '*',
        left: { type: 'Identifier', name: 'count' },
        right: { type: 'NumericLiteral', value: 2 }
      }
    })).toBe('return this.data.count * 2')
  })

  it('按旧逻辑从函数体中提取 Identifier 依赖', () => {
    expect(extractReactivityDependencies({
      body: {
        type: 'BinaryExpression',
        operator: '+',
        left: {
          type: 'MemberExpression',
          object: { type: 'Identifier', name: 'state' },
          property: { type: 'Identifier', name: 'total' },
          computed: false
        },
        right: { type: 'Identifier', name: 'count' }
      }
    })).toEqual(['state', 'total', 'count'])
  })
})
