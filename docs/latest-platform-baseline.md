# Latest Platform Baseline

更新时间：2026-05-21

## 当前基线

本项目的目标基线是：使用当前最新 Vue 3 SFC 编译能力，输出原生微信小程序工程。

| 范围 | 当前采用 | 事实来源 |
|---|---:|---|
| Vue runtime / peer | `vue@3.5.34` | `peerDependencies.vue` + `npm view vue version` |
| Vue SFC compiler | `@vue/compiler-sfc@3.5.34` | `dependencies.@vue/compiler-sfc` + `npm view @vue/compiler-sfc version` |
| Vue reactivity bridge | `@vue/reactivity@3.5.34` | `dependencies.@vue/reactivity` + `npm view @vue/reactivity version` |
| 微信小程序目标 | 原生 `Page / Component / WXML / WXSS / JSON` | 微信开放文档 |

## Vue 3.5 编译能力约束

基于 Vue 官方 `<script setup>` API，当前需要纳入能力矩阵的宏包括：

- `defineProps`
- `defineEmits`
- `defineModel`
- `withDefaults`
- `defineExpose`
- `defineOptions`
- `defineSlots`
- 基础 slots / named slots
- `provide` / `inject`
- 响应式 props 解构（Vue 3.5+）
- `useTemplateRef`（Vue 3.5+）
- `useId`（Vue 3.5+）
- `watch` / `watchEffect` / `onWatcherCleanup`（Vue 3.5+ watcher cleanup）

`tests/parser/sfc-parser-latest-vue.test.ts` 用于确认这些宏可以通过 `@vue/compiler-sfc` 的 `compileScript` 入口处理。该测试只证明“最新 Vue SFC 编译入口兼容”；原生小程序语义转换必须以对应 e2e/回归测试为准。

## 当前已验证的原生映射状态

| Vue 3.5 能力 | 当前状态 | 原生输出/降级策略 | 主要验证 |
|---|---|---|---|
| `defineModel` + 组件 `v-model` | 已原生映射 | 子组件生成 `Component.properties`、input handler 和 `this.triggerEvent('update:*')`；父级生成属性绑定与 `bind:update:*` 回写 handler | `tests/e2e/native-v-model.test.ts` |
| `withDefaults(defineProps())` | 已原生映射 | 静态默认值和数组/对象 factory 静态返回值写入 `Component.properties.value` | `tests/e2e/with-defaults-props.test.ts` |
| Vue 3.5 响应式 props 解构 | 已原生映射 | 解构默认值合并到 `Component.properties`；模板中的局部别名静态还原为原始 prop 名 | `tests/e2e/reactive-props-destructure.test.ts` |
| `defineExpose` | 明确降级 | 微信原生目标无 Vue template ref public instance 等价语义；产物输出降级注释和 exposed keys，不生成运行时桥接 | `tests/e2e/define-expose-degrade.test.ts` |
| `defineOptions` | 明确降级 | 微信原生目标无完整 Vue component options 合并等价语义；产物输出降级注释和 option keys，不生成运行时桥接 | `tests/e2e/define-options-degrade.test.ts` |
| `defineSlots` | 类型宏擦除 / 明确降级 | 当前不暴露 Vue slots 对象桥接；产物输出降级注释并擦除 `defineSlots()` 变量，不生成运行时桥接 | `tests/e2e/define-slots-degrade.test.ts` |
| 基础 slots / named slots | 已原生映射 | `<slot>` 与 `<slot name=...>` 保留为微信原生 slot；组件 JSON 自动启用 `options.multipleSlots` | `tests/e2e/slots-provide-inject-boundary.test.ts` |
| `provide` / `inject` | 明确降级 | Vue 依赖注入依赖组件/app 实例树；产物输出降级注释，不生成 DI runtime 桥接，不让 `inject()` 落入 data | `tests/e2e/slots-provide-inject-boundary.test.ts` |
| `watch` / `watchEffect` / `onWatcherCleanup` | 明确降级 | Vue watcher 副作用调度与 Vue 3.5 watcher cleanup 依赖 Vue runtime；产物输出降级注释，不生成 watcher runtime 桥接 | `tests/e2e/watcher-degrade.test.ts` |
| `useId` | 已原生映射 | 非 SSR 微信原生目标下编译为稳定 `data` id；组件实例在 `attached` 中追加实例级唯一后缀，不生成 ID runtime 模块 | `tests/e2e/use-id-native.test.ts` |
| `useTemplateRef` | 明确降级 | 微信原生目标无 Vue template ref / DOM 或组件实例等价桥接；产物输出降级注释和 template refs，不生成运行时代理 | `tests/e2e/use-template-ref-degrade.test.ts` |

## 原生微信小程序输出约束

原生输出必须继续以微信官方能力为目标：

- 页面使用 `Page(Object)`，包含 `data`、生命周期和事件处理函数。
- 组件使用 `Component(Object)`，包含 `properties`、`data`、`observers`、`methods` 和组件生命周期。
- 模板使用 WXML 的数据绑定、列表渲染和条件渲染。
- 事件使用 WXML 事件系统。

## 后续能力推进顺序

1. 已完成：`defineModel` + `v-model` 原生闭环。
2. 已完成：`withDefaults(defineProps())` 默认值原生映射。
3. 已完成：Vue 3.5 响应式 props 解构默认值与别名映射。
4. 已完成：`defineExpose` 在微信原生目标下明确降级。
5. 已完成：`defineOptions` 在微信原生目标下明确降级。
6. 已完成：`defineSlots` 在微信原生目标下类型宏擦除 / 明确降级。
7. 已完成：基础 slots / named slots 原生映射，`provide/inject` 明确降级。
8. 已完成：`watch/watchEffect` / `onWatcherCleanup` 在微信原生目标下明确降级。
9. 已完成：Vue 3.5 `useId` 在微信原生目标下原生稳定 ID 映射。
10. 已完成：Vue 3.5 `useTemplateRef` 在微信原生目标下明确降级。

补充约束：不得用旧版页面内联 `watch` 轮询 helper 代替 Vue 3.5 语义；除非真实实现 Vue watcher 调度与 cleanup 语义，否则 `watch/watchEffect/onWatcherCleanup` 不得进入 thin runtime 白名单。

## 参考链接

- Vue `<script setup>` API: https://vuejs.org/api/sfc-script-setup
- 微信 WXML: https://developers.weixin.qq.com/miniprogram/dev/framework/view/wxml/
- 微信事件系统: https://developers.weixin.qq.com/miniprogram/dev/framework/view/wxml/event.html
- 微信 Page 构造器: https://developers.weixin.qq.com/miniprogram/dev/reference/api/Page.html
- 微信 Component 构造器: https://developers.weixin.qq.com/miniprogram/dev/reference/api/Component.html
