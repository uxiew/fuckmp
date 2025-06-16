/**
 * 完整项目编译 - 端到端测试
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { Vue3MiniprogramCompiler } from '@/compiler/compiler.js'
import { createTestFile, removeTestFile, getTestDir, readTestFile, PerformanceTest } from '../setup.js'
import { join } from 'path'

describe('完整项目编译测试', () => {
  let compiler: Vue3MiniprogramCompiler
  let performanceTest: PerformanceTest
  let testFiles: string[] = []

  beforeEach(() => {
    compiler = new Vue3MiniprogramCompiler({
      input: getTestDir(),
      output: join(getTestDir(), 'output'),
      appId: 'test-miniprogram',
      features: {
        scriptSetup: true,
        typescript: true,
        scss: true,
        compositionApi: true,
        emits: true,
        slots: true,
        provide: false
      },
      optimization: {
        minify: false,
        sourcemap: true,
        treeshaking: true,
        incremental: true
      }
    })
    performanceTest = new PerformanceTest()
  })

  afterEach(async () => {
    for (const file of testFiles) {
      await removeTestFile(file)
    }
    testFiles = []
  })

  describe('完整小程序项目编译', () => {
    it('应该编译完整的 Vue3 小程序项目', async () => {
      // 创建应用入口文件
      const appContent = `<template>
  <view class="app">
    <!-- 应用根组件 -->
  </view>
</template>

<script setup lang="ts">
// Vue3 应用生命周期
import { onMounted, onUnmounted } from 'vue'

onMounted(() => {
  console.log('App Launch')
})

// 注意：在微信小程序中，应用级别的 onShow/onHide
// 会被编译器自动转换为 App() 的生命周期方法
</script>

<style lang="scss">
.app {
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  color: #333;
}

/* 全局样式 */
page {
  background-color: #f5f5f5;
}
</style>`

      // 创建首页
      const indexPageContent = `<template>
  <view class="index-page">
    <view class="header">
      <text class="title">{{ title }}</text>
    </view>
    
    <view class="content">
      <UserCard 
        :user="currentUser" 
        @user-click="handleUserClick"
      />
      
      <TodoList 
        :todos="todos"
        @add-todo="handleAddTodo"
        @toggle-todo="handleToggleTodo"
      />
    </view>
    
    <view class="footer">
      <button @tap="navigateToProfile" class="profile-btn">
        个人中心
      </button>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted } from 'vue'
import UserCard from '@/components/UserCard.vue'
import TodoList from '@/components/TodoList.vue'

interface User {
  id: number
  name: string
  avatar: string
  email: string
}

interface Todo {
  id: number
  text: string
  completed: boolean
  createdAt: Date
}

const title = ref('我的小程序')

const currentUser = reactive<User>({
  id: 1,
  name: '张三',
  avatar: '/images/avatar.png',
  email: 'zhangsan@example.com'
})

const todos = ref<Todo[]>([
  { id: 1, text: '学习 Vue3', completed: false, createdAt: new Date() },
  { id: 2, text: '开发小程序', completed: true, createdAt: new Date() }
])

const completedCount = computed(() => 
  todos.value.filter(todo => todo.completed).length
)

const handleUserClick = (user: User) => {
  console.log('用户点击:', user.name)
}

const handleAddTodo = (text: string) => {
  todos.value.push({
    id: Date.now(),
    text,
    completed: false,
    createdAt: new Date()
  })
}

const handleToggleTodo = (id: number) => {
  const todo = todos.value.find(t => t.id === id)
  if (todo) {
    todo.completed = !todo.completed
  }
}

const navigateToProfile = () => {
  wx.navigateTo({
    url: '/pages/profile/index'
  })
}

onMounted(() => {
  console.log('首页加载完成')
})
</script>

<style lang="scss" scoped>
.index-page {
  padding: 20rpx;
  
  .header {
    text-align: center;
    padding: 40rpx 0;
    
    .title {
      font-size: 36rpx;
      font-weight: bold;
      color: #333;
    }
  }
  
  .content {
    margin-bottom: 40rpx;
  }
  
  .footer {
    text-align: center;
    
    .profile-btn {
      background: #007bff;
      color: white;
      border-radius: 8rpx;
      padding: 20rpx 40rpx;
      border: none;
    }
  }
}
</style>`

      // 创建用户卡片组件
      const userCardContent = `<template>
  <view class="user-card" @tap="handleClick">
    <image :src="user.avatar" class="avatar" />
    <view class="info">
      <text class="name">{{ user.name }}</text>
      <text class="email">{{ user.email }}</text>
    </view>
  </view>
</template>

<script setup lang="ts">
interface User {
  id: number
  name: string
  avatar: string
  email: string
}

interface Props {
  user: User
}

const props = defineProps<Props>()

const emit = defineEmits<{
  userClick: [user: User]
}>()

const handleClick = () => {
  emit('userClick', props.user)
}
</script>

<style lang="scss" scoped>
.user-card {
  display: flex;
  align-items: center;
  background: white;
  padding: 20rpx;
  border-radius: 12rpx;
  margin-bottom: 20rpx;
  box-shadow: 0 2rpx 8rpx rgba(0, 0, 0, 0.1);
  
  .avatar {
    width: 80rpx;
    height: 80rpx;
    border-radius: 50%;
    margin-right: 20rpx;
  }
  
  .info {
    flex: 1;
    
    .name {
      display: block;
      font-size: 32rpx;
      font-weight: 500;
      color: #333;
      margin-bottom: 8rpx;
    }
    
    .email {
      font-size: 24rpx;
      color: #666;
    }
  }
}
</style>`

      // 创建待办列表组件
      const todoListContent = `<template>
  <view class="todo-list">
    <view class="header">
      <text class="title">待办事项</text>
      <text class="count">({{ todos.length }})</text>
    </view>
    
    <view class="list">
      <view 
        v-for="todo in todos" 
        :key="todo.id"
        class="todo-item"
        :class="{ completed: todo.completed }"
        @tap="toggleTodo(todo.id)"
      >
        <text class="text">{{ todo.text }}</text>
        <text class="date">{{ formatDate(todo.createdAt) }}</text>
      </view>
    </view>
    
    <view class="add-form">
      <input 
        v-model="newTodoText"
        placeholder="添加新的待办事项"
        class="input"
        @confirm="addTodo"
      />
      <button @tap="addTodo" class="add-btn">添加</button>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref } from 'vue'

interface Todo {
  id: number
  text: string
  completed: boolean
  createdAt: Date
}

interface Props {
  todos: Todo[]
}

const props = defineProps<Props>()

const emit = defineEmits<{
  addTodo: [text: string]
  toggleTodo: [id: number]
}>()

const newTodoText = ref('')

const addTodo = () => {
  if (newTodoText.value.trim()) {
    emit('addTodo', newTodoText.value.trim())
    newTodoText.value = ''
  }
}

const toggleTodo = (id: number) => {
  emit('toggleTodo', id)
}

const formatDate = (date: Date) => {
  return date.toLocaleDateString()
}
</script>

<style lang="scss" scoped>
.todo-list {
  background: white;
  border-radius: 12rpx;
  padding: 20rpx;
  
  .header {
    display: flex;
    align-items: center;
    margin-bottom: 20rpx;
    
    .title {
      font-size: 32rpx;
      font-weight: 500;
      color: #333;
    }
    
    .count {
      margin-left: 10rpx;
      font-size: 24rpx;
      color: #666;
    }
  }
  
  .list {
    margin-bottom: 20rpx;
  }
  
  .todo-item {
    padding: 15rpx 0;
    border-bottom: 1rpx solid #eee;
    
    &:last-child {
      border-bottom: none;
    }
    
    &.completed {
      .text {
        text-decoration: line-through;
        color: #999;
      }
    }
    
    .text {
      display: block;
      font-size: 28rpx;
      color: #333;
      margin-bottom: 5rpx;
    }
    
    .date {
      font-size: 22rpx;
      color: #999;
    }
  }
  
  .add-form {
    display: flex;
    gap: 10rpx;
    
    .input {
      flex: 1;
      padding: 15rpx;
      border: 1rpx solid #ddd;
      border-radius: 6rpx;
      font-size: 28rpx;
    }
    
    .add-btn {
      background: #28a745;
      color: white;
      border: none;
      border-radius: 6rpx;
      padding: 15rpx 20rpx;
      font-size: 28rpx;
    }
  }
}
</style>`

      // 创建个人中心页面
      const profilePageContent = `<template>
  <view class="profile-page">
    <view class="header">
      <image :src="userInfo.avatar" class="avatar" />
      <text class="name">{{ userInfo.name }}</text>
    </view>
    
    <view class="menu">
      <view class="menu-item" @tap="handleMenuClick('settings')">
        <text>设置</text>
      </view>
      <view class="menu-item" @tap="handleMenuClick('about')">
        <text>关于</text>
      </view>
      <view class="menu-item" @tap="handleMenuClick('logout')">
        <text>退出登录</text>
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
import { reactive } from 'vue'

const userInfo = reactive({
  name: '张三',
  avatar: '/images/avatar.png'
})

const handleMenuClick = (action: string) => {
  console.log('菜单点击:', action)
  
  switch (action) {
    case 'logout':
      wx.showModal({
        title: '确认',
        content: '确定要退出登录吗？',
        success: (res) => {
          if (res.confirm) {
            wx.navigateBack()
          }
        }
      })
      break
    default:
      wx.showToast({
        title: \`点击了\${action}\`,
        icon: 'none'
      })
  }
}
</script>

<style lang="scss" scoped>
.profile-page {
  padding: 20rpx;
  
  .header {
    text-align: center;
    padding: 40rpx 0;
    
    .avatar {
      width: 120rpx;
      height: 120rpx;
      border-radius: 50%;
      margin-bottom: 20rpx;
    }
    
    .name {
      font-size: 36rpx;
      font-weight: bold;
      color: #333;
    }
  }
  
  .menu {
    background: white;
    border-radius: 12rpx;
    overflow: hidden;
    
    .menu-item {
      padding: 30rpx 20rpx;
      border-bottom: 1rpx solid #eee;
      
      &:last-child {
        border-bottom: none;
      }
      
      text {
        font-size: 32rpx;
        color: #333;
      }
    }
  }
}
</style>`

      // 创建所有测试文件
      await createTestFile('app.vue', appContent)
      await createTestFile('pages/index/index.vue', indexPageContent)
      await createTestFile('pages/profile/index.vue', profilePageContent)
      await createTestFile('components/UserCard.vue', userCardContent)
      await createTestFile('components/TodoList.vue', todoListContent)

      testFiles.push(
        'app.vue',
        'pages/index/index.vue',
        'pages/profile/index.vue',
        'components/UserCard.vue',
        'components/TodoList.vue'
      )

      // 执行完整项目编译
      performanceTest.start()
      const result = await compiler.compile()
      const duration = performanceTest.end('full-project-compile')

      // 验证编译结果
      expect(result.stats.total).toBe(5)
      expect(result.stats.success).toBe(5)
      expect(result.stats.failed).toBe(0)
      expect(result.errors).toHaveLength(0)

      // 验证生成的应用配置文件
      const { exists } = await import('@/utils/index.js')
      const outputDir = join(getTestDir(), 'output')

      expect(await exists(join(outputDir, 'app.json'))).toBe(true)
      expect(await exists(join(outputDir, 'project.config.json'))).toBe(true)
      expect(await exists(join(outputDir, 'sitemap.json'))).toBe(true)

      // 验证应用配置内容
      const appConfigContent = await readTestFile('output/app.json')
      const appConfig = JSON.parse(appConfigContent)
      expect(appConfig.pages).toContain('pages/index/index')
      expect(appConfig.pages).toContain('pages/profile/index')
      expect(appConfig.window).toBeDefined()
      expect(appConfig.sitemapLocation).toBe('sitemap.json')

      // 验证页面文件生成
      expect(await exists(join(outputDir, 'pages/index/index.js'))).toBe(true)
      expect(await exists(join(outputDir, 'pages/index/index.json'))).toBe(true)
      expect(await exists(join(outputDir, 'pages/index/index.wxml'))).toBe(true)
      expect(await exists(join(outputDir, 'pages/index/index.wxss'))).toBe(true)

      expect(await exists(join(outputDir, 'pages/profile/index.js'))).toBe(true)
      expect(await exists(join(outputDir, 'pages/profile/index.json'))).toBe(true)
      expect(await exists(join(outputDir, 'pages/profile/index.wxml'))).toBe(true)
      expect(await exists(join(outputDir, 'pages/profile/index.wxss'))).toBe(true)

      // 验证组件文件生成
      expect(await exists(join(outputDir, 'components/UserCard.js'))).toBe(true)
      expect(await exists(join(outputDir, 'components/UserCard.json'))).toBe(true)
      expect(await exists(join(outputDir, 'components/UserCard.wxml'))).toBe(true)
      expect(await exists(join(outputDir, 'components/UserCard.wxss'))).toBe(true)

      expect(await exists(join(outputDir, 'components/TodoList.js'))).toBe(true)
      expect(await exists(join(outputDir, 'components/TodoList.json'))).toBe(true)
      expect(await exists(join(outputDir, 'components/TodoList.wxml'))).toBe(true)
      expect(await exists(join(outputDir, 'components/TodoList.wxss'))).toBe(true)

      // 验证首页配置包含组件引用
      const indexConfigContent = await readTestFile('output/pages/index/index.json')
      const indexConfig = JSON.parse(indexConfigContent)
      expect(indexConfig.usingComponents).toBeDefined()
      expect(indexConfig.usingComponents['user-card']).toBeDefined()
      expect(indexConfig.usingComponents['todo-list']).toBeDefined()

      // 验证组件配置
      const userCardConfigContent = await readTestFile('output/components/UserCard.json')
      const userCardConfig = JSON.parse(userCardConfigContent)
      expect(userCardConfig.component).toBe(true)

      // 性能验证
      expect(duration).toBeLessThan(10000) // 应该在 10 秒内完成

      console.log(`完整项目编译耗时: ${duration}ms`)
      console.log(`编译统计: 成功 ${result.stats.success}/${result.stats.total} 个文件`)
    })
  })
})
