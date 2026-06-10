/**
 * 生命周期宏处理器工具测试。
 */

import { describe, expect, it } from 'vitest'
import {
  extractLifecycleCallback,
  resolveMiniprogramLifecycleHook
} from '@/transformer/macro-handlers/lifecycle-utils'

describe('lifecycle utils', () => {
  it('应该按页面和组件目标解析生命周期 hook', () => {
    expect(resolveMiniprogramLifecycleHook('onMounted', true)).toBe('onReady')
    expect(resolveMiniprogramLifecycleHook('onUnmounted', true)).toBe('onUnload')
    expect(resolveMiniprogramLifecycleHook('onActivated', true)).toBe('onShow')
    expect(resolveMiniprogramLifecycleHook('onMounted', false)).toBe('attached')
    expect(resolveMiniprogramLifecycleHook('onUnmounted', false)).toBe('detached')
    expect(resolveMiniprogramLifecycleHook('onActivated', false)).toBe('pageLifetimes.show')
  })

  it('应该从 AST 函数和标识符中提取生命周期回调', () => {
    expect(extractLifecycleCallback({
      type: 'Identifier',
      name: 'init'
    })).toBe('this.init()')

    expect(extractLifecycleCallback({
      type: 'ArrowFunctionExpression',
      body: {
        type: 'BlockStatement',
        body: [
          {
            type: 'ExpressionStatement',
            expression: {
              type: 'CallExpression',
              callee: {
                type: 'MemberExpression',
                object: { type: 'ThisExpression' },
                property: { type: 'Identifier', name: 'ready' },
                computed: false
              },
              arguments: [{ type: 'StringLiteral', value: 'ok' }]
            }
          }
        ]
      }
    })).toBe('this.ready(\'ok\')')
  })

  it('应该从解析阶段保留的函数字符串中提取回调体', () => {
    expect(extractLifecycleCallback({
      type: 'StringLiteral',
      value: `() => {
        console.log('mounted')
      }`
    })).toBe(`console.log('mounted')`)

    expect(extractLifecycleCallback({
      type: 'StringLiteral',
      value: 'function() { this.cleanup() }'
    })).toBe('this.cleanup()')

    expect(extractLifecycleCallback({
      type: 'StringLiteral',
      value: 'handleMounted'
    })).toBe('this.handleMounted()')
  })

  it('应该转义字符串字面量中会破坏最终 JS 的字符', () => {
    expect(extractLifecycleCallback({
      type: 'ArrowFunctionExpression',
      body: {
        type: 'StringLiteral',
        value: "line1\nline2's"
      }
    })).toBe("'line1\\nline2\\'s'")
  })
})
