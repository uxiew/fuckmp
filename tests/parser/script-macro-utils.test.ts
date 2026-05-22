import { describe, expect, it } from 'vitest'
import { parseScript } from '@/utils/index'
import type { CallExpression, ObjectPattern, VariableDeclarator } from '@babel/types'
import {
  extractDefineModelInfo,
  extractDefinePropsDestructureInfo,
  extractUseTemplateRefInfo,
  extractWithDefaultsInfo,
  getArrayPatternFirstIdentifier
} from '@/parser/script-macro-utils'

function variableDeclaratorOf(source: string): VariableDeclarator {
  const ast = parseScript(source)
  const declaration = ast.program.body.find(node => node.type === 'VariableDeclaration')
  if (declaration?.type !== 'VariableDeclaration') {
    throw new Error('未找到变量声明')
  }

  const declarator = declaration.declarations[0]
  if (!declarator) {
    throw new Error('未找到变量声明项')
  }

  return declarator
}

function parseContext(): any {
  return { variables: new Map() }
}

describe('script-macro-utils', () => {
  it('提取 defineProps 响应式解构默认值与别名', () => {
    const declarator = variableDeclaratorOf(`
      const { title = 'Hello', count: total = 1, label } = defineProps<{
        title?: string
        count?: number
        label?: string
      }>()
    `)

    const info = extractDefinePropsDestructureInfo(declarator.id as ObjectPattern, parseContext())

    expect(info).toEqual({
      defaults: {
        title: 'Hello',
        count: 1
      },
      aliases: {
        title: 'title',
        total: 'count',
        label: 'label'
      }
    })
  })

  it('提取 withDefaults 静态默认值和 factory 返回值', () => {
    const declarator = variableDeclaratorOf(`
      const props = withDefaults(defineProps<{ tags: string[]; meta: object; title?: string }>(), {
        tags: () => ['a'],
        meta: () => ({ featured: true }),
        title: 'Hi'
      })
    `)

    const info = extractWithDefaultsInfo(declarator.init as CallExpression, parseContext())

    expect(info).toEqual({
      defaults: {
        tags: ['a'],
        meta: { featured: true },
        title: 'Hi'
      }
    })
  })

  it('提取具名 defineModel 的属性、类型和选项', () => {
    const declarator = variableDeclaratorOf(`
      const [checked] = defineModel<boolean>('checked', { default: true, required: true })
    `)

    const info = extractDefineModelInfo(declarator.init as CallExpression, 'checked', parseContext())

    expect(info).toEqual({
      property: 'checked',
      variable: 'checked',
      type: 'Boolean',
      default: true,
      required: true
    })
  })

  it('读取 defineModel tuple 解构中的第一个标识符', () => {
    const declarator = variableDeclaratorOf(`
      const [modelValue, modifiers] = defineModel<string>()
    `)

    expect(getArrayPatternFirstIdentifier(declarator.id)).toBe('modelValue')
  })

  it('提取 useTemplateRef 字符串 ref key', () => {
    const declarator = variableDeclaratorOf(`const panel = useTemplateRef('panelRef')`)

    const info = extractUseTemplateRefInfo(declarator.init as CallExpression, 'panel', parseContext())

    expect(info).toEqual({
      variable: 'panel',
      ref: 'panelRef'
    })
  })
})
