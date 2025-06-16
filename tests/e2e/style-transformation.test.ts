/**
 * 样式转换 - 端到端测试
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { Vue3MiniprogramCompiler } from '@/compiler/compiler.js'
import { createTestFile, removeTestFile, getTestDir, readTestFile } from '../setup.js'
import { join } from 'path'

describe('样式转换测试', () => {
  let compiler: Vue3MiniprogramCompiler
  let testFiles: string[] = []

  beforeEach(() => {
    compiler = new Vue3MiniprogramCompiler({
      input: getTestDir(),
      output: join(getTestDir(), 'output'),
      appId: 'test-app-id',
      features: {
        scss: true,
        scriptSetup: true,
        typescript: true,
        compositionApi: true,
        emits: true,
        slots: true,
        provide: false
      }
    })
  })

  afterEach(async () => {
    for (const file of testFiles) {
      await removeTestFile(file)
    }
    testFiles = []
  })

  describe('SCSS 到 WXSS 转换', () => {
    it('应该正确转换 SCSS 语法为 WXSS', async () => {
      const vueContent = `<template>
  <view class="container">
    <view class="header">
      <text class="title">标题</text>
      <text class="subtitle">副标题</text>
    </view>
    
    <view class="content">
      <view class="card primary">
        <text class="card-title">主要卡片</text>
      </view>
      
      <view class="card secondary">
        <text class="card-title">次要卡片</text>
      </view>
    </view>
    
    <view class="footer">
      <button class="btn btn-primary">主按钮</button>
      <button class="btn btn-secondary">次按钮</button>
    </view>
  </view>
</template>

<script setup lang="ts">
// 简单的组件逻辑
const title = '样式测试组件'
</script>

<style lang="scss" scoped>
// SCSS 变量
$primary-color: #007bff;
$secondary-color: #6c757d;
$border-radius: 8rpx;
$spacing: 20rpx;

// SCSS 混入
@mixin flex-center {
  display: flex;
  align-items: center;
  justify-content: center;
}

@mixin card-style($bg-color: #fff) {
  background: $bg-color;
  border-radius: $border-radius;
  padding: $spacing;
  margin-bottom: $spacing;
  box-shadow: 0 2rpx 8rpx rgba(0, 0, 0, 0.1);
}

.container {
  padding: $spacing;
  background: #f5f5f5;
  min-height: 100vh;
  
  .header {
    @include flex-center;
    flex-direction: column;
    background: $primary-color;
    color: white;
    padding: 40rpx $spacing;
    margin-bottom: $spacing;
    border-radius: $border-radius;
    
    .title {
      font-size: 36rpx;
      font-weight: bold;
      margin-bottom: 10rpx;
    }
    
    .subtitle {
      font-size: 28rpx;
      opacity: 0.8;
    }
  }
  
  .content {
    .card {
      @include card-style;
      
      &.primary {
        border-left: 4rpx solid $primary-color;
      }
      
      &.secondary {
        border-left: 4rpx solid $secondary-color;
      }
      
      .card-title {
        font-size: 32rpx;
        font-weight: 500;
        color: #333;
      }
    }
  }
  
  .footer {
    @include flex-center;
    gap: $spacing;
    margin-top: 40rpx;
    
    .btn {
      padding: 20rpx 40rpx;
      border-radius: $border-radius;
      border: none;
      font-size: 28rpx;
      color: white;
      
      &.btn-primary {
        background: $primary-color;
        
        &:hover {
          background: darken($primary-color, 10%);
        }
      }
      
      &.btn-secondary {
        background: $secondary-color;
        
        &:hover {
          background: darken($secondary-color, 10%);
        }
      }
    }
  }
}

// 响应式设计
@media (max-width: 750rpx) {
  .container {
    .footer {
      flex-direction: column;
      
      .btn {
        width: 100%;
      }
    }
  }
}
</style>`

      const filePath = await createTestFile('components/StyleTest.vue', vueContent)
      testFiles.push('components/StyleTest.vue')

      await compiler.compileFile(filePath)

      // 验证生成的 WXSS 文件
      const wxssContent = await readTestFile('output/components/StyleTest.wxss')
      
      // 验证 SCSS 变量被正确替换
      expect(wxssContent).toContain('#007bff') // $primary-color
      expect(wxssContent).toContain('#6c757d') // $secondary-color
      expect(wxssContent).toContain('8rpx') // $border-radius
      expect(wxssContent).toContain('20rpx') // $spacing
      
      // 验证 SCSS 嵌套被正确展开
      expect(wxssContent).toContain('.container')
      expect(wxssContent).toContain('.container .header')
      expect(wxssContent).toContain('.container .header .title')
      expect(wxssContent).toContain('.container .header .subtitle')
      expect(wxssContent).toContain('.container .content .card')
      expect(wxssContent).toContain('.container .content .card.primary')
      expect(wxssContent).toContain('.container .content .card.secondary')
      expect(wxssContent).toContain('.container .footer .btn')
      
      // 验证 SCSS 混入被正确展开
      expect(wxssContent).toContain('display: flex')
      expect(wxssContent).toContain('align-items: center')
      expect(wxssContent).toContain('justify-content: center')
      expect(wxssContent).toContain('background: #fff') // card-style mixin
      expect(wxssContent).toContain('border-radius: 8rpx')
      
      // 验证不支持的特性被移除
      expect(wxssContent).not.toContain('box-shadow') // 小程序不支持
      expect(wxssContent).not.toContain(':hover') // 小程序不支持
      expect(wxssContent).not.toContain('@media') // 小程序不支持
      expect(wxssContent).not.toContain('darken(') // SCSS 函数应该被处理
      
      // 验证 SCSS 语法被清理
      expect(wxssContent).not.toContain('$') // 变量符号
      expect(wxssContent).not.toContain('@mixin') // 混入定义
      expect(wxssContent).not.toContain('@include') // 混入调用
      expect(wxssContent).not.toContain('&') // 父选择器引用
    })
  })

  describe('单位转换', () => {
    it('应该正确转换 CSS 单位为小程序单位', async () => {
      const vueContent = `<template>
  <view class="unit-test">
    <text>单位转换测试</text>
  </view>
</template>

<script setup lang="ts">
// 单位转换测试组件
</script>

<style scoped>
.unit-test {
  /* px 单位转换 */
  width: 100px;
  height: 200px;
  padding: 10px 20px;
  margin: 5px;
  
  /* rem 单位转换 (假设 1rem = 16px) */
  font-size: 1rem;
  line-height: 1.5rem;
  
  /* em 单位转换 (假设 1em = 16px) */
  border-width: 0.125em;
  
  /* vh/vw 单位转换 */
  min-height: 50vh;
  max-width: 80vw;
  
  /* 百分比保持不变 */
  width: 50%;
  
  /* rpx 单位保持不变 */
  border-radius: 10rpx;
  
  /* 其他单位保持不变 */
  opacity: 0.8;
  z-index: 100;
}
</style>`

      const filePath = await createTestFile('components/UnitTest.vue', vueContent)
      testFiles.push('components/UnitTest.vue')

      await compiler.compileFile(filePath)

      // 验证生成的 WXSS 文件中的单位转换
      const wxssContent = await readTestFile('output/components/UnitTest.wxss')
      
      // px 转 rpx (1px = 2rpx)
      expect(wxssContent).toContain('width: 200rpx') // 100px -> 200rpx
      expect(wxssContent).toContain('height: 400rpx') // 200px -> 400rpx
      expect(wxssContent).toContain('padding: 20rpx 40rpx') // 10px 20px -> 20rpx 40rpx
      expect(wxssContent).toContain('margin: 10rpx') // 5px -> 10rpx
      
      // rem 转 rpx (1rem = 16px = 32rpx)
      expect(wxssContent).toContain('font-size: 32rpx') // 1rem -> 32rpx
      expect(wxssContent).toContain('line-height: 48rpx') // 1.5rem -> 48rpx
      
      // em 转 rpx (1em = 16px = 32rpx)
      expect(wxssContent).toContain('border-width: 4rpx') // 0.125em -> 4rpx
      
      // vh 转 rpx (假设屏幕高度 667px)
      expect(wxssContent).toContain('min-height: 667rpx') // 50vh -> 667rpx
      
      // vw 转 rpx (假设屏幕宽度 375px)
      expect(wxssContent).toContain('max-width: 600rpx') // 80vw -> 600rpx
      
      // 百分比保持不变
      expect(wxssContent).toContain('width: 50%')
      
      // rpx 保持不变
      expect(wxssContent).toContain('border-radius: 10rpx')
      
      // 无单位数值保持不变
      expect(wxssContent).toContain('opacity: 0.8')
      expect(wxssContent).toContain('z-index: 100')
    })
  })

  describe('作用域样式', () => {
    it('应该正确处理 scoped 样式', async () => {
      const vueContent = `<template>
  <view class="scoped-component">
    <text class="title">作用域样式测试</text>
    <view class="content">
      <text class="text">内容文本</text>
    </view>
  </view>
</template>

<script setup lang="ts">
// 作用域样式测试
</script>

<style scoped>
.scoped-component {
  padding: 20rpx;
  background: #f5f5f5;
}

.title {
  font-size: 32rpx;
  font-weight: bold;
  color: #333;
}

.content {
  margin-top: 20rpx;
}

.text {
  color: #666;
  line-height: 1.5;
}
</style>`

      const filePath = await createTestFile('components/ScopedTest.vue', vueContent)
      testFiles.push('components/ScopedTest.vue')

      await compiler.compileFile(filePath)

      // 验证生成的 WXML 包含作用域属性
      const wxmlContent = await readTestFile('output/components/ScopedTest.wxml')
      expect(wxmlContent).toMatch(/data-v-[a-z0-9]{8}/) // 作用域属性

      // 验证生成的 WXSS 包含作用域选择器
      const wxssContent = await readTestFile('output/components/ScopedTest.wxss')
      expect(wxssContent).toMatch(/\.scoped-component\[data-v-[a-z0-9]{8}\]/)
      expect(wxssContent).toMatch(/\.title\[data-v-[a-z0-9]{8}\]/)
      expect(wxssContent).toMatch(/\.content\[data-v-[a-z0-9]{8}\]/)
      expect(wxssContent).toMatch(/\.text\[data-v-[a-z0-9]{8}\]/)
    })
  })
})
