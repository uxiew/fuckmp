# Latest Platform Baseline

更新时间：2026-05-21

## 当前基线

本项目的目标基线是：使用当前最新 Vue 3 SFC 编译能力，输出原生微信小程序工程。

| 范围 | 当前采用 | 事实来源 |
|---|---:|---|
| Vue runtime / peer | `vue@3.5.34` | `npm view vue version` |
| Vue SFC compiler | `@vue/compiler-sfc@3.5.34` | `npm view @vue/compiler-sfc version` |
| Vue reactivity bridge | `@vue/reactivity@3.5.34` | `npm view @vue/reactivity version` |
| 微信小程序目标 | 原生 `Page / Component / WXML / WXSS / JSON` | 微信开放文档 |

## Vue 3.5 编译能力约束

基于 Vue 官方 `<script setup>` API，当前需要纳入能力矩阵的宏包括：

- `defineProps`
- `defineEmits`
- `defineModel`
- `withDefaults`
- `defineExpose`
- 响应式 props 解构（Vue 3.5+）

当前新增 `tests/parser/sfc-parser-latest-vue.test.ts`，用于确认这些宏可以通过 `@vue/compiler-sfc` 的 `compileScript` 入口处理。该测试只证明“最新 Vue SFC 编译入口兼容”，不等价于这些宏已经全部完成原生小程序语义转换。

## 原生微信小程序输出约束

原生输出必须继续以微信官方能力为目标：

- 页面使用 `Page(Object)`，包含 `data`、生命周期和事件处理函数。
- 组件使用 `Component(Object)`，包含 `properties`、`data`、`observers`、`methods` 和组件生命周期。
- 模板使用 WXML 的数据绑定、列表渲染和条件渲染。
- 事件使用 WXML 事件系统。

## 后续能力推进顺序

1. `defineModel` + `v-model` 原生闭环：生成 `properties`、`update:*` 事件和 input/change handler。
2. `withDefaults(defineProps())`：生成带默认值的 `Component.properties`。
3. 响应式 props 解构：编译输出中保持 props 来源可追踪，并映射到原生属性访问。
4. `defineExpose`：评估微信组件实例可暴露能力，不可映射时明确降级。
5. `watch/watchEffect`：只有真实实现后才允许进入 thin runtime 白名单。

## 参考链接

- Vue `<script setup>` API: https://vuejs.org/api/sfc-script-setup
- 微信 WXML: https://developers.weixin.qq.com/miniprogram/dev/framework/view/wxml/
- 微信事件系统: https://developers.weixin.qq.com/miniprogram/dev/framework/view/wxml/event.html
- 微信 Page 构造器: https://developers.weixin.qq.com/miniprogram/dev/reference/api/Page.html
- 微信 Component 构造器: https://developers.weixin.qq.com/miniprogram/dev/reference/api/Component.html
