import { describe, expect, it } from 'vitest'
import type { ASTNode } from '@/types/ast.js'
import {
  generateListFilter,
  generateListSorter,
  generateVForRuntimeConfig,
  generateWxForCode,
  parseVForExpression,
  validateListExpression
} from '@/plugins/directives/v-for-plugin-utils.js'

const stringLiteral = (value: string): ASTNode => ({ type: 'StringLiteral', value })

describe('v-for plugin utils', () => {
  it('解析基础 in/of v-for 表达式并补默认 index', () => {
    expect(parseVForExpression(stringLiteral('item in items'))).toEqual({
      items: 'items',
      itemName: 'item',
      indexName: 'index'
    })
    expect(parseVForExpression(stringLiteral('  product of products  '))).toEqual({
      items: 'products',
      itemName: 'product',
      indexName: 'index'
    })
  })

  it('解析带索引别名的 v-for 表达式', () => {
    expect(parseVForExpression(stringLiteral('(user, idx) in users'))).toEqual({
      items: 'users',
      itemName: 'user',
      indexName: 'idx'
    })
    expect(parseVForExpression(stringLiteral('(value, key) of userInfo'))).toEqual({
      items: 'userInfo',
      itemName: 'value',
      indexName: 'key'
    })
  })

  it('拒绝非字符串字面量和错误格式表达式', () => {
    expect(parseVForExpression({ type: 'Identifier', name: 'items' } as ASTNode)).toBeNull()
    expect(parseVForExpression(stringLiteral('items'))).toBeNull()
  })

  it('生成 wx:for 属性并保留旧的默认 item/index/key 省略语义', () => {
    expect(generateWxForCode({ items: 'items', itemName: 'item', indexName: 'index' })).toBe(
      'wx:for="{{items}}" wx:key="index"'
    )
    expect(generateWxForCode({ items: 'users', itemName: 'user', indexName: 'idx' })).toBe(
      'wx:for="{{users}}" wx:for-item="user" wx:for-index="idx" wx:key="index"'
    )
    expect(
      generateWxForCode({ items: 'users', itemName: 'user', indexName: 'idx', keyField: 'id' })
    ).toBe('wx:for="{{users}}" wx:for-item="user" wx:for-index="idx" wx:key="id"')
  })

  it('生成列表 runtime config 并保持旧字段结构', () => {
    expect(
      generateVForRuntimeConfig({
        primary: {
          items: 'items',
          itemName: 'item',
          indexName: 'index',
          keyField: 'id',
          template: '<view />'
        }
      })
    ).toEqual({
      type: 'list',
      lists: [
        {
          key: 'primary',
          items: 'items',
          itemName: 'item',
          indexName: 'index',
          keyField: 'id',
          template: '<view />'
        }
      ]
    })
  })

  it('校验列表表达式并生成过滤/排序表达式', () => {
    expect(validateListExpression('items.filter(item => item.visible)')).toBe(true)
    expect(validateListExpression('eval(items)')).toBe(false)
    expect(validateListExpression('window.items')).toBe(false)

    expect(generateListFilter('items')).toBe('items')
    expect(generateListFilter('items', 'item => item.visible')).toBe(
      'items.filter(item => item.visible)'
    )
    expect(generateListSorter('items')).toBe('items')
    expect(generateListSorter('items', '(a, b) => a.order - b.order')).toBe(
      'items.sort((a, b) => a.order - b.order)'
    )
  })
})
