# Phase 1 P：真实样例与原生产物验收

| 验收项 | 结果 |
| --- | --- |
| 真实工程 | `real-miniprogram` 覆盖资料页、props/emits、v-model、插槽、图片和 WXS；`community-pickup` 覆盖组件预订事件、列表/条件渲染、响应式计数和非 Tab 页导航。TouchWX 迁移工程继续由现有 E2E 验收。 |
| 原生静态契约 | 两个示例通过 `tests/e2e/native-project-acceptance.test.ts`：检查注册、路由及依赖路径、JS/WXML/WXSS/JSON 基础语法、无 Vue 渲染器/DOM 或模拟 watcher/DI；用实际生成的 JS 驱动组件事件到 `setData`，不模拟视图。 |
| npm 安装 | `FUCKMP_PACKAGE_SMOKE=1 pnpm test:package-smoke` 通过：临时工程安装真实 tarball，由包内的 CLI 构建并核对落盘产物。 |
| 微信原生编译器 | P 验收时在 Ubuntu x86_64 通过 [Linux 社区构建 v2.02.2609250-1](https://github.com/msojocs/wechat-web-devtools-linux/releases/tag/v2.02.2609250-1) 的 `wcc` / `wcsc` 编译了两个示例当时的产物。下述 scoped 条件复现当时有诊断，修复后的产物已加静态回归测试，未重新运行微信原生编译器。 |
| 微信开发者工具模拟器／真机 | **NOT_RUN**。社区版 GUI 启动后停在微信扫码登录，未打开工程。其 `auto` 和 `open` 只打印通用帮助并以 0 退出，不能把脚本打印的「冒烟通过」视作模拟器已启动。未验证客户端渲染、导航、真机或上传。 |

## 复跑

```sh
pnpm type-check && pnpm build && pnpm test:run
FUCKMP_PACKAGE_SMOKE=1 pnpm test:package-smoke

pnpm cli:build --input examples/real-miniprogram --output test-output/real-miniprogram --app-id touristappid
pnpm cli:build --input examples/community-pickup --output test-output/community-pickup --app-id touristappid
```

如已取得微信原生编译器，将 `WECHAT_WCC`、`WECHAT_WCSC` 设为各自可执行文件的绝对路径，在任一示例的输出目录中运行：

```sh
"$WECHAT_WCC" -o /tmp/fuckmp-wcc.js $(find . \( -name '*.wxml' -o -name '*.wxs' \) | sort)
styles=$(find ./pages ./components -name '*.wxss' | sort)
"$WECHAT_WCSC" -lc -js -pc "$(printf '%s\n' "$styles" | wc -l)" \
  -o /tmp/fuckmp-wcsc.js $styles ./app.wxss
```

检查诊断和产物，不只看退出码：该版本的 `wcc` 对下述无效绑定打印错误但仍以 0 退出。模拟器可用后，再按各示例 README 做交互验收。

## 发现的问题与回归覆盖

以下用例使用上面的 CLI 命令构建；每条单独复现，输出目录用新的空目录。

### 1. Scoped 样式破坏含 `>` 的 WXML 属性（T，已修复）

在任意页面中使用：

```vue
<template><text v-if="reserved > 0">已预订</text></template>
<script setup>const reserved = 1</script>
<style scoped>text { color: green; }</style>
```

- 预期：`wx:if="{{reserved > 0}}"` 保持不变，`data-v-…` 在引号之外。
- 实际：`wx:if="{{reserved data-v-…> 0}}"`；`wcc` 报 ``Bad attr `wx:if` with message: unexpected token `data`.``。去掉 `scoped` 或改成不含 `>` 的条件不会触发。
- 区域：`src/generator/shared-generator-utils.ts` 的 `addScopeAttributes`（页面和组件都会调用）。
- 回归：社区自提示例直接使用该条件；验收断言生成的 WXML 表达式不变，scope 属性位于引号之外。

### 2. 模板引用的函数声明没有写入原生事件方法（S，待集成验证）

在社区自提示例的 `PickupOffer.vue` 中，将箭头函数改为声明；以下是去掉无关代码后的组件：

```vue
<template><button @click="reserve">预订</button></template>
<script setup lang="ts">
const emit = defineEmits<{ reserve: [] }>()
function reserve() { emit('reserve') }
</script>
```

- 预期：按钮绑定 `reserve`，原生组件的 `methods.reserve` 调用 `this.triggerEvent('reserve')`。
- 实际：WXML 仍是 `bind:tap="reserve"`，但生成 JS 的 `methods` 没有 `reserve`；改回箭头函数则生成该方法。页面同样可复现：将 `booking.vue` 的 `const reserveOffer = () => { … }` 改为 `function reserveOffer() { … }`，保留 WXML 绑定但丢失 Page 方法。
- 区域：`src/parser/script-parser-utils.ts` 的 `createFunctionInfo` 不带方法体；最终 `src/compiler/codegen/mini-program-options-generator.ts` 仅输出含字符串方法体的条目。

### 3. 无模板的应用入口使项目构建失败（T／共享生成接口，已修复）

社区自提示例的 `app.vue` 不包含 `template`，仅保留 `<script setup>` 的 `onMounted` 和应用样式。

- 预期：应用入口无需渲染模板，脚本和全局样式生成原生 `App` / `app.wxss`。
- 实际：CLI 返回失败，`app.vue` 报 `Cannot read properties of undefined (reading 'wxml')`。其余页面仍可生成，因此只检查输出目录存在会漏报。
- 区域：`src/compiler/compiler-transform-pipeline.ts` 只在有模板时填充 `template`，`src/compiler/compiler-generate-utils.ts` 将其传给组件生成，`src/generator/component-generator.ts` 读取 `templateResult.wxml`。
- 回归：入口不经过组件生成；验收检查 `App` 注册、生命周期代码以及 `app.wxss` 中的全局样式。

### 4. 自动 TabBar 生成无效配置或改变普通页面的导航类型（T／共享配置生成，已修复）

从社区自提示例移除 `vue3mp.config.json`，保留两个普通页面 `pages/booking.vue`、`pages/pickup-info.vue`。

- 预期：没有 TabBar 配置时，输出不包含 `tabBar`，普通 `navigateTo` 导航照常使用。
- 实际：`app.json` 包含只有颜色和边框样式、缺少必需 `list` 的 `tabBar`。另一复现：将两页改为 `pages/index/index.vue`、`pages/pickup-info/index.vue`（更新引用路径），两页会被自动列为 Tab 页，默认 `navigateTo` 不适用于 Tab 页。
- 区域：`src/config/user-config-utils.ts` 的默认配置与 `src/generator/config-generator-utils.ts` 的 `buildAppConfig` / `selectTabBarPages`。
- 回归：两种目录布局均保留页面和导航目标，不生成 `tabBar`。只从显式列表选择实际存在的主包页面，少于两个时不生成标签栏。
