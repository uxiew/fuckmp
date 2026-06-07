# 真实项目迁移指南

更新时间：2026-06-07

本文面向已有 Vue3 项目或小程序项目迁移到 FuckMP 的场景。迁移目标是把 Vue3 SFC 编译为原生微信小程序 `Page / Component / WXML / WXSS / JSON`，架构边界保持 **Native-first + Thin Runtime**：能静态映射的能力输出原生小程序代码，无法等价映射的 Vue runtime 语义必须明确降级，不用伪 runtime 冒充支持。

## 适用范围

适合迁移：

- 页面和组件主要使用 Vue3 SFC、`<script setup lang="ts">`、`ref` / `reactive` / `computed`。
- 交互能映射到微信原生事件、属性、生命周期和组件通信。
- 可接受 `watch/watchEffect`、复杂 DI、scoped/dynamic slots、`Transition`、`KeepAlive` 等能力按文档明确降级。

不适合直接迁移：

- 强依赖浏览器 DOM、Vue Router、Vue runtime 插件生态或 SSR hydration 的项目。
- 依赖 Vue template ref public instance、Teleport、Suspense 或复杂动态组件缓存语义的页面。

## 迁移步骤

1. **建立迁移分支和基线**
   - 保留原项目可运行分支。
   - 记录当前页面列表、组件依赖、全局样式、接口 mock 与运行截图。
   - 先选择一个低风险页面做纵向切片，不要一次迁完整应用。

2. **对齐目录结构**
   - 应用入口使用 `app.vue`。
   - 页面放入 `pages/**.vue`。
   - 组件放入 `components/**.vue`。
   - 以 `_` 开头的文件或目录会被跳过，可用于草稿和迁移中间态。

3. **接入配置**
   - 新建 `vue3mp.config.js`，至少配置 `input`、`output`、`appId`。
   - 推荐先保持 `minify: false` 与 `sourcemap: true`，便于对照生成产物。
   - CLI 构建使用 `fuckmp build --config vue3mp.config.js`，开发监听使用 `fuckmp dev --config vue3mp.config.js`。

4. **迁移页面模板**
   - `div/span/img/a` 等常见标签会映射到 `view/text/image/navigator`。
   - `v-if`、`v-for`、`:prop`、`@click`、`@input` 等会优先编译为 WXML 原生属性和事件。
   - 带参数事件会通过 `data-*` / dataset 传递；自定义组件事件 payload 从 `event.detail` 读取。

5. **迁移脚本逻辑**
   - 优先使用 `<script setup lang="ts">`。
   - 保留 `ref` / `reactive` / `computed`，它们由 thin runtime 的响应式桥接处理。
   - `defineProps`、`defineEmits`、`defineModel`、`withDefaults` 和响应式 props 解构已走原生映射。
   - 对明确降级能力，改写为小程序原生生命周期、事件回调或显式状态流。

6. **迁移样式**
   - 保留 `style lang="scss"` 与基础 `@import`。
   - 样式单位和 scoped 选择器由编译器处理。
   - 浏览器专属 CSS、复杂选择器或 DOM 伪类需要改为小程序可支持写法。

7. **编译与对照产物**
   - 运行 `pnpm type-check`、`pnpm test:run`、`pnpm build`。
   - 对照 `dist/**/*.wxml`、`dist/**/*.js`、`dist/**/*.json` 与原页面行为。
   - 真实示例可参考 `examples/real-miniprogram`。

8. **DevTools 验收**
   - 默认测试不启动微信开发者工具。
   - 已配置微信开发者工具 CLI 时，可运行：

```bash
WECHAT_IDE_CLI=/Applications/wechatwebdevtools.app/Contents/MacOS/cli \
FUCKMP_REAL_DEVTOOLS_SMOKE=1 \
pnpm test:real-devtools
```

该命令会先编译 `examples/real-miniprogram`，再调用 DevTools 自动化入口。真实业务项目仍需要合法 AppID、登录态和项目配置。

## Vue3 特性迁移策略

| Vue3 能力 | 迁移策略 |
|---|---|
| `<script setup>` / TypeScript | 直接保留，按最新 Vue SFC 编译入口解析。 |
| `ref` / `reactive` / `computed` | 保留；按需注入 `reactivity` 桥接。 |
| `defineProps<T>()` | 保留；映射到 `Component.properties`。 |
| `defineEmits` | 保留；映射到 `this.triggerEvent`。 |
| `defineModel` / 组件 `v-model` | 保留；输出属性绑定、input/change handler 与 `update:*` 事件。 |
| `withDefaults(defineProps())` | 保留静态默认值；写入 `Component.properties.value`。 |
| 响应式 props 解构 | 保留；默认值和别名会静态映射到原生 prop。 |
| 基础 slots / named slots | 保留；映射到微信原生 slot。 |
| `useId` | 可保留；映射到稳定原生 data id。 |
| `defineExpose` / `defineOptions` / `defineSlots` | 会明确降级；不要依赖其 Vue runtime 行为。 |
| `watch` / `watchEffect` / `onWatcherCleanup` | 会明确降级；迁移为显式事件、生命周期或 computed 派生状态。 |
| `provide` / `inject` | 会明确降级；迁移为 props/emits、全局配置或显式 store。 |
| scoped/dynamic slots、`Transition`、`KeepAlive` | 不宣称支持；改为原生条件渲染、CSS 状态或业务状态管理。 |

完整能力矩阵见 `docs/latest-platform-baseline.md`，runtime 边界见 `docs/native-first-runtime-boundary.md`。

## 版本兼容策略

当前基线：

- `vue@3.5.35`
- `@vue/compiler-sfc@3.5.35`
- `@vue/reactivity@3.5.35`

兼容原则：

1. Vue 相关依赖按同一个 minor/patch 基线一起升级，避免 SFC compiler、runtime peer 与 reactivity bridge 漂移。
2. `package.json`、`pnpm-lock.yaml`、`README.md`、`docs/latest-platform-baseline.md`、`docs/native-first-runtime-boundary.md` 和 `docs/TODO.md` 必须同步更新。
3. 升级前先用 `pnpm view vue version`、`pnpm view @vue/compiler-sfc version`、`pnpm view @vue/reactivity version` 校准当前最新版本。
4. 升级后必须跑 `pnpm type-check`、`pnpm test:run`、`pnpm build`、`git diff --check`。
5. 如果 Vue 新特性无法稳定映射到微信原生能力，应先进入“明确降级”状态，不能加入 thin runtime 白名单。

## 验证清单

迁移一个真实页面前后建议逐项检查：

- [ ] 页面和组件能被扫描到，输出 `.js/.json/.wxml/.wxss`。
- [ ] `app.json` 页面路径与组件 `usingComponents` 正确。
- [ ] WXML 中没有残留浏览器标签或 Vue-only 指令。
- [ ] JS 中没有残留 `defineProps()`、`defineModel()`、`defineExpose()` 等编译时宏调用。
- [ ] 自定义组件事件从 `event.detail` 获取 payload。
- [ ] 原生 input/change 事件从 `event.detail.value` 获取值。
- [ ] `runtime-injection.js` 只包含 `core` 和必要的 `reactivity`，没有伪 template/event/lifecycle/component/di 模块。
- [ ] `pnpm type-check` 通过。
- [ ] `pnpm test:run` 通过。
- [ ] `pnpm build` 通过。
- [ ] 必要时运行 `pnpm test:real-devtools` 做 opt-in DevTools 验收。

## 回滚建议

- 每次只迁移一个页面或一个组件族，保留原页面截图和输入数据。
- 迁移提交应按页面/能力拆分，避免混合大提交。
- 如果生成产物与预期不一致，优先回滚最近迁移提交，而不是在生成代码中手改。
- 对无法原生映射的 Vue 能力，先回退到明确业务状态流或小程序原生 API，再继续迁移其它页面。
