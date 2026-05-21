# FuckMP

🚀 **FuckMP** - Vue3 微信小程序编译器，按 Native-first 原则逐步支持 Vue3 SFC 与 SCSS 导入功能。

将 Vue3 单文件组件编译为原生微信小程序代码，让你用熟悉的 Vue3 语法开发小程序。

## ✨ 特性

- 🎯 **Vue3 SFC 语法支持**: Composition API 基础能力、`<script setup>`、TypeScript
- 🔄 **智能转换**: 自动将 Vue3 语法转换为小程序语法
- 🧩 **组件系统**: 支持组件导入、Props、Emits 基础转换，插槽按小程序能力继续补齐
- 🎨 **强大的样式处理**:
  - 支持 SCSS/Sass 预处理器
  - **JavaScript 导入样式**: `import './styles.scss'`
  - **Style 标签导入**: `@import './mixins.scss'`
  - 作用域样式 (scoped)
  - 嵌套样式和变量
- 🛣️ **智能路径解析**: 相对路径、别名、组件引用
- 🔧 **优秀的开发体验**: 热重载、错误提示、调试支持
- ⚡ **高性能**: 增量编译、缓存优化
- 🚫 **智能过滤**: 自动跳过以 `_` 开头的文件和目录
- 📦 **生产优化**: Build 模式默认启用压缩，禁用 sourcemap

## 快速开始

### 安装

```bash
npm install -g fuckmp
# 或
pnpm add -g fuckmp
```

### 创建项目

```bash
# 创建新项目
fuckmp create my-miniprogram

# 使用 TypeScript 模板
fuckmp create my-miniprogram --typescript --scss

cd my-miniprogram
pnpm install
```

### 开发

```bash
# 开发模式 (监听文件变化)
pnpm dev

# 构建项目
pnpm build

# 生产构建
pnpm build:prod
```

## 项目结构

```
src/
├── app.vue              # 应用入口
├── pages/               # 页面目录
│   └── index/
│       └── index.vue    # 首页
├── components/          # 组件目录
│   └── HelloWorld.vue   # 示例组件
└── utils/               # 工具函数
```

## Vue3 语法支持

### Composition API

```vue
<template>
  <view class="counter">
    <text>{{ count }}</text>
    <button @tap="increment">+1</button>
  </view>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'

const count = ref(0)
const doubleCount = computed(() => count.value * 2)

const increment = () => {
  count.value++
}

onMounted(() => {
  console.log('组件已挂载')
})
</script>
```

### Props 和 Emits

```vue
<template>
  <view @tap="handleClick">
    <text>{{ title }}</text>
  </view>
</template>

<script setup lang="ts">
interface Props {
  title: string
  count?: number
}

const props = defineProps<Props>()

const emit = defineEmits<{
  click: [value: number]
  update: [data: any]
}>()

const handleClick = () => {
  emit('click', props.count || 0)
}
</script>
```

### 响应式数据

```vue
<script setup lang="ts">
import { ref, reactive, computed } from 'vue'

// ref
const message = ref('Hello World')

// reactive
const state = reactive({
  user: { name: 'Vue3', age: 4 },
  loading: false
})

// computed
const displayName = computed(() => {
  return `${state.user.name} (${state.user.age}岁)`
})

// watch / watchEffect / onWatcherCleanup 当前按能力矩阵明确降级
</script>
```

## 🎨 SCSS 导入功能

FuckMP 支持两种 SCSS 导入方式，让你可以更好地组织样式代码：

### 1. JavaScript 中导入样式

```vue
<template>
  <view class="my-component">
    <text class="global-text">使用全局样式</text>
  </view>
</template>

<script setup lang="ts">
// 导入全局样式文件
import '../assets/css/global.scss'
import '../assets/css/variables.scss'

// 组件逻辑...
</script>

<style lang="scss" scoped>
.my-component {
  padding: 20rpx;
}
</style>
```

### 2. Style 标签中导入样式

```vue
<template>
  <view class="styled-component">
    <text class="primary-text">主要文本</text>
  </view>
</template>

<script setup lang="ts">
// 组件逻辑...
</script>

<style lang="scss" scoped>
// 导入变量和混合宏
@import '../assets/css/variables.scss';
@import '../assets/css/mixins.scss';

.styled-component {
  @include flex-center;
  background: $primary-color;

  .primary-text {
    color: $text-color;
    font-size: $font-size-large;
  }
}
</style>
```

### 3. 样式文件组织示例

```scss
// assets/css/variables.scss
$primary-color: #007aff;
$secondary-color: #5ac8fa;
$font-size-base: 28rpx;
$padding-base: 20rpx;

// assets/css/mixins.scss
@import './variables.scss';

@mixin flex-center {
  display: flex;
  align-items: center;
  justify-content: center;
}

@mixin button-style($bg: $primary-color) {
  background: $bg;
  border-radius: 8rpx;
  padding: $padding-base;
}

// assets/css/global.scss
@import './variables.scss';
@import './mixins.scss';

.global-container {
  @include flex-center;
  min-height: 100vh;
}

.global-button {
  @include button-style($secondary-color);
}
```

### 特性说明

- ✅ **嵌套导入**: 支持 SCSS 文件中的 `@import` 语句
- ✅ **变量共享**: 导入的变量可在整个组件中使用
- ✅ **混合宏**: 支持 `@mixin` 和 `@include`
- ✅ **路径解析**: 智能解析相对路径和绝对路径
- ✅ **编译优化**: 自动去重和合并样式

## 🚫 文件过滤功能

FuckMP 会自动跳过以 `_` 开头的文件和目录，这些文件不会被编译到最终输出中。

### 使用场景

```
src/
├── components/
│   ├── UserCard.vue          ✅ 会被编译
│   ├── _TestComponent.vue    ❌ 不会被编译 (文件名以 _ 开头)
│   └── _draft/               ❌ 整个目录都不会被编译
│       └── DraftComponent.vue
├── pages/
│   ├── index/
│   │   └── index.vue         ✅ 会被编译
│   ├── _test/                ❌ 不会被编译 (目录名以 _ 开头)
│   │   └── index.vue
│   └── profile/
│       └── index.vue         ✅ 会被编译
```

### 适用场景

- 🧪 **测试文件**: `_TestComponent.vue`
- 📝 **草稿文件**: `_DraftPage.vue`
- 🚧 **开发中的功能**: `_experimental/`
- 📚 **文档组件**: `_examples/`

## 编译配置

创建 `vue3mp.config.js` 配置文件：

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
  },
  optimization: {
    minify: false,
    sourcemap: true,
    incremental: true
  }
}
```

## CLI 命令

```bash
# 创建项目
fuckmp create <project-name> [options]

# 构建项目 (默认启用压缩，禁用 sourcemap)
fuckmp build [options]

# 开发模式 (默认禁用压缩，启用 sourcemap)
fuckmp dev [options]

# 分析项目
fuckmp analyze [options]

# 清理输出
fuckmp clean [options]

# 配置管理
fuckmp config [options]
```

### 构建选项

```bash
# 基本构建
fuckmp build --input src --output dist

# 禁用压缩 (默认启用)
fuckmp build --no-minify

# 启用 sourcemap (默认禁用)
fuckmp build --sourcemap

# 构建前清理输出目录
fuckmp build --clean
```

## API 使用

```typescript
import { FuckMPCompiler } from 'fuckmp'

const compiler = new FuckMPCompiler({
  input: 'src',
  output: 'dist',
  appId: 'your-app-id'
})

// 编译整个项目
const result = await compiler.compile()

// 编译单个文件
await compiler.compileFile('src/pages/index/index.vue')

// 监听模式
await compiler.watch()
```

架构边界：

- 项目目标是 **Native-first + Thin Runtime**：优先输出原生微信小程序 `wxml / wxss / js / json`，运行时只保留必要桥接。
- 模板指令、事件、props/emits、生命周期和样式默认走原生编译输出，不允许用伪 runtime 模块占位。
- 当前运行时白名单仅包含 `core` 与按需 `reactivity`；`ref/reactive/computed` 触发响应式桥接，`<script setup>` 本身不触发响应式运行时。
- 详细边界见 `docs/native-first-runtime-boundary.md`。

导入边界：

- 当前 public surface 是包根入口 `fuckmp` 与 CLI 命令 `fuckmp` / `fmp`。
- 运行时能力通过根入口命名导出提供，例如 `Vue3MiniRuntime`、`initVue3Runtime`、`definePage`、`defineComponent`。
- `fuckmp/runtime` 等 runtime 子路径不是 public surface；小程序产物运行时由编译器生成 `runtime-injection.js` 并注入。
- 若未来需要支持 runtime 子路径导入，必须先在 `package.json` 中显式声明 `exports`，并补充兼容测试。

## 平台基线

- 当前 Vue3 基线：`vue@3.5.34`、`@vue/compiler-sfc@3.5.34`、`@vue/reactivity@3.5.34`。
- 目标小程序基线：原生微信小程序 `Page / Component / WXML / WXSS / JSON`。
- 最新基线与参考链接见 `docs/latest-platform-baseline.md`。

## 支持的 Vue3 特性

| 特性 | 支持状态 | 说明 |
|------|---------|------|
| `<script setup>` | ✅ | 基础解析与编译已覆盖，复杂宏按矩阵继续补齐 |
| Composition API | 🚧 | 当前运行时桥接白名单为 ref, reactive, computed；useId 已原生映射，watch/watchEffect/onWatcherCleanup/provide/inject 明确降级 |
| TypeScript | ✅ | 原生支持 |
| Props/Emits | 🚧 | defineProps, defineEmits 基础转换，继续按原生输出矩阵补齐 |
| 生命周期 | ✅ | 映射到小程序生命周期，不依赖 lifecycle runtime |
| 模板语法 | 🚧 | v-if, v-for, v-model, 事件处理按原生 WXML/JS 输出逐步补齐 |
| 样式 | ✅ | CSS, SCSS, 作用域样式 |
| **SCSS 导入** | ✅ | **JavaScript 导入和 @import 语句** |
| 插槽 | 🚧 | 基础 slots / named slots 已原生映射；scoped/dynamic slots 不宣称支持 |
| Provide/Inject | 明确降级 | 不生成 DI runtime 桥接，`inject()` 不落入 data |
| Teleport | ❌ | 小程序不支持 |
| Suspense | ❌ | 小程序不支持 |

### 最新 Vue 3.5 Native-first 边界

| 能力 | 当前状态 | 验证 |
|------|---------|------|
| `defineModel` / `defineModel` tuple 修饰符 / `withDefaults` / 响应式 props 解构 | 已原生映射 | `tests/e2e/native-v-model.test.ts`、`tests/e2e/with-defaults-props.test.ts`、`tests/e2e/reactive-props-destructure.test.ts` |
| 基础 slots / named slots | 已原生映射 | `tests/e2e/slots-provide-inject-boundary.test.ts` |
| `defineExpose` / `defineOptions` / `defineSlots` | 明确降级 | `tests/e2e/define-expose-degrade.test.ts`、`tests/e2e/define-options-degrade.test.ts`、`tests/e2e/define-slots-degrade.test.ts` |
| `watch` / `watchEffect` / `onWatcherCleanup` | 明确降级 | `tests/e2e/watcher-degrade.test.ts` |
| `useId` | 已原生映射 | `tests/e2e/use-id-native.test.ts` |
| `useTemplateRef` | 明确降级 | `tests/e2e/use-template-ref-degrade.test.ts` |
| `provide` / `inject` | 明确降级 | `tests/e2e/slots-provide-inject-boundary.test.ts` |

完整能力矩阵见 `docs/latest-platform-baseline.md`，runtime 边界见 `docs/native-first-runtime-boundary.md`。

## 贡献

欢迎提交 Issue 和 Pull Request！

## 许可证

MIT License
