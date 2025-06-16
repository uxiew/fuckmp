/**
 * 模板转换器单元测试
 */

import { describe, it, expect, beforeEach } from 'vitest'
import { TemplateTransformer } from '../src/transformer/template-transformer.js'
import { CompilerOptions, TransformContext } from '../src/types/index.js'
import { TemplateParser } from '../src/parser/index.js'

describe('TemplateTransformer', () => {
  let transformer: TemplateTransformer
  let parser: TemplateParser
  let options: CompilerOptions
  let context: TransformContext

  beforeEach(() => {
    options = {
      framework: 'vue3',
      appId: 'test-app',
      inputDir: 'test-input',
      outputDir: 'test-output',
      features: {
        scriptSetup: true,
        scss: true,
        typescript: true,
        compositionApi: true,
        emits: true,
        slots: true,
        provide: true
      },
      optimizations: {
        treeshaking: true,
        sourcemap: true,
        incremental: true
      }
    }
    transformer = new TemplateTransformer()
    parser = new TemplateParser(options)
    context = {
      filename: 'test.vue',
      options,
      components: new Map(),
      imports: new Map(),
      exports: new Map(),
      dependencies: new Set(),
      errors: [],
      warnings: []
    }
  })

  // 辅助函数：转换模板
  async function transformTemplate(template: string, filename = 'test.vue'): Promise<string> {
    const parseResult = await parser.parseTemplate(template, filename)
    const result = await transformer.transformTemplate(parseResult, { ...context, filename })
    return result.wxml
  }

  describe('动态类绑定转换', () => {
    it('应该正确处理同时存在静态 class 和动态 :class 的情况', async () => {
      const input = `<view class="status" :class="{ online: isOnline }">
        <text>内容</text>
      </view>`

      const wxml = await transformTemplate(input)

      // 验证生成的 WXML 不应该有重复的 class 属性
      expect(wxml).not.toMatch(/class="[^"]*"\s+class="[^"]*"/)

      // 验证动态类绑定被正确转换
      expect(wxml).toMatch(/class="\{\{'status' \+ ' ' \+ \(\(isOnline \? 'online' : ''\)\.trim\(\)\)\}\}"/)

      // 验证标签结构保持完整
      expect(wxml).toMatch(/<view[^>]*>[\s\S]*<text[^>]*>内容<\/text>[\s\S]*<\/view>/)
    })

    it('应该正确处理只有动态 :class 的情况', async () => {
      const input = `<view :class="{ active: isActive }">
        <text>内容</text>
      </view>`

      const wxml = await transformTemplate(input)

      // 验证动态类绑定被正确转换
      expect(wxml).toMatch(/class="\{\{\(isActive \? 'active' : ''\)\.trim\(\)\}\}"/)

      // 验证标签结构保持完整
      expect(wxml).toMatch(/<view[^>]*>[\s\S]*<text[^>]*>内容<\/text>[\s\S]*<\/view>/)
    })

    it('应该正确处理多个动态类条件', async () => {
      const input = `<view class="base" :class="{ active: isActive, disabled: isDisabled }">
        <text>内容</text>
      </view>`

      const wxml = await transformTemplate(input)

      // 验证多个条件被正确处理
      expect(wxml).toMatch(/isActive \? 'active' : ''/)
      expect(wxml).toMatch(/isDisabled \? 'disabled' : ''/)

      // 验证标签结构保持完整
      expect(wxml).toMatch(/<view[^>]*>[\s\S]*<text[^>]*>内容<\/text>[\s\S]*<\/view>/)
    })
  })

  describe('标签结构完整性', () => {
    it('应该保持包含子元素的标签为非自闭合形式', async () => {
      const input = `<view class="container">
        <text class="title">标题</text>
        <view class="content">
          <text>内容</text>
        </view>
      </view>`

      const wxml = await transformTemplate(input)

      // 验证所有包含子元素的标签都不是自闭合的
      expect(wxml).not.toMatch(/<view[^>]*\/>[\s\S]*<\/view>/)
      expect(wxml).not.toMatch(/<text[^>]*\/>[\s\S]*<\/text>/)

      // 验证标签正确配对
      const viewOpenTags = (wxml.match(/<view[^>]*>/g) || []).length
      const viewCloseTags = (wxml.match(/<\/view>/g) || []).length
      expect(viewOpenTags).toBe(viewCloseTags)

      const textOpenTags = (wxml.match(/<text[^>]*>/g) || []).length
      const textCloseTags = (wxml.match(/<\/text>/g) || []).length
      expect(textOpenTags).toBe(textCloseTags)
    })

    it('应该正确处理真正的自闭合标签', async () => {
      const input = `<view class="container">
        <image src="test.jpg" />
        <input type="text" />
      </view>`

      const wxml = await transformTemplate(input)

      // 验证自闭合标签保持自闭合
      expect(wxml).toMatch(/<image[^>]*\/>/)
      expect(wxml).toMatch(/<input[^>]*\/>/)

      // 验证容器标签正确配对
      expect(wxml).toMatch(/<view[^>]*>[\s\S]*<\/view>/)
    })
  })

  describe('复杂场景测试', () => {
    it('应该正确处理 UserCard 组件的复杂结构', async () => {
      const input = `<view class="user-card">
        <view class="card-header">
          <image src="{{user.avatar}}" class="avatar" />
          <view class="user-info">
            <text class="name">{{ user.name }}</text>
            <text class="email">{{ user.email }}</text>
          </view>
          <view class="status" :class="{ online: isOnline }">
            <text class="status-text">{{ isOnline ? '在线' : '离线' }}</text>
          </view>
        </view>
      </view>`

      const wxml = await transformTemplate(input, 'UserCard.vue')

      // 验证动态类绑定正确转换
      expect(wxml).toMatch(/class="\{\{'status' \+ ' ' \+ \(\(isOnline \? 'online' : ''\)\.trim\(\)\)\}\}"/)

      // 验证 status view 标签包含 text 子元素
      expect(wxml).toMatch(/<view[^>]*class="\{\{'status'[^>]*>[\s\S]*<text[^>]*class="status-text"[^>]*>[\s\S]*<\/text>[\s\S]*<\/view>/)

      // 验证没有重复的 class 属性
      expect(wxml).not.toMatch(/class="[^"]*"\s+class="[^"]*"/)

      // 验证所有标签正确配对
      const allOpenTags = (wxml.match(/<(view|text)[^>]*>/g) || []).length
      const allCloseTags = (wxml.match(/<\/(view|text)>/g) || []).length

      expect(allOpenTags).toBe(allCloseTags)
    })
  })
})
