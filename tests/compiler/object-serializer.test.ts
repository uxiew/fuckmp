/**
 * ObjectLiteralSerializer 回归测试。
 */

import { describe, expect, it } from 'vitest'
import { parse } from '@babel/parser'
import { ObjectLiteralSerializer } from '@/compiler/codegen/object-serializer.js'

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
})
