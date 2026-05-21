# Vue3 小程序编译器 - 完整架构设计

## 🏗️ 架构概述

Vue3小程序编译器采用**编译时 + 运行时**的混合架构，完美平衡了编译复杂度和运行时性能。

### 核心设计理念

- **编译时简化**：编译器专注于语法分析和配置生成
- **运行时增强**：运行时库提供完整的Vue3特性支持
- **插件化架构**：每个Vue特性都作为独立的插件
- **渐进式集成**：可以逐步启用各种Vue3特性

### 架构分层

```
┌─────────────────────────────────────────────────────────────┐
│                    编译时层 (Compile Time)                    │
├─────────────────────────────────────────────────────────────┤
│  插件系统    │  代码生成器   │  依赖分析器   │  配置管理器    │
│  - 语法分析  │  - 中间代码   │  - 运行时需求 │  - 编译选项    │
│  - AST转换   │  - 配置生成   │  - 插件依赖   │  - 优化策略    │
├─────────────────────────────────────────────────────────────┤
│                    运行时层 (Runtime)                        │
├─────────────────────────────────────────────────────────────┤
│  响应式系统  │  生命周期     │  模板引擎     │  依赖注入      │
│  - reactive  │  - 钩子管理   │  - 插槽渲染   │  - provide     │
│  - ref       │  - 性能监控   │  - 条件渲染   │  - inject      │
│  - computed  │  - 错误处理   │  - 列表渲染   │  - 作用域管理  │
├─────────────────────────────────────────────────────────────┤
│                   小程序平台层 (Platform)                     │
├─────────────────────────────────────────────────────────────┤
│  Page()      │  Component()  │  setData()    │  生命周期      │
│  - 页面管理  │  - 组件系统   │  - 数据更新   │  - 平台钩子    │
└─────────────────────────────────────────────────────────────┘
```

## 📁 目录结构

```
src/plugins/
├── base/
│   └── transform-plugin.ts          # 插件基类和接口
├── core/
│   ├── reactive-plugin.ts           # 响应式数据处理
│   ├── computed-plugin.ts           # 计算属性处理
│   ├── lifecycle-plugin.ts          # 生命周期处理
│   └── methods-plugin.ts            # 方法处理
├── directives/
│   ├── v-model-plugin.ts            # v-model 双向绑定
│   ├── v-if-plugin.ts               # 条件渲染
│   ├── v-for-plugin.ts              # 列表渲染
│   └── v-show-plugin.ts             # 显示隐藏
├── composition/
│   ├── provide-inject-plugin.ts     # provide/inject
│   ├── slots-plugin.ts              # 插槽系统
│   └── teleport-plugin.ts           # 传送门
├── advanced/
│   ├── suspense-plugin.ts           # 异步组件
│   ├── keep-alive-plugin.ts         # 缓存组件
│   └── transition-plugin.ts         # 过渡动画
├── manager/
│   └── plugin-manager.ts            # 插件管理器
└── registry.ts                      # 插件注册器
```

## 🔌 插件接口

### 基础插件接口

```typescript
interface TransformPlugin {
  readonly name: string
  readonly version: string
  readonly priority: number
  readonly supportedVueVersions: string[]
  readonly dependencies: string[]

  supports(node: ASTNode, context: TransformContext): boolean
  transform(node: ASTNode, context: TransformContext): Promise<TransformResult>
  initialize?(context: TransformContext): Promise<void>
  cleanup?(): Promise<void>
}
```

### 转换结果

```typescript
interface TransformResult {
  handled: boolean
  code?: string
  contextUpdates?: Partial<TransformContext>
  dependencies?: string[]
  errors?: string[]
  warnings?: string[]
}
```

## 🚀 完整使用示例

### 1. 基础Vue3组件

```vue
<!-- UserProfile.vue -->
<template>
  <view class="profile">
    <text>{{ userInfo.name }}</text>
    <text>{{ computedAge }}</text>
    <button @tap="updateAge">更新年龄</button>

    <!-- 条件渲染 -->
    <view v-if="showDetails">
      <text>详细信息</text>
    </view>

    <!-- 列表渲染 -->
    <view v-for="hobby in userInfo.hobbies" :key="hobby.id">
      {{ hobby.name }}
    </view>

    <!-- 插槽 -->
    <slot name="actions" :user="userInfo">
      <button>默认操作</button>
    </slot>
  </view>
</template>

<script setup lang="ts">
import { ref, reactive, computed, provide, inject } from 'vue'

// 响应式数据
const userInfo = reactive({
  name: '张三',
  age: 25,
  hobbies: [
    { id: 1, name: '阅读' },
    { id: 2, name: '运动' }
  ]
})

const showDetails = ref(false)

// 计算属性
const computedAge = computed(() => `${userInfo.age}岁`)

// 方法
const updateAge = () => {
  userInfo.age++
  if (userInfo.age > 30) {
    showDetails.value = true
  }
}

// 依赖注入
provide('theme', 'dark')
const globalConfig = inject('config', { version: '1.0.0' })
</script>
```

### 2. 编译后的小程序代码

```javascript
// UserProfile.js (编译后)
const { createComponent } = require('./runtime-injection.js')

const componentConfig = {
  data: {
    userInfo: {
      name: '张三',
      age: 25,
      hobbies: [
        { id: 1, name: '阅读' },
        { id: 2, name: '运动' }
      ]
    },
    showDetails: false,
    globalConfig: { version: '1.0.0' }
  },

  computed: {
    computedAge: {
      getter: function() {
        return `${this.data.userInfo.age}岁`
      }
    }
  },

  methods: {
    updateAge: function() {
      const newAge = this.data.userInfo.age + 1
      this.setData({
        'userInfo.age': newAge,
        showDetails: newAge > 30
      })
      this._updateComputed()
    }
  },

  providers: {
    theme: { key: 'theme', value: 'dark' }
  },

  injectors: {
    globalConfig: { key: 'config', defaultValue: { version: '1.0.0' } }
  }
}

Component(createComponent(componentConfig))
```

### 3. 对应的小程序模板

```xml
<!-- UserProfile.wxml -->
<view class="profile">
  <text>{{ userInfo.name }}</text>
  <text>{{ computedAge }}</text>
  <button bind:tap="updateAge">更新年龄</button>

  <!-- 条件渲染 -->
  <view wx:if="{{ showDetails }}">
    <text>详细信息</text>
  </view>

  <!-- 列表渲染 -->
  <view wx:for="{{ userInfo.hobbies }}" wx:key="id">
    {{ item.name }}
  </view>

  <!-- 插槽 -->
  <slot name="actions" user="{{ userInfo }}">
    <button>默认操作</button>
  </slot>
</view>
```

## 🔧 核心插件

### ReactivePlugin

处理 Vue 的响应式 API：

- `ref()` → 小程序 data
- `reactive()` → 小程序 data
- `computed()` → 小程序计算属性

```typescript
// Vue 代码
const count = ref(0)
const user = reactive({ name: 'John' })
const doubleCount = computed(() => count.value * 2)

// 转换后的小程序代码
Page({
  data: {
    count: 0,
    user: { name: 'John' }
  },
  computed: {
    doubleCount() {
      return this.data.count * 2
    }
  }
})
```

### VModelPlugin

处理 v-model 双向绑定：

```typescript
// Vue 代码
<input v-model="username" />
<picker v-model="selectedIndex" />

// 转换后的小程序代码
<input value="{{username}}" bindinput="_handleInput_username" />
<picker value="{{selectedIndex}}" bindchange="_handlePicker_selectedIndex" />
```

## 🎯 扩展指南

### 添加新的指令支持

1. **创建插件文件**

```typescript
// src/plugins/directives/v-custom-plugin.ts
export class VCustomPlugin extends BaseTransformPlugin {
  readonly name = 'v-custom-plugin'
  readonly priority = 70

  supports(node: ASTNode): boolean {
    return node.type === 'VueDirective' && node.name === 'custom'
  }

  async transform(node: ASTNode, context: TransformContext): Promise<TransformResult> {
    // 实现 v-custom 指令的转换逻辑
  }
}
```

2. **注册插件**

```typescript
// src/plugins/registry.ts
import { VCustomPlugin } from './directives/v-custom-plugin'

export function registerDirectivePlugins(): void {
  const directivePlugins = [
    new VModelPlugin(),
    new VCustomPlugin(), // 添加新插件
  ]
  // ...
}
```

### 添加组合式 API 支持

```typescript
// src/plugins/composition/provide-inject-plugin.ts
export class ProvideInjectPlugin extends BaseTransformPlugin {
  readonly name = 'provide-inject-plugin'
  readonly priority = 60

  supports(node: ASTNode): boolean {
    return this.isVueMacro(node, 'provide') || this.isVueMacro(node, 'inject')
  }

  async transform(node: ASTNode, context: TransformContext): Promise<TransformResult> {
    // 实现 provide/inject 的转换逻辑
    // 可能需要生成小程序的全局状态管理代码
  }
}
```

## 📊 性能优化

### 插件执行顺序

插件按优先级执行，优先级越高越先执行：

1. **核心插件** (priority: 100+)：响应式、计算属性
2. **指令插件** (priority: 70-90)：v-model、v-if、v-for
3. **组合式API插件** (priority: 50-70)：provide/inject、slots
4. **高级特性插件** (priority: 10-50)：suspense、transition

### 依赖管理

插件可以声明依赖关系：

```typescript
export class VModelPlugin extends BaseTransformPlugin {
  readonly dependencies = ['reactive-plugin'] // 依赖响应式插件
}
```

### 缓存机制

- 转换结果缓存
- AST节点类型检查缓存
- 插件支持性检查缓存

## 🔍 调试和监控

### 插件执行统计

```typescript
const result = await transformer.transformScript(parseResult, filename)

console.log('转换统计:', {
  processedNodes: result.stats.processedNodes,
  usedPlugins: result.stats.usedPlugins,
  transformTime: result.stats.transformTime,
  pluginExecutions: result.stats.pluginExecutions
})
```

### 错误处理

每个插件的错误都会被捕获和记录：

```typescript
if (result.errors.length > 0) {
  console.error('转换错误:', result.errors)
}

if (result.warnings.length > 0) {
  console.warn('转换警告:', result.warnings)
}
```

## 🚀 未来规划

### 即将支持的特性

1. **v-if/v-else/v-else-if** - 条件渲染
2. **v-for** - 列表渲染
3. **v-show** - 显示隐藏
4. **slots** - 插槽系统
5. **provide/inject** - 依赖注入
6. **teleport** - 传送门
7. **suspense** - 异步组件
8. **transition** - 过渡动画

### 架构改进

1. **热重载支持** - 开发时插件热更新
2. **插件市场** - 第三方插件生态
3. **可视化调试** - 插件执行流程可视化
4. **性能分析** - 插件性能监控和优化建议

## 📝 贡献指南

欢迎贡献新的插件！请遵循以下步骤：

1. Fork 项目
2. 创建插件分支：`git checkout -b feature/new-plugin`
3. 实现插件逻辑
4. 添加测试用例
5. 更新文档
6. 提交 Pull Request

每个插件都应该包含：
- 完整的类型定义
- 单元测试
- 使用示例
- 性能基准测试
