/**
 * ObjectLiteralSerializer 回归测试。
 */

import { describe, expect, it } from 'vitest'
import { parse } from '@babel/parser'
import { ObjectLiteralSerializer } from '@/compiler/codegen/object-serializer.js'
import {
  convertArrowFunctionToRegular,
  convertEventHandlerFunction,
  convertObjectMethodArrowFunctions,
  createSerializerPlaceholder,
  deepCloneWithSerializerPlaceholders,
  fixDateExpression,
  isSerializerExpressionString,
  isSerializerFunctionString,
  stringifyObjectLiteral
} from '@/compiler/codegen/object-serializer-utils.js'

describe('ObjectLiteralSerializer', () => {
  it('应该稳定恢复嵌套对象中的多个构造函数占位符', () => {
    const serializer = new ObjectLiteralSerializer()

    const output = serializer.stringifyWithFunctions({
      properties: {
        modelValue: {
          type: 'String',
          value: '访客'
        },
        count: {
          type: 'Number',
          value: 1
        }
      }
    })

    expect(output).toContain('type: String')
    expect(output).toContain('type: Number')
    expect(output).not.toContain('__TYPE_PLACEHOLDER_')
    expect(output).not.toContain('__EXPRESSION_PLACEHOLDER_')
    expect(() => parse(`const options = ${output}`, { sourceType: 'script' })).not.toThrow()
  })

  it('应该生成递增占位符并深拷贝函数、表达式和类型构造函数字符串', () => {
    const placeholders = new Map<string, string>()
    const state = { index: 0 }

    const cloned = deepCloneWithSerializerPlaceholders({
      type: 'String',
      createdAt: 'new Date(2023-01-15)',
      formatter: '(value) => value.trim()',
      nested: [{ enabled: 'true' }]
    }, placeholders, state)

    expect(createSerializerPlaceholder('NEXT', state)).toBe('__NEXT_PLACEHOLDER_4__')
    expect(cloned).toEqual({
      type: '__EXPRESSION_PLACEHOLDER_0__',
      createdAt: '__EXPRESSION_PLACEHOLDER_1__',
      formatter: '__FUNCTION_PLACEHOLDER_2__',
      nested: [{ enabled: '__EXPRESSION_PLACEHOLDER_3__' }]
    })
    expect([...placeholders.entries()]).toEqual([
      ['__EXPRESSION_PLACEHOLDER_0__', 'String'],
      ['__EXPRESSION_PLACEHOLDER_1__', "new Date('2023-01-15')"],
      ['__FUNCTION_PLACEHOLDER_2__', 'function(value) { return value.trim() }'],
      ['__EXPRESSION_PLACEHOLDER_3__', 'true']
    ])
  })

  it('应该判断函数串和表达式串并保持 this 表达式边界', () => {
    expect(isSerializerFunctionString('(event) => { return event.detail }')).toBe(true)
    expect(isSerializerFunctionString('function() { return 1 }')).toBe(true)
    expect(isSerializerFunctionString('{ return count }')).toBe(true)
    expect(isSerializerFunctionString('plain text')).toBe(false)

    expect(isSerializerExpressionString('true')).toBe(true)
    expect(isSerializerExpressionString('42')).toBe(true)
    expect(isSerializerExpressionString('String')).toBe(true)
    expect(isSerializerExpressionString('new Date()')).toBe(true)
    expect(isSerializerExpressionString('{ foo: 1 }')).toBe(true)
    expect(isSerializerExpressionString('this.count')).toBe(false)
  })

  it('应该转换箭头函数、事件 handler 和对象方法箭头函数', () => {
    expect(fixDateExpression('new Date(2023-01-15)')).toBe("new Date('2023-01-15')")
    expect(convertArrowFunctionToRegular('(count) => count + 1')).toBe('function(count) { return count + 1 }')
    expect(convertArrowFunctionToRegular('function(count) { return count + 1 }')).toBe('function(count) { return count + 1 }')

    expect(convertEventHandlerFunction('handleTap', 'function(item) { this.select(item) }')).toBe(`function(event) {
    // 从事件对象的dataset中获取参数
    const item = event.currentTarget.dataset.arg0;
    this.select(item)
  }`)
    expect(convertEventHandlerFunction('formatLabel', 'function(item) { return item.name }')).toBe('function(item) { return item.name }')

    expect(convertObjectMethodArrowFunctions('"inc": (count) => { return count + 1 }')).toBe('"inc": function(count) { return count + 1 }')
  })

  it('应该序列化对象字面量且保留表达式不加引号', () => {
    expect(stringifyObjectLiteral({
      type: 'String',
      value: 'hello',
      enabled: 'true',
      nested: { count: 1 }
    }, 2)).toBe(`{
    type: String,
    value: "hello",
    enabled: true,
    nested: {
      count: 1
    }
  }`)
  })
})
