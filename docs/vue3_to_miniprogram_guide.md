# FuckMP 编译转换指南

## 📋 概述

本指南详细说明 FuckMP 编译器如何将 Vue3 单文件组件 (SFC) 自动转换为微信小程序原生代码。与手动迁移不同，以下转换全部由编译器自动完成——你只需用 Vue3 语法编写代码。

## 🔄 编译产物结构

每个 Vue SFC 文件被编译为 4 个小程序原生文件：

```
# Vue3 源文件
pages/index/index.vue

# 编译产物
pages/index/index.js      # 逻辑（Page/Component 配置）
pages/index/index.wxml    # 模板（WXML）
pages/index/index.wxss    # 样式（CSS/SCSS → WXSS）
pages/index/index.json    # 配置（usingComponents 等）
```

此外，编译器会在输出根目录生成：

```
app.js                     # 应用入口
app.json                   # 应用配置（页面路由）
app.wxss                   # 全局样式
runtime-injection.js       # 响应式运行时（ref/reactive/computed 桥接）
helpers.wxs                # WXS 辅助模块（当模板中使用了 JS 方法时自动生成）
```

## 🏗️ 模板语法转换

### 标签映射

编译器自动将 HTML/Vue 标签转换为小程序原生标签：

| Vue3 标签 | 小程序标签 | 说明 |
|---------|-----------|------|
| `<div>` | `<view>` | 块级容器 |
| `<span>` | `<text>` | 行内文本 |
| `<img>` | `<image>` | 图片，`:src` → `src`，`@load`/`@error` 原生映射 |
| `<a href>` | `<navigator url>` | 页面导航 |
| `<input>` | `<input>` | 输入框，支持 `:value`、`@input`、`@focus`、`@blur` |
| `<textarea>` | `<textarea>` | 多行输入 |
| `<button>` | `<button>` | 按钮 |

### 事件绑定

| Vue3 事件 | 编译结果 | 说明 |
|---------|---------|------|
| `@click="handler"` | `bind:tap="handler"` | 点击事件 |
| `@click.stop="handler"` | `catch:tap="handler"` | 阻止冒泡 |
| `@click.capture="handler"` | `capture-bind:tap="handler"` | 捕获阶段 |
| `@click.capture.stop="handler"` | `capture-catch:tap="handler"` | 捕获 + 阻止 |
| `@input="handler"` | `bind:input="handler"` | 输入事件 |
| `@touchstart="handler"` | `bind:touchstart="handler"` | 触摸事件 |
| `@longtap="handler"` | `bind:longtap="handler"` | 长按事件 |

### 条件渲染 (v-if)

编译器会智能处理条件渲染，**不产生多余包裹元素**：

```vue
<!-- Vue3 源码 -->
<template>
  <view v-if="isActive" class="active">活跃</view>
  <view v-else class="inactive">非活跃</view>
</template>
```

```xml
<!-- 编译结果：直接在元素上注入 wx:if，无多余 view 包裹 -->
<view wx:if="{{isActive}}" class="active">活跃</view>
<view wx:else class="inactive">非活跃</view>
```

当条件分支有**多个子节点**时，才使用 `<block>` 包裹：

```xml
<!-- 多子节点时使用 block -->
<block wx:if="{{showDetail}}">
  <text>标题</text>
  <text>内容</text>
</block>
```

### 列表渲染 (v-for)

同样，`v-for` 直接在子元素上注入指令：

```vue
<!-- Vue3 源码 -->
<template>
  <view v-for="(item, index) in items" :key="item.id">
    {{ item.name }}
  </view>
</template>
```

```xml
<!-- 编译结果 -->
<view wx:for="{{items}}" wx:for-item="item" wx:for-index="index" wx:key="id">
  {{item.name}}
</view>
```

### 显示控制 (v-show)

```vue
<view v-show="visible">内容</view>
```

```xml
<view hidden="{{!(visible)}}">内容</view>
```

### 双向绑定 (v-model)

```vue
<input v-model="username" />
```

```xml
<input value="{{username}}" bind:input="handleUsernameInput" />
```

## 🧮 WXS 辅助模块

WXML 模板不支持 JavaScript 方法调用。编译器会自动检测模板中的 JS 方法调用，将其转换为 WXS 辅助函数，并在需要时自动生成 `helpers.wxs` 文件和注入引用。

### 自动转换的方法

| Vue3 模板表达式 | 编译后 WXS 调用 |
|---------------|----------------|
| `items.includes('a')` | `wxsH.includes(items, 'a')` |
| `str.indexOf('x')` | `wxsH.indexOf(str, 'x')` |
| `val.toString()` | `wxsH.toString(val)` |
| `str.startsWith('pre')` | `wxsH.startsWith(str, 'pre')` |
| `str.endsWith('suf')` | `wxsH.endsWith(str, 'suf')` |

### 使用示例

```vue
<template>
  <!-- 你可以直接在 Vue3 模板中使用 JS 方法 -->
  <checkbox :checked="selectedItems.includes('email')" />
  <view v-if="name.startsWith('admin')">管理员</view>
</template>
```

编译后：

```xml
<wxs src="../helpers.wxs" module="wxsH" />
<checkbox checked="{{wxsH.includes(selectedItems, 'email')}}" />
<view wx:if="{{wxsH.startsWith(name, 'admin')}}">管理员</view>
```

> **注意**：WXS 引用路径会根据页面/组件在输出目录中的实际深度自动计算。

## ⚡ 响应式系统

### ref / reactive / computed

编译器会将 Vue3 响应式 API 自动桥接到小程序的 `setData()` 调用。

```vue
<script setup lang="ts">
import { ref, reactive, computed } from 'vue'

const count = ref(0)
const user = reactive({ name: '张三', age: 25 })
const displayName = computed(() => `${user.name} (${user.age}岁)`)

const increment = () => {
  count.value++
}
</script>
```

**编译行为**：

1. **data 初始值**：`ref(0)` → `data: { count: 0 }`
2. **运行时 Proxy**：页面 `onLoad` 时，运行时为每个 ref/reactive 创建 Proxy
3. **自动 setData**：修改 `count.value` 时，自动调用 `this.setData({ count: newValue })`
4. **computed 同步**：任何 ref/reactive 修改后，自动重新计算所有 computed 属性

### 方法中访问响应式变量

在方法中修改 ref 变量时使用 `.value`：

```vue
<script setup lang="ts">
const count = ref(0)

// 编译后方法中 this.count 是 Proxy，.value 赋值触发 setData
const increment = () => {
  count.value++
}
</script>
```

## 🧩 组件系统

### Props (defineProps)

```vue
<script setup lang="ts">
interface Props {
  title: string
  count?: number
}

const props = defineProps<Props>()
</script>
```

编译为 Component properties：

```javascript
Component({
  properties: {
    title: { type: String },
    count: { type: Number, value: undefined }
  }
})
```

### Emits (defineEmits)

```vue
<script setup lang="ts">
const emit = defineEmits<{
  click: [value: number]
  update: [data: any]
}>()

const handleClick = () => {
  emit('click', 42)
}
</script>
```

编译为 `triggerEvent` 调用：

```javascript
Component({
  methods: {
    handleClick() {
      this.triggerEvent('click', 42)
    }
  }
})
```

### 双向绑定 (defineModel)

```vue
<!-- 子组件 CounterInput.vue -->
<script setup lang="ts">
const modelValue = defineModel<string>()
const count = defineModel<number>('count')
</script>

<!-- 父页面使用 -->
<counter-input v-model="displayName" v-model:count="visitCount" />
```

编译后父页面自动生成 `_handleUpdate_xxx` 方法处理 `update:modelValue` 事件。

### 插槽 (Slots)

```vue
<!-- SlotPanel.vue -->
<template>
  <view class="panel">
    <slot name="header" />
    <slot />  <!-- 默认插槽 -->
  </view>
</template>
```

```vue
<!-- 使用插槽 -->
<slot-panel>
  <template #header>
    <text>标题</text>
  </template>
  <text>默认内容</text>
</slot-panel>
```

**编译器自动处理**：

- 含 slot 的组件在生成的 JS 中向 `Component()` 传入 `options: { multipleSlots: true }`，该选项不写入组件 JSON
- 组件 JSON 中设置 `styleIsolation: "apply-shared"`（确保父页面样式能穿透到 slot 内容）
- `<slot>` 和 `<block>` 标签不添加 `data-v-` scoped 属性

## 🎨 样式处理

### Scoped 样式

```vue
<style lang="scss" scoped>
.container {
  padding: 20rpx;
}
</style>
```

编译器为每个元素添加 `data-v-xxxxx` 属性，并在样式选择器中添加对应的属性选择器。

**例外**：`<slot>`、`<block>`、`<template>` 等控制标签不添加 scoped 属性。

### SCSS 导入

两种导入方式均受支持：

```vue
<script setup>
// JavaScript 中导入
import '../assets/global.scss'
</script>

<style lang="scss" scoped>
// Style 标签中导入
@import '../assets/variables.scss';
@import '../assets/mixins.scss';

.component {
  @include flex-center;
  color: $primary-color;
}
</style>
```

## 🔄 生命周期映射

### 页面生命周期

| Vue3 | 小程序 Page | 说明 |
|------|------------|------|
| `onMounted` | `onLoad` | 页面加载 |
| `onUnmounted` | `onUnload` | 页面卸载 |
| — | `onShow` | 直接使用原生钩子 |
| — | `onHide` | 直接使用原生钩子 |
| — | `onPullDownRefresh` | 下拉刷新 |

### 组件生命周期

| Vue3 | 小程序 Component | 说明 |
|------|-----------------|------|
| `onMounted` | `attached` | 组件挂载 |
| `onUnmounted` | `detached` | 组件卸载 |

### App 生命周期

| Vue3 (app.vue) | 小程序 App | 说明 |
|----------------|-----------|------|
| `onMounted` | `onLaunch` | 应用启动（同步执行） |

## ⚙️ 编译配置

### 配置文件

创建 `vue3mp.config.js`：

```javascript
module.exports = {
  input: 'src',
  output: 'dist',
  appId: 'your-app-id',
  features: {
    scriptSetup: true,
    typescript: true,
    scss: true,
    compositionApi: true,
    emits: true,
    slots: true
  }
}
```

详细配置选项参见 [配置指南](config-guide.md)。

### CLI 命令

```bash
# 构建
fuckmp build --input src --output dist

# 开发模式（监听变化）
fuckmp dev --input src --output dist

# 简写别名
fmp build --input src --output dist
```

## ⚠️ 已知限制

### 明确降级（不支持）

| 特性 | 状态 | 替代方案 |
|------|------|---------|
| `watch` / `watchEffect` | 降级 | 在方法中手动处理 |
| `provide` / `inject` | 降级 | 使用全局状态或 props 传递 |
| `defineExpose` | 降级 | 使用 triggerEvent 通信 |
| `Teleport` | 不支持 | 小程序无等价能力 |
| `Suspense` | 不支持 | 使用 loading 状态管理 |
| `Transition` / `KeepAlive` | 不支持 | 使用 CSS 动画或条件渲染 |
| Scoped slots | 不支持 | 使用 props + 事件替代 |
| Dynamic slots | 不支持 | 使用固定具名插槽 |

### 模板表达式限制

WXML 模板中的 JavaScript 能力有限，以下情况需要注意：

- ✅ `.includes()` / `.indexOf()` 等方法：**编译器自动转换为 WXS**
- ❌ 箭头函数表达式：不支持
- ❌ 可选链 `?.`：不支持
- ❌ 空值合并 `??`：不支持
- ❌ 解构赋值：不支持

建议将复杂表达式放在 `computed` 中处理。

## 📂 项目结构约定

```
src/
├── app.vue                 # 应用入口
├── pages/                  # 页面目录
│   ├── index/
│   │   └── index.vue       # 首页（pages/index/index）
│   └── profile.vue         # 资料页（pages/profile）
├── components/             # 组件目录
│   ├── UserCard.vue        # 用户卡片组件
│   └── _DraftComponent.vue # ❌ 下划线开头，不会编译
└── assets/                 # 静态资源和样式
    └── css/
        └── global.scss
```

- 页面文件放在 `pages/` 目录下
- 组件文件放在 `components/` 目录下
- 以 `_` 开头的文件和目录自动跳过编译
- 支持嵌套页面路由（如 `pages/index/index.vue` 和 `pages/profile.vue`）