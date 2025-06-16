/**
 * Vue 模板指令转换 - 端到端测试
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { Vue3MiniprogramCompiler } from '@/compiler/compiler.js'
import { createTestFile, removeTestFile, getTestDir, readTestFile } from '../setup.js'
import { join } from 'path'

describe('Vue 模板指令转换测试', () => {
  let compiler: Vue3MiniprogramCompiler
  let testFiles: string[] = []

  beforeEach(() => {
    compiler = new Vue3MiniprogramCompiler({
      input: getTestDir(),
      output: join(getTestDir(), 'output'),
      appId: 'test-app-id'
    })
  })

  afterEach(async () => {
    for (const file of testFiles) {
      await removeTestFile(file)
    }
    testFiles = []
  })

  describe('条件渲染指令', () => {
    it('应该正确转换 v-if、v-else-if、v-else 指令', async () => {
      const vueContent = `<template>
  <view class="container">
    <view v-if="status === 'loading'" class="loading">
      <text>加载中...</text>
    </view>
    
    <view v-else-if="status === 'error'" class="error">
      <text>加载失败</text>
    </view>
    
    <view v-else-if="status === 'empty'" class="empty">
      <text>暂无数据</text>
    </view>
    
    <view v-else class="content">
      <text>{{ content }}</text>
    </view>
    
    <button v-show="showButton" @tap="handleClick">
      点击按钮
    </button>
  </view>
</template>

<script setup lang="ts">
import { ref } from 'vue'

const status = ref<'loading' | 'error' | 'empty' | 'success'>('loading')
const content = ref('Hello World')
const showButton = ref(true)

const handleClick = () => {
  console.log('Button clicked')
}
</script>

<style scoped>
.container { padding: 20rpx; }
.loading { color: #999; }
.error { color: #ff0000; }
.empty { color: #666; }
.content { color: #333; }
</style>`

      const filePath = await createTestFile('components/ConditionalRender.vue', vueContent)
      testFiles.push('components/ConditionalRender.vue')

      await compiler.compileFile(filePath)

      // 验证 WXML 中的条件渲染转换
      const wxmlContent = await readTestFile('output/components/ConditionalRender.wxml')
      
      // v-if 转换为 wx:if
      expect(wxmlContent).toContain('wx:if="{{status === \'loading\'}}"')
      
      // v-else-if 转换为 wx:elif
      expect(wxmlContent).toContain('wx:elif="{{status === \'error\'}}"')
      expect(wxmlContent).toContain('wx:elif="{{status === \'empty\'}}"')
      
      // v-else 转换为 wx:else
      expect(wxmlContent).toContain('wx:else')
      
      // v-show 转换为 hidden
      expect(wxmlContent).toContain('hidden="{{!(showButton)}}"')
      
      // 验证插值表达式
      expect(wxmlContent).toContain('{{content}}')
    })
  })

  describe('列表渲染指令', () => {
    it('应该正确转换 v-for 指令', async () => {
      const vueContent = `<template>
  <view class="list-container">
    <!-- 基础列表渲染 -->
    <view v-for="item in items" :key="item.id" class="item">
      <text>{{ item.name }}</text>
    </view>
    
    <!-- 带索引的列表渲染 -->
    <view v-for="(user, index) in users" :key="user.id" class="user-item">
      <text>{{ index + 1 }}. {{ user.name }} ({{ user.age }}岁)</text>
    </view>
    
    <!-- 对象遍历 -->
    <view v-for="(value, key) in userInfo" :key="key" class="info-item">
      <text>{{ key }}: {{ value }}</text>
    </view>
    
    <!-- 数字遍历 -->
    <view v-for="n in 5" :key="n" class="number-item">
      <text>数字: {{ n }}</text>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref, reactive } from 'vue'

const items = ref([
  { id: 1, name: '项目1' },
  { id: 2, name: '项目2' },
  { id: 3, name: '项目3' }
])

const users = ref([
  { id: 1, name: '张三', age: 25 },
  { id: 2, name: '李四', age: 30 }
])

const userInfo = reactive({
  name: '王五',
  age: 28,
  city: '北京'
})
</script>

<style scoped>
.list-container { padding: 20rpx; }
.item, .user-item, .info-item, .number-item {
  padding: 10rpx;
  margin-bottom: 10rpx;
  background: #f5f5f5;
}
</style>`

      const filePath = await createTestFile('components/ListRender.vue', vueContent)
      testFiles.push('components/ListRender.vue')

      await compiler.compileFile(filePath)

      // 验证 WXML 中的列表渲染转换
      const wxmlContent = await readTestFile('output/components/ListRender.wxml')
      
      // 基础 v-for 转换
      expect(wxmlContent).toContain('wx:for="{{items}}"')
      expect(wxmlContent).toContain('wx:for-item="item"')
      expect(wxmlContent).toContain('wx:key="id"')
      
      // 带索引的 v-for 转换
      expect(wxmlContent).toContain('wx:for="{{users}}"')
      expect(wxmlContent).toContain('wx:for-item="user"')
      expect(wxmlContent).toContain('wx:for-index="index"')
      
      // 对象遍历转换
      expect(wxmlContent).toContain('wx:for="{{userInfo}}"')
      expect(wxmlContent).toContain('wx:for-item="value"')
      expect(wxmlContent).toContain('wx:for-index="key"')
      
      // 数字遍历转换
      expect(wxmlContent).toContain('wx:for="{{5}}"')
      expect(wxmlContent).toContain('wx:for-item="n"')
      
      // 验证插值表达式
      expect(wxmlContent).toContain('{{item.name}}')
      expect(wxmlContent).toContain('{{index + 1}}')
      expect(wxmlContent).toContain('{{user.name}}')
      expect(wxmlContent).toContain('{{value}}')
      expect(wxmlContent).toContain('{{key}}')
    })
  })

  describe('双向绑定指令', () => {
    it('应该正确转换 v-model 指令', async () => {
      const vueContent = `<template>
  <view class="form-container">
    <!-- 文本输入 -->
    <input v-model="username" placeholder="用户名" class="input" />
    
    <!-- 数字输入 -->
    <input v-model.number="age" type="number" placeholder="年龄" class="input" />
    
    <!-- 去除空格 -->
    <input v-model.trim="email" placeholder="邮箱" class="input" />
    
    <!-- 文本域 -->
    <textarea v-model="description" placeholder="描述" class="textarea"></textarea>
    
    <!-- 单选框 -->
    <radio-group v-model="gender">
      <label><radio value="male" />男</label>
      <label><radio value="female" />女</label>
    </radio-group>
    
    <!-- 复选框 -->
    <checkbox-group v-model="hobbies">
      <label><checkbox value="reading" />阅读</label>
      <label><checkbox value="music" />音乐</label>
      <label><checkbox value="sports" />运动</label>
    </checkbox-group>
    
    <!-- 选择器 -->
    <picker v-model="city" :range="cities" class="picker">
      <text>选择城市: {{ cities[city] || '请选择' }}</text>
    </picker>
  </view>
</template>

<script setup lang="ts">
import { ref } from 'vue'

const username = ref('')
const age = ref(0)
const email = ref('')
const description = ref('')
const gender = ref('male')
const hobbies = ref<string[]>([])
const city = ref(0)

const cities = ref(['北京', '上海', '广州', '深圳'])
</script>

<style scoped>
.form-container { padding: 20rpx; }
.input, .textarea, .picker {
  width: 100%;
  padding: 20rpx;
  margin-bottom: 20rpx;
  border: 1rpx solid #ddd;
  border-radius: 8rpx;
}
</style>`

      const filePath = await createTestFile('components/FormBinding.vue', vueContent)
      testFiles.push('components/FormBinding.vue')

      await compiler.compileFile(filePath)

      // 验证 WXML 中的双向绑定转换
      const wxmlContent = await readTestFile('output/components/FormBinding.wxml')
      
      // 基础 v-model 转换
      expect(wxmlContent).toContain('value="{{username}}"')
      expect(wxmlContent).toContain('bindinput="_handleInput_username"')
      
      // v-model.number 转换
      expect(wxmlContent).toContain('value="{{age}}"')
      expect(wxmlContent).toContain('bindinput="_handleNumberInput_age"')
      
      // v-model.trim 转换
      expect(wxmlContent).toContain('value="{{email}}"')
      expect(wxmlContent).toContain('bindinput="_handleTrimInput_email"')
      
      // textarea v-model 转换
      expect(wxmlContent).toContain('value="{{description}}"')
      expect(wxmlContent).toContain('bindinput="_handleInput_description"')
      
      // radio-group v-model 转换
      expect(wxmlContent).toContain('value="{{gender}}"')
      expect(wxmlContent).toContain('bindchange="_handleRadio_gender"')
      
      // checkbox-group v-model 转换
      expect(wxmlContent).toContain('value="{{hobbies}}"')
      expect(wxmlContent).toContain('bindchange="_handleCheckbox_hobbies"')
      
      // picker v-model 转换
      expect(wxmlContent).toContain('value="{{city}}"')
      expect(wxmlContent).toContain('bindchange="_handlePicker_city"')

      // 验证生成的 JS 文件包含处理方法
      const jsContent = await readTestFile('output/components/FormBinding.js')
      expect(jsContent).toContain('_handleInput_username')
      expect(jsContent).toContain('_handleNumberInput_age')
      expect(jsContent).toContain('_handleTrimInput_email')
      expect(jsContent).toContain('_handleRadio_gender')
      expect(jsContent).toContain('_handleCheckbox_hobbies')
      expect(jsContent).toContain('_handlePicker_city')
    })
  })
})
