# FuckMP

🚀 **FuckMP** - Vue3 微信小程序编译器，按 **Native-first + Thin Runtime** 为原则逐步支持 Vue3 SFC 与 SCSS 导入功能，目标是把 Vue3 SFC 编译为原生微信小程序工程，而不是在小程序中运行一套完整 Vue runtime。

将 Vue3 SFC 编译为原生微信小程序代码，让你用熟悉的 Vue3 语法开发小程序。

## ✨ 特性

- 🎯 **Vue3 SFC 语法支持**: Composition API 基础能力、`<script setup>`、TypeScript
- 🔄 **智能转换**: 自动将 Vue3 语法转换为小程序语法
- 🧩 **组件系统**: 支持组件导入、Props、Emits 基础转换、`defineModel` 双向绑定
- 🎰 **插槽支持**: default / named slots 原生映射，自动处理 `multipleSlots` 和 `styleIsolation`
- ⚡ **响应式运行时**: `ref`、`reactive`、`computed` 自动桥接到小程序 `setData`
- 🧮 **WXS 辅助模块**: 模板中的 `.includes()`、`.indexOf()` 等方法自动转换为 WXS 函数
- 🎨 **强大的样式处理**:
  - 支持 SCSS/Sass 预处理器
  - **JavaScript 导入样式**: `import './styles.scss'`
  - **Style 标签导入**: `@import './mixins.scss'`
  - 作用域样式 (scoped)，自动排除 slot/block 等控制标签
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

TS + SCSS 基础模板已纳入编译验收：模板写入临时项目后会由当前 `Vue3MiniprogramCompiler` 编译，并检查 app/page/component/runtime 关键产物与生成 JS 语法；覆盖 `tests/cli/create-templates.test.ts`。

已有真实项目迁移指南：`docs/migration-guide.md`。建议迁移前先阅读其中的 Native-first 边界、版本兼容策略和验证清单。

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

// ref - 自动桥接到小程序 setData
const message = ref('Hello World')

// reactive - 深层响应式对象
const state = reactive({
  user: { name: 'Vue3', age: 4 },
  loading: false
})

// computed - 自动计算并同步到视图
const displayName = computed(() => {
  return `${state.user.name} (${state.user.age}岁)`
})

// watch / watchEffect / onWatcherCleanup 当前按能力矩阵明确降级
</script>
```

> **响应式运行时工作原理**：编译器会自动生成 `runtime-injection.js`，将 `ref()` / `reactive()` / `computed()` 桥接到小程序的 `setData()` 调用。修改响应式变量时，数据会自动同步到 WXML 视图。`computed` 属性在页面加载后自动计算初始值，并在任何依赖的 `ref` / `reactive` 变量修改后自动重新计算。

### 模板中的 JS 方法调用

WXML 模板不支持 JavaScript 方法调用（如 `.includes()`），编译器会自动将它们转换为 WXS 辅助函数：

```vue
<template>
  <!-- Vue3 源码中直接使用 JS 方法 -->
  <checkbox :checked="items.includes('apple')" />
</template>
```

编译后自动生成 WXS 辅助模块并注入引用：

```xml
<!-- 编译器自动注入 -->
<wxs src="../helpers.wxs" module="wxsH" />

<!-- 方法调用自动转换 -->
<checkbox checked="{{wxsH.includes(items, 'apple')}}" />
```

当前支持的自动转换方法：`.includes()`、`.indexOf()`、`.toString()`、`.startsWith()`、`.endsWith()`。

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

# 开发模式 (build --watch 的别名，默认优化语义与 build 一致)
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

# CLI 短别名等价
fmp build --input src --output dist

# 禁用压缩 (默认启用)
fuckmp build --no-minify

# 显式启用压缩，可覆盖配置文件中的 minify: false
fuckmp build --config vue3mp.config.js --minify

# 启用 sourcemap (默认禁用)
fuckmp build --sourcemap

# 显式禁用 sourcemap，可覆盖配置文件中的 sourcemap: true
fuckmp build --config vue3mp.config.js --no-sourcemap

# 构建前清理输出目录
fuckmp build --clean

# 开发模式等价于 build --watch，支持常用 build 选项
fuckmp dev --config vue3mp.config.js
fuckmp dev --input src --output dist --sourcemap --no-minify
fuckmp dev --config vue3mp.config.js --minify --no-sourcemap
```

### 常见构建失败排查

`fuckmp build` 在编译失败时会输出 `诊断建议`，优先提示以下可操作方向：

- 输入/输出路径：检查 `--input`、`--output` 或 `vue3mp.config.js`，避免路径不存在、不可访问或输入输出等价。
- 明确降级能力：如果错误涉及 `defineExpose`、`watch/watchEffect/onWatcherCleanup`、`provide/inject`、`useTemplateRef`、`Transition/KeepAlive` 等能力，按 `docs/latest-platform-baseline.md` 与 `docs/migration-guide.md` 改写为微信原生生命周期、事件回调或显式状态流。
- AppID / DevTools：真实 DevTools 或真机验收需要合法微信小程序 AppID，并确认 `WECHAT_IDE_CLI` 指向微信开发者工具 CLI。
- SFC 语法：先缩小到单页面纵向切片，检查 `<template>`、`<script setup lang="ts">` 与 `<style>` 结构。

### 真实 DevTools opt-in 验收

默认测试不会启动微信开发者工具。需要验证真实示例能被 DevTools 自动化打开时，显式设置环境变量后运行：

```bash
WECHAT_IDE_CLI=/Applications/wechatwebdevtools.app/Contents/MacOS/cli \
FUCKMP_REAL_DEVTOOLS_SMOKE=1 \
pnpm test:real-devtools
```

该命令执行 `tsx scripts/real-miniprogram-devtools-smoke.ts`：先编译 `examples/real-miniprogram`，再调用微信开发者工具 CLI `auto`。未设置 `FUCKMP_REAL_DEVTOOLS_SMOKE=1` 时会安全跳过 GUI 调用。

### npm 包真实安装 opt-in 验收

默认测试不会执行真实 tarball 安装。需要从消费者视角验证发布包时，显式设置环境变量后运行：

```bash
FUCKMP_PACKAGE_SMOKE=1 pnpm test:package-smoke
```

该命令会先执行 `pnpm build`，再 `npm pack`，随后在临时项目中安装生成的 tarball 与 `vue@3.5.35`，验证根入口 `FuckMPCompiler / Vue3MiniprogramCompiler / createCompiler` 和 `fuckmp` / `fmp` CLI bin。

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

`FuckMPCompiler` 是根入口公开的友好别名，等价于 `Vue3MiniprogramCompiler`；也可以使用 `createCompiler()`、`compile()` 和 `compileFile()` 便捷函数。

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

- 当前 Vue3 基线：`vue@3.5.35`、`@vue/compiler-sfc@3.5.35`、`@vue/reactivity@3.5.35`。
- 目标小程序基线：原生微信小程序 `Page / Component / WXML / WXSS / JSON`。
- 最新基线与参考链接见 `docs/latest-platform-baseline.md`。

## 支持的 Vue3 特性

| 特性 | 支持状态 | 说明 |
|------|---------|------|
| `<script setup>` | ✅ | 基础解析与编译已覆盖，复杂宏按矩阵继续补齐 |
| Composition API | ✅ | 运行时桥接 ref, reactive, computed 到 setData；useId 已原生映射；watch/watchEffect 明确降级 |
| TypeScript | ✅ | 原生支持 |
| Props/Emits | ✅ | defineProps（内联/本地/import type）→ properties；defineEmits 事件名提取 |
| defineModel | ✅ | 组件 v-model 双向绑定，支持 tuple 修饰符 |
| 生命周期 | ✅ | 映射到小程序生命周期，不依赖 lifecycle runtime |
| 模板语法 | ✅ | v-if/v-for（无多余包裹）、v-show（hidden）、v-model、事件处理 |
| 样式 | ✅ | CSS, SCSS, 作用域样式（自动排除 slot/block 控制标签） |
| **SCSS 导入** | ✅ | **JavaScript 导入和 @import 语句** |
| 插槽 | ✅ | default / named slots 原生映射，自动 `multipleSlots` + `apply-shared` |
| **WXS 辅助** | ✅ | `.includes()` 等 JS 方法自动转换为 WXS 函数 |
| Provide/Inject | 明确降级 | 不生成 DI runtime 桥接，`inject()` 不落入 data |
| Teleport | ❌ | 小程序不支持 |
| Suspense | ❌ | 小程序不支持 |

### 最新 Vue 3.5 Native-first 边界

| 能力 | 当前状态 | 验证 |
|------|---------|------|
| `defineProps` type-based（内联 / 本地类型 / 相对 import type）/ `defineEmits` type-based（call signature / named tuple / 本地类型 / 相对 import type）/ `defineModel` / `defineModel` tuple 修饰符 / `withDefaults` / 响应式 props 解构 | 已原生映射 | `tests/e2e/define-props-type-based.test.ts`、`tests/e2e/typed-emits.test.ts`、`tests/e2e/native-v-model.test.ts`、`tests/e2e/with-defaults-props.test.ts`、`tests/e2e/reactive-props-destructure.test.ts` |
| 基础 slots / named slots | 已原生映射 | `tests/e2e/slots-provide-inject-boundary.test.ts` |
| scoped slots / dynamic slots | 明确降级 / 不宣称支持 | `tests/e2e/unsupported-template-boundary.test.ts` |
| `defineExpose` / `defineOptions` / `defineSlots` | 明确降级 | `tests/e2e/define-expose-degrade.test.ts`、`tests/e2e/define-options-degrade.test.ts`、`tests/e2e/define-slots-degrade.test.ts` |
| `watch` / `watchEffect` / `onWatcherCleanup` | 明确降级 | `tests/e2e/watcher-degrade.test.ts` |
| `useId` | 已原生映射 | `tests/e2e/use-id-native.test.ts` |
| `useTemplateRef` | 明确降级 | `tests/e2e/use-template-ref-degrade.test.ts` |
| `provide` / `inject` | 明确降级 | `tests/e2e/slots-provide-inject-boundary.test.ts` |
| `Transition` / `KeepAlive` | 明确降级 / 不宣称支持 | `tests/e2e/unsupported-template-boundary.test.ts` |

完整能力矩阵见 `docs/latest-platform-baseline.md`，runtime 边界见 `docs/native-first-runtime-boundary.md`。

## 贡献

欢迎提交 Issue 和 Pull Request！

## 许可证

MIT License
