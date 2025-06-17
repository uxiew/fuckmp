# Vue3 SFC 转微信小程序语法转换指南

## 📋 概述

本指南详细说明如何将Vue3单文件组件(SFC)语法转换为微信小程序原生语法，包括模板、脚本、样式的转换方法和常见问题解决方案。

## 🔄 基础架构对比

### Vue3 SFC 结构
```vue
<template>
  <div class="container">
    <h1>{{ title }}</h1>
  </div>
</template>

<script setup>
import { ref } from 'vue'
const title = ref('Hello Vue3')
</script>

<style scoped>
.container {
  padding: 20px;
}
</style>
```

### 微信小程序结构
```
page/
├── index.js     // 逻辑文件
├── index.wxml   // 模板文件
├── index.wxss   // 样式文件
└── index.json   // 配置文件
```

## 🏗️ 模板语法转换

### 1. 基础标签转换

```vue
<!-- Vue3 模板 -->
<template>
  <div class="container">
    <span class="text">{{ message }}</span>
    <button @click="handleClick">点击</button>
  </div>
</template>
```

```xml
<!-- 微信小程序 WXML -->
<view class="container">
  <text class="text">{{ message }}</text>
  <button bind:tap="handleClick">点击</button>
</view>
```

#### 标签映射表
| Vue3标签 | 小程序标签 | 说明 |
|---------|-----------|------|
| `<div>` | `<view>` | 块级容器 |
| `<span>` | `<text>` | 行内文本 |
| `<img>` | `<image>` | 图片 |
| `<input>` | `<input>` | 输入框 |
| `<button>` | `<button>` | 按钮 |
| `<ul>/<li>` | `<view>` | 列表需要自己实现 |

### 2. 事件绑定转换

```vue
<!-- Vue3 事件绑定 -->
<template>
  <button @click="handleClick">点击</button>
  <button @click="handleClick($event, 'param')">带参点击</button>
  <input @input="handleInput" v-model="inputValue">
  <div @touchstart="handleTouch">触摸</div>
</template>
```

```xml
<!-- 小程序事件绑定 -->
<button bind:tap="handleClick">点击</button>
<button bind:tap="handleClick" data-param="param">带参点击</button>
<input bind:input="handleInput" value="{{inputValue}}">
<view bind:touchstart="handleTouch">触摸</view>
```

#### 事件名称映射
| Vue3事件 | 小程序事件 | 说明 |
|---------|-----------|------|
| `@click` | `bind:tap` | 点击事件 |
| `@input` | `bind:input` | 输入事件 |
| `@change` | `bind:change` | 变化事件 |
| `@touchstart` | `bind:touchstart` | 触摸开始 |
| `@touchend` | `bind:touchend` | 触摸结束 |

### 3. 条件渲染转换

```vue
<!-- Vue3 条件渲染 -->
<template>
  <div v-if="show">显示内容</div>
  <div v-else-if="loading">加载中...</div>
  <div v-else>默认内容</div>
  <div v-show="visible">控制显示</div>
</template>
```

```xml
<!-- 小程序条件渲染 -->
<view wx:if="{{show}}">显示内容</view>
<view wx:elif="{{loading}}">加载中...</view>
<view wx:else>默认内容</view>
<view hidden="{{!visible}}">控制显示</view>
```

**注意事项**：
- 小程序的条件语句需要双括号 `{{}}`
- `v-show` 对应 `hidden` 属性
- 条件表达式在小程序中更加严格

### 4. 列表渲染转换

```vue
<!-- Vue3 列表渲染 -->
<template>
  <ul>
    <li v-for="(item, index) in list" :key="item.id">
      {{ index }}: {{ item.name }}
    </li>
  </ul>
</template>
```

```xml
<!-- 小程序列表渲染 -->
<view>
  <view wx:for="{{list}}" wx:key="id" wx:for-index="index" wx:for-item="item">
    {{ index }}: {{ item.name }}
  </view>
</view>
```

**关键差异**：
- `wx:key` 对应 Vue 的 `:key`
- `wx:for-index` 和 `wx:for-item` 可以自定义变量名
- 嵌套循环时需要重命名避免冲突

## 📜 脚本逻辑转换

### 1. Composition API 转换

```javascript
// Vue3 Composition API
<script setup>
import { ref, reactive, computed, onMounted, watch } from 'vue'

// 响应式数据
const count = ref(0)
const user = reactive({
  name: 'John',
  age: 25
})

// 计算属性
const doubleCount = computed(() => count.value * 2)

// 方法
const increment = () => {
  count.value++
}

// 生命周期
onMounted(() => {
  console.log('组件挂载')
})

// 监听器
watch(count, (newVal, oldVal) => {
  console.log(`count变化: ${oldVal} -> ${newVal}`)
})
</script>
```

```javascript
// 微信小程序 Page
Page({
  // 页面数据
  data: {
    count: 0,
    user: {
      name: 'John',
      age: 25
    }
  },

  // 计算属性需要手动实现
  getDoubleCount() {
    return this.data.count * 2
  },

  // 方法
  increment() {
    this.setData({
      count: this.data.count + 1
    })
    // 手动触发计算属性更新
    this.setData({
      doubleCount: this.getDoubleCount()
    })
  },

  // 生命周期
  onLoad() {
    console.log('页面加载')
  },

  onReady() {
    console.log('页面渲染完成')
  },

  // 数据监听需要手动实现
  watchCount(newVal, oldVal) {
    console.log(`count变化: ${oldVal} -> ${newVal}`)
  }
})
```

### 2. 组件定义转换

```vue
<!-- Vue3 子组件 -->
<template>
  <div class="child-component">
    <p>{{ message }}</p>
    <button @click="sendMessage">发送消息</button>
  </div>
</template>

<script setup>
import { defineProps, defineEmits } from 'vue'

const props = defineProps({
  message: {
    type: String,
    default: '默认消息'
  }
})

const emit = defineEmits(['send-message'])

const sendMessage = () => {
  emit('send-message', '来自子组件的消息')
}
</script>
```

```javascript
// 微信小程序组件 JS
Component({
  // 组件属性
  properties: {
    message: {
      type: String,
      value: '默认消息'
    }
  },

  // 组件数据
  data: {
    // 内部数据
  },

  // 组件方法
  methods: {
    sendMessage() {
      this.triggerEvent('send-message', '来自子组件的消息')
    }
  },

  // 生命周期
  lifetimes: {
    created() {
      console.log('组件创建')
    },
    attached() {
      console.log('组件挂载')
    },
    detached() {
      console.log('组件销毁')
    }
  }
})
```

```xml
<!-- 微信小程序组件 WXML -->
<view class="child-component">
  <text>{{ message }}</text>
  <button bind:tap="sendMessage">发送消息</button>
</view>
```

## 🎨 样式转换

### 1. 基础样式转换

```vue
<!-- Vue3 样式 -->
<style scoped>
.container {
  width: 100%;
  height: 100vh;
  padding: 20px;
  box-sizing: border-box;
}

.text {
  font-size: 16px;
  color: #333;
}

/* 媒体查询 */
@media (max-width: 768px) {
  .container {
    padding: 10px;
  }
}
</style>
```

```css
/* 微信小程序样式 */
.container {
  width: 100%;
  height: 100vh;
  padding: 40rpx; /* 使用rpx单位 */
  box-sizing: border-box;
}

.text {
  font-size: 32rpx; /* 16px * 2 = 32rpx */
  color: #333;
}

/* 小程序不支持媒体查询，需要用其他方式实现响应式 */
```

### 2. 单位转换规则

| Vue3/CSS单位 | 小程序单位 | 转换规则 |
|-------------|-----------|---------|
| `px` | `rpx` | 1px = 2rpx (基于750设计稿) |
| `rem` | `rpx` | 需要计算转换 |
| `em` | `rpx` | 相对单位需要手动计算 |
| `%` | `%` | 百分比单位保持不变 |
| `vw/vh` | `rpx` | 需要手动计算转换 |

### 3. 样式作用域问题

```vue
<!-- Vue3 scoped样式 -->
<style scoped>
.button {
  background: blue;
}
</style>
```

```css
/* 小程序需要手动管理作用域 */
.page-index .button {
  background: blue;
}

/* 或者使用组件选择器 */
.child-component .button {
  background: blue;
}
```

## 🚨 常见问题和解决方案

### 1. 双向绑定问题

**问题**：Vue3的`v-model`在小程序中没有对应的实现

```vue
<!-- Vue3 -->
<input v-model="inputValue" />
```

**解决方案**：
```xml
<!-- 小程序手动实现双向绑定 -->
<input value="{{inputValue}}" bind:input="handleInput" />
```

```javascript
// JS中处理
handleInput(e) {
  this.setData({
    inputValue: e.detail.value
  })
}
```

### 2. 计算属性问题

**问题**：小程序没有计算属性的概念

**解决方案**：
```javascript
// 方案1: 使用方法模拟
Page({
  data: {
    firstName: 'John',
    lastName: 'Doe'
  },
  
  // 在方法中计算
  getFullName() {
    return `${this.data.firstName} ${this.data.lastName}`
  },
  
  // 在数据更新时手动更新计算结果
  updateName() {
    this.setData({
      fullName: this.getFullName()
    })
  }
})

// 方案2: 使用mobx-miniprogram实现响应式
import { computed } from 'mobx-miniprogram'

Page({
  data: {
    firstName: 'John',
    lastName: 'Doe'
  },
  
  computed: {
    fullName: computed(function() {
      return `${this.data.firstName} ${this.data.lastName}`
    })
  }
})
```

### 3. 路由参数传递问题

**问题**：Vue Router的路由参数传递方式不适用

```javascript
// Vue3 路由
this.$router.push({
  name: 'detail',
  params: { id: 123 }
})
```

**解决方案**：
```javascript
// 小程序路由参数传递
wx.navigateTo({
  url: `/pages/detail/detail?id=123`
})

// 接收页面
Page({
  onLoad(options) {
    const id = options.id // 获取参数
  }
})
```

### 4. 状态管理问题

**问题**：Vuex/Pinia在小程序中不可用

**解决方案**：
```javascript
// 方案1: 使用全局变量
// app.js
App({
  globalData: {
    userInfo: null,
    isLogin: false
  }
})

// 页面中使用
const app = getApp()
console.log(app.globalData.userInfo)

// 方案2: 使用mobx-miniprogram
import { observable, action } from 'mobx-miniprogram'

export const store = observable({
  userInfo: null,
  isLogin: false,
  
  setUserInfo: action(function(userInfo) {
    this.userInfo = userInfo
    this.isLogin = true
  })
})
```

### 5. 异步数据加载问题

**问题**：Vue3的异步组件和Suspense不适用

**解决方案**：
```javascript
// Vue3 异步加载
<script setup>
import { ref, onMounted } from 'vue'

const data = ref(null)
const loading = ref(true)

onMounted(async () => {
  try {
    const response = await fetch('/api/data')
    data.value = await response.json()
  } finally {
    loading.value = false
  }
})
</script>
```

```javascript
// 小程序异步加载
Page({
  data: {
    data: null,
    loading: true
  },

  onLoad() {
    this.loadData()
  },

  async loadData() {
    try {
      const res = await wx.request({
        url: 'https://api.example.com/data'
      })
      this.setData({
        data: res.data
      })
    } catch (error) {
      console.error('加载失败', error)
    } finally {
      this.setData({
        loading: false
      })
    }
  }
})
```

### 6. 组件通信问题

**问题**：Vue3的provide/inject和插槽不适用

**解决方案**：
```javascript
// Vue3 provide/inject
// 父组件
provide('userInfo', userInfo)

// 子组件
const userInfo = inject('userInfo')
```

```javascript
// 小程序解决方案
// 方案1: 通过props逐层传递
// 方案2: 使用全局状态管理
// 方案3: 使用事件总线
const eventBus = {
  events: {},
  
  on(event, callback) {
    if (!this.events[event]) {
      this.events[event] = []
    }
    this.events[event].push(callback)
  },
  
  emit(event, data) {
    if (this.events[event]) {
      this.events[event].forEach(callback => callback(data))
    }
  }
}
```

## 🛠️ 迁移工具和辅助

### 1. 自动化转换工具
- **uni-app**: Vue语法转小程序的成熟框架
- **Taro**: React/Vue多端转换框架
- **mpvue/vant-weapp**: Vue转小程序的解决方案

### 2. 代码片段转换器
```javascript
// 创建转换辅助函数
const vueToMiniProgram = {
  // 事件名转换
  convertEvent(vueEvent) {
    const eventMap = {
      'click': 'tap',
      'input': 'input',
      'change': 'change'
    }
    return eventMap[vueEvent] || vueEvent
  },
  
  // 生命周期转换
  convertLifecycle(vueHook) {
    const lifecycleMap = {
      'onMounted': 'onReady',
      'onUnmounted': 'onUnload',
      'onUpdated': 'onShow'
    }
    return lifecycleMap[vueHook] || vueHook
  }
}
```

## 📋 迁移检查清单

### 开发前检查
- [ ] 确认目标小程序平台（微信/支付宝/百度等）
- [ ] 选择开发方式（原生/框架转换）
- [ ] 准备设计稿和UI规范

### 模板转换检查
- [ ] HTML标签转换为小程序组件
- [ ] 事件绑定语法转换
- [ ] 条件渲染语法转换
- [ ] 列表渲染语法转换
- [ ] 插值表达式语法检查

### 脚本转换检查
- [ ] Vue实例转换为Page/Component
- [ ] 响应式数据转换为data
- [ ] 方法定义转换
- [ ] 生命周期钩子转换
- [ ] 组件通信方式调整

### 样式转换检查
- [ ] CSS单位转换（px -> rpx）
- [ ] 样式作用域调整
- [ ] 不支持的CSS特性替换
- [ ] 响应式布局调整

### 功能验证检查
- [ ] 页面路由功能
- [ ] 数据绑定功能
- [ ] 事件处理功能
- [ ] 组件通信功能
- [ ] 网络请求功能

## 💡 最佳实践建议

1. **渐进式迁移**：先迁移简单页面，再处理复杂交互
2. **保持一致性**：建立代码规范和命名约定
3. **性能优化**：利用小程序的预加载和分包特性
4. **测试验证**：真机测试比模拟器更可靠
5. **文档维护**：记录迁移过程中的经验和坑点

---

**总结**：从Vue3到小程序的迁移需要重新思考组件化和数据流，但核心的业务逻辑可以得到很好的保留。建议先从简单的页面开始，逐步积累经验，最终形成适合团队的迁移模式。