# Native-first Runtime Boundary

更新时间：2026-06-06

## 决策

FuckMP 的目标是把 Vue3 SFC 编译为原生微信小程序工程，而不是在小程序中运行一套完整 Vue runtime。

架构方向固定为：**Native-first + Thin Runtime**。

- 能稳定静态转换的 Vue 能力，必须输出到原生 `wxml / wxss / js / json`。
- 运行时只作为小程序 `setData` 与 Vue3 响应式写法之间的最小桥接。
- 不允许用未实现的 runtime 模块占位来宣称支持某项 Vue 能力。

## 平台版本基线

当前 Vue 相关依赖基线为 `vue@3.5.35`、`@vue/compiler-sfc@3.5.35`、`@vue/reactivity@3.5.35`；微信小程序目标保持原生 `Page / Component / WXML / WXSS / JSON`。详细记录见 `docs/latest-platform-baseline.md`。

## 当前运行时白名单

当前允许进入 `runtime-injection.js` 的能力只有：

| 能力 | 触发条件 | 说明 |
|---|---|---|
| `core` | 总是存在 | 提供初始化、`createPage/createComponent/createApp` 包装层 |
| `reactivity` | 使用 `ref/reactive/computed` | 提供当前已实现的 Proxy + `setData` 桥接 |

`<script setup>` 本身不触发响应式 runtime；只有实际使用 `ref/reactive/computed` 时才注入响应式代码。

页面/组件生成器不得再内联旧版响应式运行时。尤其不能为了“看起来支持”而在页面 JS 中无条件输出 `watch` 轮询占位、`setDataContext` 或一套脱离 `runtime-injection.js` 的 `ref/reactive/computed` helper。

## 必须走原生编译的能力

| Vue 能力 | 目标输出 | Runtime 边界 |
|---|---|---|
| `v-if / v-else-if / v-else` | `wx:if / wx:elif / wx:else` | 不注入 template runtime |
| `v-for` | `wx:for / wx:for-item / wx:key` | 不注入 template runtime |
| `v-bind / :prop` | 原生属性与 Mustache 表达式 | 不注入 bind runtime |
| `v-on / @event` | `bind:*` 或 `catch:*` | 不注入 event runtime |
| `v-model` | 属性 + 事件 handler | 不注入 v-model runtime |
| `defineProps` | 内联类型、本地 interface/type alias、相对 import type 到 `Component.properties`；`props.xxx` 模板 / computed / setup 方法访问静态改写为原生 property 访问 | 不注入 component runtime |
| `withDefaults(defineProps())` | `Component.properties.value` | 不注入 component runtime |
| 响应式 props 解构 | `Component.properties.value` + 模板别名 / computed getter / 生命周期回调 / setup 方法访问静态还原 | 不注入 props runtime |
| `defineModel` | `Component.properties` + `update:*` 事件；tuple 解构配合原生 input 修饰符 handler | 不注入 v-model runtime |
| `defineEmits` | 运行时声明 / TypeScript call signature / named tuple / 本地类型 / 相对 import type 事件名提取 + `this.triggerEvent` | 不注入 event runtime |
| 生命周期 | Page/Component 原生生命周期 | 不注入 lifecycle runtime |
| 样式与 SCSS | `wxss` | 不注入 style runtime |

## 明确降级或暂不宣称运行时支持

### `defineExpose`

`defineExpose` 在 Vue 中用于控制 `<script setup>` 组件通过 template ref 暴露给父组件的 public instance。微信原生小程序目标没有可靠等价语义，因此当前处理为**明确降级**：

- 编译产物输出 `defineExpose 降级` 注释和 exposed keys。
- 不生成 `__expose`、template-ref 桥接或额外 runtime 模块。
- 不把该能力加入 thin runtime 白名单。

验证测试：`tests/e2e/define-expose-degrade.test.ts`。

### `defineOptions`

`defineOptions` 用于在 `<script setup>` 中声明 Vue component options，并由 Vue 编译器提升到模块作用域。微信原生 `Page / Component` 没有完整 Vue options 合并等价语义，因此当前处理为**明确降级**：

- 编译产物输出 `defineOptions 降级` 注释和 option keys。
- 不生成 Vue options 合并层或额外 runtime 模块。
- 不把该能力加入 thin runtime 白名单。

验证测试：`tests/e2e/define-options-degrade.test.ts`。

### 基础 slots / named slots

微信原生组件支持基础 slot 与 named slot。当前编译器对 `<slot>` 和 `<slot name=...>` 采用**原生映射**：

- WXML 保留 `<slot>` / `<slot name="..."></slot>`。
- 组件 JSON 在检测到 slot 时输出 `options.multipleSlots: true`。
- 不引入 Vue slots 对象、scoped slot runtime 或 template runtime 模块。

验证测试：`tests/e2e/slots-provide-inject-boundary.test.ts`。

### scoped slots / dynamic slots

Vue scoped slots 依赖 `v-slot`/`#` 接收子组件传出的 slot props，dynamic slots 依赖动态指令参数选择 slot 名。微信原生 slot 只提供基础和具名 slot，不提供 Vue slot props 分发或动态 slot 名等价语义，因此当前处理为**明确降级 / 不宣称支持**：

- 编译产物输出 `scoped slots / dynamic slots 降级` 注释。
- 不生成 scoped slot props 分发、动态 slot 名解析或 template runtime 模块。
- 不把该能力加入 thin runtime 白名单。

验证测试：`tests/e2e/unsupported-template-boundary.test.ts`。

### `defineSlots`

`defineSlots` 主要用于 `<script setup>` 的 slot 类型提示，并在 Vue 中返回 slots 对象。当前微信原生输出不暴露 Vue slots 对象桥接，因此当前处理为**类型宏擦除 / 明确降级**：

- 编译产物输出 `defineSlots 降级` 注释。
- 擦除 `defineSlots()` 变量，不让其落入 `data`。
- 不生成 `__slots`、Vue slots 对象桥接或额外 runtime 模块。

验证测试：`tests/e2e/define-slots-degrade.test.ts`。

### `provide` / `inject`

`provide` / `inject` 依赖 Vue component/app 实例树上的依赖注入解析。当前微信原生输出不提供 Vue DI 上下文桥接，因此当前处理为**明确降级**：

- 编译产物输出 `provide/inject 降级` 注释、API 和 key。
- 擦除 `provide()` / `inject()` 调用，不让 `inject()` 变量落入 `data`。
- 不生成 `__provide`、`__inject` 或 `di` runtime 模块。

验证测试：`tests/e2e/slots-provide-inject-boundary.test.ts`。

### `watch` / `watchEffect` / `onWatcherCleanup`

`watch` 与 `watchEffect` 是 Vue runtime 副作用调度 API；Vue 3.5 `onWatcherCleanup` 还要求在 `watch` 回调或 `watchEffect` effect 的同步执行期间注册清理函数。当前微信原生 thin runtime 不提供等价 watcher 调度、失效重跑和 cleanup 桥接，因此当前处理为**明确降级**：

- 编译产物输出 `watch/watchEffect 降级` 注释。
- 擦除 `watch()`、`watchEffect()` 与 `onWatcherCleanup()` 调用，不生成 watcher runtime 桥接。
- 不恢复旧版页面内联 `setInterval` 轮询式 `watch` helper。

验证测试：`tests/e2e/watcher-degrade.test.ts`。

### `useId`

Vue 3.5 `useId` 用于生成应用内唯一、SSR 与客户端渲染稳定一致的 ID，并可通过 `app.config.idPrefix` 配置应用级前缀。微信小程序原生目标没有 SSR/hydration 流程；对常见模板 `:id` / `:for` 绑定，当前处理为**原生映射**：

- 编译产物输出 `useId 原生映射` 注释和变量名。
- `useId()` 变量写入稳定 `data` id，模板继续使用 `{{fieldId}}` 等原生数据绑定。
- 组件产物在 `attached` 中追加实例级唯一后缀，避免同一组件多实例的 id 冲突。
- 不生成 `__useId`、`app.config.idPrefix` 或 SSR/hydration 伪 runtime。

验证测试：`tests/e2e/use-id-native.test.ts`。

### `useTemplateRef`

Vue 3.5 `useTemplateRef` 用于获取模板 ref 对应的 DOM 或组件实例引用。微信原生小程序目标没有 Vue DOM/component instance 等价桥接，因此当前处理为**明确降级**：

- 编译产物输出 `useTemplateRef 降级` 注释和 template refs。
- 不生成 `__templateRef`、DOM/组件实例代理或额外 runtime 模块。
- 不把该能力加入 thin runtime 白名单。

验证测试：`tests/e2e/use-template-ref-degrade.test.ts`。

### `Transition` / `KeepAlive`

Vue `<Transition>` 负责进入/离开阶段的 class、hook 与时序管理；`<KeepAlive>` 负责缓存非激活组件实例状态。微信原生输出当前没有 Vue 过渡状态机或组件缓存等价桥接，因此当前处理为**明确降级 / 不宣称支持**：

- 编译产物输出 `transition / keep-alive 降级` 注释。
- 不生成 transition state machine、keep-alive cache 或额外 runtime 模块。
- 不把该能力加入 thin runtime 白名单。

验证测试：`tests/e2e/unsupported-template-boundary.test.ts`。

### 仍不宣称支持

上述明确降级能力即使可以在源码中被识别，也不能仅靠 runtime 模块名宣称支持。后续若要更新支持状态，必须先有明确的原生编译方案或真实运行时实现，并补充对应 e2e/fixture 证明。

## 回归约束

当前测试已固化以下边界：

- `RuntimeBundler.getRequiredModules()` 只返回 `core` 或 `core + reactivity`。
- 模板指令、事件、生命周期、props/emits、`defineProps<T>()` 命名空间访问、`defineModel`、`withDefaults`、响应式 props 解构、`defineExpose` 降级、`defineOptions` 降级、`defineSlots` 降级、`watch/watchEffect/onWatcherCleanup` 降级、`useId` 原生映射、`useTemplateRef` 降级、基础 slots 映射、scoped/dynamic slots 降级、transition/keep-alive 降级、`provide/inject` 降级不会引入 `template/event/lifecycle/component/di` 等伪模块。
- `RuntimeInjectionGenerator` 不会因为 `<script setup>` 本身生成 `ref/reactive/computed` runtime。
- `PageGenerator` 不会给静态页面内联旧版响应式 runtime，也不会输出 `setInterval` 轮询式 `watch` 占位。

相关测试：

- `tests/runtime-injection.test.ts`
- `tests/compiler/runtime-injection-generator.test.ts`
- `tests/e2e/thin-runtime-page-output.test.ts`
- `tests/e2e/define-props-type-based.test.ts`
- `tests/e2e/typed-emits.test.ts`
- `tests/e2e/native-v-model.test.ts`
- `tests/e2e/with-defaults-props.test.ts`
- `tests/e2e/reactive-props-destructure.test.ts`
- `tests/e2e/define-expose-degrade.test.ts`
- `tests/e2e/define-options-degrade.test.ts`
- `tests/e2e/define-slots-degrade.test.ts`
- `tests/e2e/slots-provide-inject-boundary.test.ts`
- `tests/e2e/watcher-degrade.test.ts`
- `tests/e2e/use-id-native.test.ts`
- `tests/e2e/use-template-ref-degrade.test.ts`
- `tests/e2e/unsupported-template-boundary.test.ts`

## 后续开发顺序

1. 继续补齐静态编译能力矩阵时，优先选择能稳定落到原生 `Page / Component / WXML / WXSS / JSON` 的能力。
2. 每个能力必须先有 fixture/e2e 测试，再实现转换。
3. 只有当静态编译无法表达，且存在真实实现时，才允许扩展 thin runtime 白名单。
