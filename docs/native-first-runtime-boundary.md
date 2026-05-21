# Native-first Runtime Boundary

更新时间：2026-05-21

## 决策

FuckMP 的目标是把 Vue3 SFC 编译为原生微信小程序工程，而不是在小程序中运行一套完整 Vue runtime。

架构方向固定为：**Native-first + Thin Runtime**。

- 能稳定静态转换的 Vue 能力，必须输出到原生 `wxml / wxss / js / json`。
- 运行时只作为小程序 `setData` 与 Vue3 响应式写法之间的最小桥接。
- 不允许用未实现的 runtime 模块占位来宣称支持某项 Vue 能力。

## 平台版本基线

当前 Vue 相关依赖基线为 `vue@3.5.34`、`@vue/compiler-sfc@3.5.34`、`@vue/reactivity@3.5.34`；微信小程序目标保持原生 `Page / Component / WXML / WXSS / JSON`。详细记录见 `docs/latest-platform-baseline.md`。

## 当前运行时白名单

当前允许进入 `runtime-injection.js` 的能力只有：

| 能力 | 触发条件 | 说明 |
|---|---|---|
| `core` | 总是存在 | 提供初始化、`createPage/createComponent/createApp` 包装层 |
| `reactivity` | 使用 `ref/reactive/computed` | 提供当前已实现的 Proxy + `setData` 桥接 |

`<script setup>` 本身不触发响应式 runtime；只有实际使用 `ref/reactive/computed` 时才注入响应式代码。

## 必须走原生编译的能力

| Vue 能力 | 目标输出 | Runtime 边界 |
|---|---|---|
| `v-if / v-else-if / v-else` | `wx:if / wx:elif / wx:else` | 不注入 template runtime |
| `v-for` | `wx:for / wx:for-item / wx:key` | 不注入 template runtime |
| `v-bind / :prop` | 原生属性与 Mustache 表达式 | 不注入 bind runtime |
| `v-on / @event` | `bind:*` 或 `catch:*` | 不注入 event runtime |
| `v-model` | 属性 + 事件 handler | 不注入 v-model runtime |
| `defineProps` | `Component.properties` | 不注入 component runtime |
| `defineEmits` | `this.triggerEvent` | 不注入 event runtime |
| 生命周期 | Page/Component 原生生命周期 | 不注入 lifecycle runtime |
| 样式与 SCSS | `wxss` | 不注入 style runtime |

## 暂不宣称运行时支持

以下能力可以在源码中被识别，但不能仅靠 runtime 模块名宣称支持：

- `watch / watchEffect`
- `provide / inject`
- `defineExpose`
- slots / scoped slots
- transition / keep-alive

这些能力必须先有明确的原生编译方案或真实运行时实现，再更新支持状态。

## 回归约束

当前测试已固化以下边界：

- `RuntimeBundler.getRequiredModules()` 只返回 `core` 或 `core + reactivity`。
- 模板指令、事件、生命周期、props/emits、slots、provide/inject 不会引入 `template/event/lifecycle/component/di` 等伪模块。
- `RuntimeInjectionGenerator` 不会因为 `<script setup>` 本身生成 `ref/reactive/computed` runtime。

相关测试：

- `tests/runtime-injection.test.ts`
- `tests/compiler/runtime-injection-generator.test.ts`

## 后续开发顺序

1. 先补静态编译能力矩阵，尤其是 `v-for`、`v-model`、props/emits、生命周期和组件通信。
2. 每个能力必须先有 fixture/e2e 测试，再实现转换。
3. 只有当静态编译无法表达，且存在真实实现时，才允许扩展 thin runtime 白名单。
