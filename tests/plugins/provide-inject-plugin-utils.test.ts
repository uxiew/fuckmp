/**
 * provide/inject 插件纯函数工具测试。
 */

import { describe, expect, it } from 'vitest'
import {
  createDependencyInjectionRuntimeConfig,
  extractProvideInjectKey,
  extractProvideInjectRequired,
  extractProvideInjectValue,
  generateInjectRuntimeCode,
  generateInjectVariableName,
  generateProvideRuntimeCode
} from '@/plugins/composition/provide-inject-plugin-utils'

describe('provide-inject-plugin utils', () => {
  it('应该提取字符串、标识符和 Symbol key', () => {
    expect(extractProvideInjectKey({ type: 'StringLiteral', value: 'theme' } as any)).toBe('theme')
    expect(extractProvideInjectKey({ type: 'Identifier', name: 'ThemeKey' } as any)).toBe('ThemeKey')
    expect(extractProvideInjectKey({
      type: 'CallExpression',
      callee: { type: 'Identifier', name: 'Symbol' },
      arguments: [{ type: 'StringLiteral', value: 'theme' }]
    } as any)).toBe('Symbol(theme)')
    expect(extractProvideInjectKey({
      type: 'CallExpression',
      callee: { type: 'Identifier', name: 'Symbol' },
      arguments: []
    } as any)).toBe('Symbol()')
  })

  it('应该递归提取 provide/inject 值', () => {
    const value = extractProvideInjectValue({
      type: 'ObjectExpression',
      properties: [
        {
          type: 'ObjectProperty',
          key: { type: 'Identifier', name: 'mode' },
          value: { type: 'StringLiteral', value: 'dark' }
        },
        {
          type: 'ObjectProperty',
          key: { type: 'StringLiteral', value: 'count' },
          value: { type: 'NumericLiteral', value: 2 }
        },
        {
          type: 'ObjectProperty',
          key: { type: 'Identifier', name: 'enabled' },
          value: { type: 'BooleanLiteral', value: true }
        },
        {
          type: 'ObjectProperty',
          key: { type: 'Identifier', name: 'items' },
          value: {
            type: 'ArrayExpression',
            elements: [
              { type: 'StringLiteral', value: 'a' },
              null,
              { type: 'NumericLiteral', value: 3 }
            ]
          }
        },
        {
          type: 'ObjectProperty',
          key: { type: 'Identifier', name: 'state' },
          value: {
            type: 'CallExpression',
            callee: { type: 'Identifier', name: 'ref' },
            arguments: [{ type: 'StringLiteral', value: 'ready' }]
          }
        },
        {
          type: 'ObjectProperty',
          key: { type: 'Identifier', name: 'currentTheme' },
          value: { type: 'Identifier', name: 'theme' }
        }
      ]
    } as any)

    expect(value).toEqual({
      mode: 'dark',
      count: 2,
      enabled: true,
      items: ['a', null, 3],
      state: 'ready',
      currentTheme: '{{theme}}'
    })
  })

  it('应该生成 inject required、变量名和运行时代码', () => {
    expect(extractProvideInjectRequired({ type: 'BooleanLiteral', value: true } as any)).toBe(true)
    expect(extractProvideInjectRequired({ type: 'StringLiteral', value: 'true' } as any)).toBe(false)
    expect(generateInjectVariableName('theme.key')).toBe('theme_key')
    expect(generateInjectVariableName('1theme')).toBe('_1theme')
    expect(generateProvideRuntimeCode('theme', { mode: 'dark' })).toBe('this._provide(\'theme\', {"mode":"dark"})')
    expect(generateInjectRuntimeCode('theme', 'theme', 'light')).toBe('this.data.theme = this._inject(\'theme\', "light")')
    expect(generateInjectRuntimeCode('theme', 'theme')).toBe('this.data.theme = this._inject(\'theme\', undefined)')
  })

  it('应该生成依赖注入 runtime config', () => {
    expect(createDependencyInjectionRuntimeConfig({
      providers: {
        theme: { value: 'dark', reactive: false }
      },
      injectors: {
        theme: { key: 'theme', defaultValue: 'light', required: true }
      }
    })).toEqual({
      type: 'dependency-injection',
      providers: [{ key: 'theme', value: 'dark', reactive: false }],
      injectors: [{ variableName: 'theme', key: 'theme', defaultValue: 'light', required: true }]
    })
  })
})
