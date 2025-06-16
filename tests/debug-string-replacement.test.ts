/**
 * 调试字符串替换的问题
 */

import { describe, it, expect } from 'vitest'
import { TemplateTransformer } from '../src/transformer/template-transformer.js'

describe('调试字符串替换', () => {
  it('应该正确处理包含子元素的动态类绑定', () => {
    const transformer = new TemplateTransformer()

    // 模拟字符串替换方案的调用
    const input = `<view class="status" :class="{ online: isOnline }">
      <text class="status-text">{{ isOnline ? '在线' : '离线' }}</text>
    </view>`

    // 直接调用私有方法进行测试（通过类型断言）
    const transformerAny = transformer as any

    // 逐步测试每个转换步骤
    let result = input
    console.log('0. 原始输入:', result)

    // 1. 转换 Vue 组件标签
    result = transformerAny.transformVueComponents(result, { components: new Set() }, { filename: 'test.vue' })
    console.log('1. Vue组件转换后:', result)

    // 2. 转换 Vue 属性绑定
    result = transformerAny.transformVueBindings(result)
    console.log('2. Vue绑定转换后:', result)

    // 3. 转换 Vue 事件绑定
    result = transformerAny.transformVueEvents(result)
    console.log('3. Vue事件转换后:', result)

    // 4. 基本指令替换（跳过，因为没有相关指令）

    // 5. 标签替换
    const tagReplacements = [
      ['<div', '<view'],
      ['</div>', '</view>'],
      ['<span', '<text'],
      ['</span>', '</text>'],
      ['<img', '<image'],
      ['<p', '<text'],
      ['</p>', '</text>']
    ]
    tagReplacements.forEach(([from, to]) => {
      result = result.replace(new RegExp(from as string, 'g'), to as string)
    })
    console.log('4. 标签替换后:', result)

    // 6. v-model 处理（跳过）
    // 7. v-for 处理（跳过）

    // 8. 修复自闭合标签
    result = transformerAny.fixSelfClosingTags(result)
    console.log('5. 修复自闭合标签后:', result)

    // 9. 修复三重花括号
    result = transformerAny.fixTripleBraces(result)
    console.log('6. 修复三重花括号后:', result)

    // 10. 清理空格
    result = transformerAny.cleanupWhitespace(result)
    console.log('7. 清理空格后:', result)

    // 验证结果
    expect(result).not.toMatch(/<view[^>]*\/>[\s\S]*<\/view>/) // 不应该有自闭合的view标签后面跟着结束标签
    expect(result).toMatch(/<view[^>]*>[\s\S]*<text[^>]*>[\s\S]*<\/text>[\s\S]*<\/view>/) // 应该有正确的嵌套结构
  })

  it('应该测试 cleanupWhitespace 的影响', () => {
    const transformer = new TemplateTransformer()
    const transformerAny = transformer as any

    const input = `<view class="status">
      <text>内容</text>
    </view>`

    const result = transformerAny.cleanupWhitespace(input)
    console.log('清理空格后:', result)

    // 验证清理空格不会破坏标签结构
    expect(result).toMatch(/<view[^>]*>\s*<text[^>]*>内容<\/text>\s*<\/view>/)
  })

  it('应该测试实际的 UserCard 模板转换', () => {
    const transformer = new TemplateTransformer()
    const transformerAny = transformer as any

    // 使用实际的 UserCard 模板片段
    const input = `<view class="status" :class="{ online: isOnline }">
        <text class="status-text">{{ isOnline ? '在线' : '离线' }}</text>
      </view>`

    console.log('实际模板输入:', input)

    // 完整的字符串替换流程
    const mockResult = { wxml: '', components: new Set(), eventHandlers: new Map() }
    const mockContext = { filename: 'UserCard.vue' }

    const result = transformerAny.transformByStringReplacement(input, mockResult, mockContext)
    console.log('完整转换结果:', result)

    // 验证结果
    expect(result).not.toMatch(/<view[^>]*\/>[\s\S]*<\/view>/) // 不应该有自闭合的view标签后面跟着结束标签
    expect(result).toMatch(/<view[^>]*>[\s\S]*<text[^>]*>[\s\S]*<\/text>[\s\S]*<\/view>/) // 应该有正确的嵌套结构

    // 检查是否有自闭合的 view 标签
    const selfClosingViews = result.match(/<view[^>]*\/>/g)
    if (selfClosingViews) {
      console.log('发现自闭合的 view 标签:', selfClosingViews)
      expect(selfClosingViews).toHaveLength(0)
    }
  })
})
