import { parse } from '@babel/parser'
import { describe, expect, it } from 'vitest'
import {
  extractTypeScriptProps,
  getDefaultValueForType,
  mapTypeScriptTypeToConstructor
} from '@/transformer/macro-handlers/define-props-type-utils.js'

function getDefinePropsTypeParameter(source: string): any {
  const ast = parse(source, {
    sourceType: 'module',
    plugins: ['typescript']
  })
  const statement = ast.program.body[0] as any
  return statement.expression.typeParameters.params[0]
}

function getInterfaceDeclaration(source: string): any {
  const ast = parse(source, {
    sourceType: 'module',
    plugins: ['typescript']
  })
  return ast.program.body[0]
}

function getPropertyTypeAnnotation(source: string): any {
  const typeLiteral = getDefinePropsTypeParameter(source)
  return typeLiteral.members[0].typeAnnotation.typeAnnotation
}

describe('define props type utils', () => {
  it('从 TypeScript type literal 提取 props 定义', () => {
    const typeParam = getDefinePropsTypeParameter(`defineProps<{
      title: string
      count?: number
      enabled?: boolean
      tags?: string[]
      meta?: { nested: string }
    }>()`)

    const props = extractTypeScriptProps(typeParam)

    expect(props.title).toEqual({ type: String, required: true, default: '' })
    expect(props.count).toEqual({ type: Number, required: false, default: 0 })
    expect(props.enabled).toEqual({ type: Boolean, required: false, default: false })
    expect(props.tags).toEqual({ type: Array, required: false, default: [] })
    expect(props.meta).toEqual({ type: Object, required: false, default: {} })
  })

  it('从 interface declaration 提取 props 定义', () => {
    const declaration = getInterfaceDeclaration(`interface Props {
      title: string
      total?: number
    }`)

    const props = extractTypeScriptProps(declaration)

    expect(props.title).toEqual({ type: String, required: true, default: '' })
    expect(props.total).toEqual({ type: Number, required: false, default: 0 })
  })

  it('按现有宽松策略映射 TypeScript 类型和默认值', () => {
    const unionType = getPropertyTypeAnnotation(`defineProps<{
      value?: number | string
    }>()`)
    const referenceType = getPropertyTypeAnnotation(`defineProps<{
      meta?: Record<string, unknown>
    }>()`)
    const unknownType = { type: 'TSNeverKeyword' }

    expect(mapTypeScriptTypeToConstructor(unionType)).toBe(Number)
    expect(getDefaultValueForType(unionType)).toBe(0)
    expect(mapTypeScriptTypeToConstructor(referenceType)).toBe(Object)
    expect(getDefaultValueForType(referenceType)).toEqual({})
    expect(mapTypeScriptTypeToConstructor(unknownType)).toBe(String)
    expect(getDefaultValueForType(unknownType)).toBe('')
  })

  it('未解析的顶层类型引用保持空 props 定义', () => {
    const typeParam = getDefinePropsTypeParameter('defineProps<Props>()')

    expect(extractTypeScriptProps(typeParam)).toEqual({})
  })
})
