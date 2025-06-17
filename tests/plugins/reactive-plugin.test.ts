/**
 * 响应式插件测试
 */

import { describe, it, expect, beforeEach } from 'vitest'
import { ReactivePlugin } from '@/plugins/core/reactive-plugin'
import { ASTNode } from '@/types/ast'
import { TransformContext } from '@/types/transform'

describe('ReactivePlugin', () => {
  let plugin: ReactivePlugin
  let context: TransformContext

  beforeEach(() => {
    plugin = new ReactivePlugin()
    context = {
      filename: 'test.vue',
      isPage: false,
      data: {},
      methods: {},
      computed: {},
      lifecycle: {},
      watch: {},
      props: {},
      emits: [],
      imports: new Set(),
      components: new Map(),
      hasScoped: false,
      currentElement: null,
      pluginContext: {
        transformedNodes: new Set(),
        generatedMethods: new Set(),
        dependencies: new Map()
      }
    }
  })

  describe('插件基本信息', () => {
    it('应该有正确的插件信息', () => {
      expect(plugin.name).toBe('reactive-plugin')
      expect(plugin.version).toBe('1.0.0')
      expect(plugin.priority).toBe(100)
      expect(plugin.supportedVueVersions).toContain('3.x')
    })
  })

  describe('节点支持检查', () => {
    it('应该支持 ref 调用', () => {
      const node: ASTNode = {
        type: 'CallExpression',
        callee: { type: 'Identifier', name: 'ref' },
        arguments: [{ type: 'NumericLiteral', value: 0 }]
      }

      expect(plugin.supports(node, context)).toBe(true)
    })

    it('应该支持 reactive 调用', () => {
      const node: ASTNode = {
        type: 'CallExpression',
        callee: { type: 'Identifier', name: 'reactive' },
        arguments: [{ type: 'ObjectExpression', properties: [] }]
      }

      expect(plugin.supports(node, context)).toBe(true)
    })

    it('应该支持 computed 调用', () => {
      const node: ASTNode = {
        type: 'CallExpression',
        callee: { type: 'Identifier', name: 'computed' },
        arguments: [{ type: 'ArrowFunctionExpression', params: [], body: {} }]
      }

      expect(plugin.supports(node, context)).toBe(true)
    })

    it('不应该支持其他类型的节点', () => {
      const node: ASTNode = {
        type: 'Identifier',
        name: 'someVariable'
      }

      expect(plugin.supports(node, context)).toBe(false)
    })
  })

  describe('ref 转换', () => {
    it('应该正确转换简单的 ref', async () => {
      const node: ASTNode = {
        type: 'CallExpression',
        callee: { type: 'Identifier', name: 'ref' },
        arguments: [{ type: 'NumericLiteral', value: 42 }]
      }

      const result = await plugin.transform(node, context)

      expect(result.handled).toBe(true)
      expect(result.code).toBe('42')
      expect(result.errors).toHaveLength(0)
    })

    it('应该正确转换字符串 ref', async () => {
      const node: ASTNode = {
        type: 'CallExpression',
        callee: { type: 'Identifier', name: 'ref' },
        arguments: [{ type: 'StringLiteral', value: 'hello' }]
      }

      const result = await plugin.transform(node, context)

      expect(result.handled).toBe(true)
      expect(result.code).toBe('"hello"')
    })

    it('应该处理无参数的 ref', async () => {
      const node: ASTNode = {
        type: 'CallExpression',
        callee: { type: 'Identifier', name: 'ref' },
        arguments: []
      }

      const result = await plugin.transform(node, context)

      expect(result.handled).toBe(true)
      expect(result.code).toBe('null')
    })
  })

  describe('reactive 转换', () => {
    it('应该正确转换 reactive 对象', async () => {
      const node: ASTNode = {
        type: 'CallExpression',
        callee: { type: 'Identifier', name: 'reactive' },
        arguments: [{
          type: 'ObjectExpression',
          properties: [
            {
              type: 'ObjectProperty',
              key: { type: 'Identifier', name: 'name' },
              value: { type: 'StringLiteral', value: 'John' },
              computed: false,
              shorthand: false
            },
            {
              type: 'ObjectProperty',
              key: { type: 'Identifier', name: 'age' },
              value: { type: 'NumericLiteral', value: 25 },
              computed: false,
              shorthand: false
            }
          ]
        }]
      }

      const result = await plugin.transform(node, context)

      expect(result.handled).toBe(true)
      expect(result.code).toBe('{"name":"John","age":25}')
      expect(result.errors).toHaveLength(0)
    })

    it('应该处理空的 reactive 对象', async () => {
      const node: ASTNode = {
        type: 'CallExpression',
        callee: { type: 'Identifier', name: 'reactive' },
        arguments: [{
          type: 'ObjectExpression',
          properties: []
        }]
      }

      const result = await plugin.transform(node, context)

      expect(result.handled).toBe(true)
      expect(result.code).toBe('{}')
    })

    it('应该报错当 reactive 无参数时', async () => {
      const node: ASTNode = {
        type: 'CallExpression',
        callee: { type: 'Identifier', name: 'reactive' },
        arguments: []
      }

      const result = await plugin.transform(node, context)

      expect(result.handled).toBe(false)
      expect(result.errors).toContain('reactive() 需要一个参数')
    })

    it('应该警告当 reactive 参数不是对象时', async () => {
      const node: ASTNode = {
        type: 'CallExpression',
        callee: { type: 'Identifier', name: 'reactive' },
        arguments: [{ type: 'StringLiteral', value: 'not an object' }]
      }

      const result = await plugin.transform(node, context)

      expect(result.handled).toBe(true)
      expect(result.warnings).toContain('reactive() 参数应该是一个对象')
    })
  })

  describe('computed 转换', () => {
    it('应该正确转换 computed 属性', async () => {
      const node: ASTNode = {
        type: 'CallExpression',
        callee: { type: 'Identifier', name: 'computed' },
        arguments: [{
          type: 'ArrowFunctionExpression',
          params: [],
          body: {
            type: 'BinaryExpression',
            left: { type: 'Identifier', name: 'count' },
            right: { type: 'NumericLiteral', value: 2 },
            operator: '*'
          },
          async: false,
          expression: true
        }]
      }

      const result = await plugin.transform(node, context)

      expect(result.handled).toBe(true)
      expect(result.code).toContain('function()')
      expect(result.errors).toHaveLength(0)
    })

    it('应该报错当 computed 无参数时', async () => {
      const node: ASTNode = {
        type: 'CallExpression',
        callee: { type: 'Identifier', name: 'computed' },
        arguments: []
      }

      const result = await plugin.transform(node, context)

      expect(result.handled).toBe(false)
      expect(result.errors).toContain('computed() 需要一个getter函数')
    })

    it('应该报错当 computed 参数不是函数时', async () => {
      const node: ASTNode = {
        type: 'CallExpression',
        callee: { type: 'Identifier', name: 'computed' },
        arguments: [{ type: 'StringLiteral', value: 'not a function' }]
      }

      const result = await plugin.transform(node, context)

      expect(result.handled).toBe(false)
      expect(result.errors).toContain('computed() 参数必须是一个函数')
    })
  })

  describe('复杂数据结构', () => {
    it('应该正确处理嵌套对象', async () => {
      const node: ASTNode = {
        type: 'CallExpression',
        callee: { type: 'Identifier', name: 'reactive' },
        arguments: [{
          type: 'ObjectExpression',
          properties: [
            {
              type: 'ObjectProperty',
              key: { type: 'Identifier', name: 'user' },
              value: {
                type: 'ObjectExpression',
                properties: [
                  {
                    type: 'ObjectProperty',
                    key: { type: 'Identifier', name: 'name' },
                    value: { type: 'StringLiteral', value: 'John' },
                    computed: false,
                    shorthand: false
                  }
                ]
              },
              computed: false,
              shorthand: false
            }
          ]
        }]
      }

      const result = await plugin.transform(node, context)

      expect(result.handled).toBe(true)
      expect(result.code).toBe('{"user":{"name":"John"}}')
    })

    it('应该正确处理数组', async () => {
      const node: ASTNode = {
        type: 'CallExpression',
        callee: { type: 'Identifier', name: 'reactive' },
        arguments: [{
          type: 'ObjectExpression',
          properties: [
            {
              type: 'ObjectProperty',
              key: { type: 'Identifier', name: 'items' },
              value: {
                type: 'ArrayExpression',
                elements: [
                  { type: 'StringLiteral', value: 'item1' },
                  { type: 'StringLiteral', value: 'item2' }
                ]
              },
              computed: false,
              shorthand: false
            }
          ]
        }]
      }

      const result = await plugin.transform(node, context)

      expect(result.handled).toBe(true)
      expect(result.code).toBe('{"items":["item1","item2"]}')
    })
  })
})
