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
- 响应式 props 解构（Vue 3.5+）

`tests/parser/sfc-parser-latest-vue.test.ts` 用于确认这些宏可以通过 `@vue/compiler-sfc` 的 `compileScript` 入口处理。该测试只证明“最新 Vue SFC 编译入口兼容”；原生小程序语义转换必须以对应 e2e/回归测试为准。

## 当前已验证的原生映射状态

| Vue 3.5 能力 | 当前状态 | 原生输出/降级策略 | 主要验证 |
|---|---|---|---|
| `defineModel` + 组件 `v-model` | 已原生映射 | 子组件生成 `Component.properties`、input handler 和 `this.triggerEvent('update:*')`；父级生成属性绑定与 `bind:update:*` 回写 handler | `tests/e2e/native-v-model.test.ts` |
| `withDefaults(defineProps())` | 已原生映射 | 静态默认值和数组/对象 factory 静态返回值写入 `Component.properties.value` | `tests/e2e/with-defaults-props.test.ts` |
| Vue 3.5 响应式 props 解构 | 已原生映射 | 解构默认值合并到 `Component.properties`；模板中的局部别名静态还原为原始 prop 名 | `tests/e2e/reactive-props-destructure.test.ts` |
| `defineExpose` | 明确降级 | 微信原生目标无 Vue template ref public instance 等价语义；产物输出降级注释和 exposed keys，不生成运行时桥接 | `tests/e2e/define-expose-degrade.test.ts` |

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
5. 待评估：`watch/watchEffect` 只有真实实现后才允许进入 thin runtime 白名单。

补充约束：不得用旧版页面内联 `watch` 轮询 helper 代替 Vue 3.5 语义；在真实实现前，`watch/watchEffect` 仍保持未支持/待评估状态。

## 参考链接

- Vue `<script setup>` API: https://vuejs.org/api/sfc-script-setup
- 微信 WXML: https://developers.weixin.qq.com/miniprogram/dev/framework/view/wxml/
- 微信事件系统: https://developers.weixin.qq.com/miniprogram/dev/framework/view/wxml/event.html
- 微信 Page 构造器: https://developers.weixin.qq.com/miniprogram/dev/reference/api/Page.html
- 微信 Component 构造器: https://developers.weixin.qq.com/miniprogram/dev/reference/api/Component.html
