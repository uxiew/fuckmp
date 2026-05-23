import { parse } from '@babel/parser'
import { describe, expect, it } from 'vitest'
import {
  extractPropsDefinition,
  generatePropertiesCode,
  transformToMiniprogramProperties
} from '@/transformer/macro-handlers/define-props-utils.js'

function getDefinePropsArgument(source: string): any {
  const ast = parse(source, {
    sourceType: 'module',
    plugins: ['typescript']
  })
  const statement = ast.program.body[0] as any
  return statement.expression.arguments[0]
}

function getDefinePropsTypeParameter(source: string): any {
  const ast = parse(source, {
    sourceType: 'module',
    plugins: ['typescript']
  })
  const statement = ast.program.body[0] as any
  return statement.expression.typeParameters.params[0]
}

describe('define props utils', () => {
  it('解析 runtime object props 定义', () => {
    const arg = getDefinePropsArgument(`defineProps({
      title: String,
      count: { type: Number, default: 3, required: true },
      tags: { type: Array, default: ['vue'] },
      mixed: [String, Number]
    })`)

    const props = extractPropsDefinition(arg)

    expect(props.title).toBe(String)
    expect(props.count).toEqual({
      type: Number,
      default: 3,
      required: true
    })
    expect(props.tags).toEqual({
      type: Array,
      default: ['vue']
    })
    expect(props.mixed).toEqual([String, Number])
  })

  it('解析 TypeScript type literal props 定义', () => {
    const typeParam = getDefinePropsTypeParameter(`defineProps<{
      title: string
      count?: number
      enabled?: boolean
      tags?: string[]
      meta?: { nested: string }
    }>()`)

    const props = extractPropsDefinition(typeParam)

    expect(props.title).toEqual({ type: String, required: true, default: '' })
    expect(props.count).toEqual({ type: Number, required: false, default: 0 })
    expect(props.enabled).toEqual({ type: Boolean, required: false, default: false })
    expect(props.tags).toEqual({ type: Array, required: false, default: [] })
    expect(props.meta).toEqual({ type: Object, required: false, default: {} })
  })

  it('转换为小程序 properties 并生成代码', () => {
    const properties = transformToMiniprogramProperties({
      title: String,
      count: { type: Number, default: 3, required: true },
      tags: { type: [Array, Object], default: ['vue'] },
      fallback: null
    })

    expect(properties.title).toEqual({ type: String, value: '' })
    expect(properties.count).toEqual({ type: Number, value: 3 })
    expect(properties.tags).toEqual({ type: Array, value: ['vue'] })
    expect(properties.fallback).toEqual({ type: String, value: '' })

    expect(generatePropertiesCode(properties)).toContain('title: {\n      type: String,\n      value: ""\n    }')
    expect(generatePropertiesCode(properties)).toContain('count: {\n      type: Number,\n      value: 3\n    }')
  })
})
