import { describe, expect, it } from 'vitest'
import { parseScript } from '@/utils/index'
import type { ScriptParseResult } from '@/parser/script-parser'
import {
  createExportInfo,
  createFunctionInfo,
  createImportInfo,
  createVariableInfoFromDeclarator,
  createVueMacroCall
} from '@/parser/script-parser-utils.js'

function astOf(source: string): any {
  return parseScript(source)
}

function firstStatement(source: string): any {
  return astOf(source).program.body[0]
}

function firstVariableDeclarator(source: string): any {
  const statement = firstStatement(source)
  if (statement.type !== 'VariableDeclaration') {
    throw new Error('未找到变量声明')
  }
  return statement.declarations[0]
}

function findCallExpression(source: string): any {
  const declarator = firstVariableDeclarator(source)
  return declarator.init
}

function createParseContext(ast = astOf('const __noop = 1')): ScriptParseResult {
  return {
    ast,
    imports: new Map(),
    macros: new Map(),
    variables: new Map(),
    functions: new Map(),
    exports: []
  }
}

describe('script parser utils', () => {
  it('构造 import 信息并保留 source 分类与 specifier 旧语义', () => {
    const imports = astOf(`
      import Vue, { ref as vueRef, computed } from 'vue'
      import * as Utils from './utils'
      import Card from './Card.vue'
      import './style.scss'
    `).program.body

    const vueImport = createImportInfo(imports[0])
    expect(vueImport).toEqual({
      source: 'vue',
      isVue: true,
      isComponent: false,
      isStyle: false,
      specifiers: [
        { type: 'default', local: 'Vue' },
        { type: 'named', imported: 'ref', local: 'vueRef' },
        { type: 'named', imported: 'computed', local: 'computed' }
      ]
    })

    expect(createImportInfo(imports[1]).specifiers).toEqual([{ type: 'namespace', local: 'Utils' }])
    expect(createImportInfo(imports[2]).isComponent).toBe(true)
    expect(createImportInfo(imports[3]).isStyle).toBe(true)
  })

  it('构造 Vue 宏调用信息并保留参数与位置信息', () => {
    const macro = createVueMacroCall(findCallExpression(`const emit = defineEmits(['save'])`), new Map())

    expect(macro).toMatchObject({
      name: 'defineEmits',
      arguments: [['save']]
    })
    expect(macro?.location).toMatch(/^1:\d+$/)
  })

  it('构造变量信息并保留响应式、宏和普通初始值语义', () => {
    const context = createParseContext()

    expect(createVariableInfoFromDeclarator(firstVariableDeclarator(`const count = ref(0)`), 'const', context)).toEqual({
      name: 'count',
      type: 'const',
      init: 0,
      isReactive: true,
      macroType: 'ref'
    })

    expect(createVariableInfoFromDeclarator(firstVariableDeclarator(`const theme = inject('theme')`), 'const', context)).toEqual({
      name: 'theme',
      type: 'const',
      init: { variable: 'theme', key: 'theme' },
      isReactive: false,
      macroType: 'inject'
    })

    expect(createVariableInfoFromDeclarator(firstVariableDeclarator(`const message = 'hello'`), 'const', context)).toEqual({
      name: 'message',
      type: 'const',
      init: 'hello',
      literalStringInitializer: 'hello',
      isReactive: false
    })
  })

  it('构造 defineProps 解构和 defineModel tuple 变量信息', () => {
    const context = createParseContext()

    expect(createVariableInfoFromDeclarator(
      firstVariableDeclarator(`const { title: localTitle = 'Untitled' } = defineProps()`),
      'const',
      context
    )).toEqual({
      name: '__definePropsDestructure_0',
      type: 'const',
      init: {
        defaults: { title: 'Untitled' },
        aliases: { localTitle: 'title' }
      },
      isReactive: false,
      macroType: 'definePropsDestructure'
    })

    expect(createVariableInfoFromDeclarator(
      firstVariableDeclarator(`const [model] = defineModel('title', { default: 'A' })`),
      'const',
      context
    )).toEqual({
      name: 'model',
      type: 'const',
      init: {
        property: 'title',
        variable: 'model',
        type: 'String',
        default: 'A',
        required: false
      },
      isReactive: false,
      macroType: 'defineModel'
    })
  })

  it('构造函数与导出信息', () => {
    const functionInfo = createFunctionInfo(firstStatement(`async function submit(payload, { detail }) {}`))
    expect(functionInfo).toEqual({
      name: 'submit',
      params: ['payload', 'unknown'],
      isAsync: true,
      isArrow: false
    })

    const exportInfo = createExportInfo(firstStatement(`export default { name: 'Demo' }`), createParseContext(), 'default')
    expect(exportInfo).toEqual({
      type: 'default',
      name: undefined,
      value: { name: 'Demo' }
    })
  })
})
