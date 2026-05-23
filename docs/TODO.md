# TODO / 当前支持状态

更新时间：2026-05-23

## 当前已验证

- [x] Vue3 SFC 扫描与编译：支持 `app.vue`、`pages/**.vue`、`components/**.vue`，并过滤 `_` 开头的文件/目录。
- [x] `<script setup lang="ts">` 基础解析：支持 `ref`、`reactive`、`computed`、函数方法、组件导入、样式导入。
- [x] 模板转换：支持插值、组件标签、动态属性、事件参数、`v-if`、动态 `:class` 基础对象语法。
- [x] 事件属性规范：事件输出统一为 `bind:event` 形式；`@click` 映射为 `bind:tap`，自定义事件保持事件名。
- [x] 生命周期映射：页面 `onMounted/onUnmounted` 输出到 `onReady/onUnload`，组件输出到 `lifetimes.attached/detached`，并有端到端断言覆盖。
- [x] 样式转换：支持 SCSS、`@import`、JS 导入样式、scoped 样式和基础单位转换。
- [x] 运行时注入：支持按特性生成自包含 `runtime-injection.js`，Proxy ref/reactive/computed 已有回归测试覆盖。
- [x] 错误处理：输入目录不存在时返回结构化失败结果，不再静默成功。
- [x] 用户配置加载：支持 `vue3mp.config.js` / `.vue3mprc.js` 同步对象配置，兼容 CommonJS 与简单 `export default`，TypeScript 配置保持明确跳过并可 fallback 到 JSON。
- [x] 监听模式输出清理：删除 `.vue` 源文件时清理对应 `.js/.json/.wxml/.wxss/.js.map` 编译产物，并限定删除范围在输出目录内。
- [x] 监听模式项目级刷新：新增、变更或删除 `.vue` 源文件后同步刷新 `app.json`、runtime injection 和项目配置，避免页面列表与运行时特性分析残留旧状态。
- [x] 类型检查基线：`pnpm type-check` 当前通过，范围限定为源码 `src/**/*`。
- [x] 测试基线：`pnpm test:run` 当前通过 59 个测试文件、跳过 1 个显式 opt-in 真机测试文件；263 个测试通过、5 个真机测试跳过。
- [x] 构建基线：`pnpm build` 当前通过，DTS 生成通过。
- [x] Sass 弃用告警：运行时代码使用 Dart Sass namespace import，测试 SCSS 使用 `sass:color` 模块函数。
- [x] 旧运行时兼容层：删除无引用旧文件和 `setupRuntime/cleanupRuntime` 兼容导出，当前保留 `src/runtime/core/*`。
- [x] runtime 入口瘦身：移除 eager `runtime` 单例导出，`initVue3Runtime(config)` 首次配置可正确生效；组件管理器不再重复创建一套核心依赖。
- [x] runtime 打包流程瘦身：`RuntimeBundler` 仅负责模块选择与清单，删除未使用且易误导的 TS 字符串拼接“假打包”逻辑；实际自包含注入仍由 `CodeGenerator` 生成。
- [x] runtime 注入产物瘦身：`CodeGenerator` 不再输出未接入调用链的生命周期/模板/事件/组件占位模块和 `defineApp` 兼容别名，已补生成产物回归断言。
- [x] 页面旧内联 runtime 清理：`PageGenerator` 不再给每个页面无条件内联旧版 `ref/reactive/computed/watch` 运行时，移除 `setInterval` 轮询 watch 占位；覆盖 `tests/e2e/thin-runtime-page-output.test.ts`。
- [x] `CodeGenerator` 首轮拆分：对象字面量序列化和事件 handler 函数转换已抽离到 `src/compiler/codegen/object-serializer.ts`，定向运行时/真实项目测试通过。
- [x] `CodeGenerator` runtime 注入模板拆分：自包含 runtime 与注入层生成已抽离到 `src/compiler/codegen/runtime-injection-generator.ts`，`code-generator.ts` 已降至 607 行。
- [x] 页面/组件生成器首轮精简：共享 WXML 后处理、scoped hash 与组件引用 helper 已抽离到 `src/generator/shared-generator-utils.ts`，组件旧版未调用事件 handler 已删除；`page-generator.ts` 当前为 584 行。
- [x] runtime 子路径 public surface 决策：当前包配置只声明根入口 `fuckmp` 与 CLI，构建产物只发布根入口/CLI；`fuckmp/runtime` 非 public surface，运行时对外能力仅通过根入口命名导出，编译产物运行时使用生成的 `runtime-injection.js`。
- [x] 最终生成 JS 语法级验证：真实项目 e2e 已解析 `runtime-injection` 覆盖后的 `app.js`、页面 JS、组件 JS，覆盖生命周期嵌套箭头函数和多行字符串字面量语法风险。
- [x] `TemplateTransformer` 字符串后处理工具拆分：Vue 绑定/事件、自闭合标签、三花括号与空白清理已抽离到 `src/transformer/template-string-utils.ts`，新增定向单测覆盖。
- [x] `ScriptParser` AST 代码生成工具拆分：表达式/语句代码片段生成已抽离到 `src/parser/script-codegen-utils.ts`，新增定向单测覆盖。
- [x] Native-first runtime 边界：正式记录 `docs/native-first-runtime-boundary.md`，并用测试约束 runtime 只返回 `core` 或 `core + reactivity`，不再为模板/事件/生命周期/组件语义注入伪模块。
- [x] 最新平台基线：Vue 相关依赖升级到 `3.5.34`，新增 `docs/latest-platform-baseline.md` 与 Vue 3.5 `<script setup>` 宏兼容测试。
- [x] `defineProps<T>()` 类型声明原生映射：支持内联 TypeScript props、本地 interface/type alias 和相对 import type 推断到 `Component.properties`，并将模板、computed getter 与 setup 方法中的 `props.xxx` 静态改写为原生 property 访问；覆盖 `tests/e2e/define-props-type-based.test.ts`。
- [x] `defineEmits` 类型声明原生映射：支持 TypeScript call signature、named tuple、本地 interface/type alias 和相对 import type 事件名提取，生成原生 `this.triggerEvent` 与 `_emit*` 方法；覆盖 `tests/e2e/typed-emits.test.ts`。
- [x] `defineModel` + 组件 `v-model` 原生闭环：子组件输出 `Component.properties`、原生 input handler 与 `update:*` 事件，父级输出属性绑定与 `bind:update:*` 回写 handler；`defineModel` tuple 解构配合 `v-model.trim/.number` 可复用原生输入修饰符 handler；覆盖 `tests/e2e/native-v-model.test.ts`。
- [x] 真实示例工程验收闭环：新增 `examples/real-miniprogram`，覆盖页面、组件、props/emits、组件 `v-model`、JS 配置、SCSS、最终 runtime injection 覆盖后的页面/组件 JS 语法与关键行为；覆盖 `tests/e2e/real-example-acceptance.test.ts`。
- [x] `withDefaults(defineProps())` 默认值原生映射：静态默认值和数组/对象 factory 静态返回值写入 `Component.properties.value`；覆盖 `tests/e2e/with-defaults-props.test.ts`。
- [x] Vue 3.5 响应式 props 解构映射：解构默认值写入 `Component.properties`，模板、computed getter、生命周期回调与 setup 方法中的局部别名还原为原始 prop 名且不误伤成员表达式；覆盖 `tests/e2e/reactive-props-destructure.test.ts`。
- [x] `defineExpose` 原生目标降级：微信原生目标无 Vue template ref public instance 等价语义，产物输出降级注释和 exposed keys，不生成 runtime 桥接；覆盖 `tests/e2e/define-expose-degrade.test.ts`。
- [x] `defineOptions` 原生目标降级：微信原生目标无完整 Vue component options 合并等价语义，产物输出降级注释和 option keys，不生成 runtime 桥接；覆盖 `tests/e2e/define-options-degrade.test.ts`。
- [x] `defineSlots` 类型宏擦除 / 原生目标降级：当前不暴露 Vue slots 对象桥接，产物输出降级注释并避免 `defineSlots()` 落入 data；覆盖 `tests/e2e/define-slots-degrade.test.ts`。
- [x] 基础 slots / named slots 原生映射：`<slot>` 保留为微信原生 slot，组件 JSON 自动启用 `options.multipleSlots`；覆盖 `tests/e2e/slots-provide-inject-boundary.test.ts`。
- [x] `provide/inject` 原生目标降级：当前不提供 Vue dependency injection 实例树等价桥接，产物输出降级注释并避免 `inject()` 落入 data；覆盖 `tests/e2e/slots-provide-inject-boundary.test.ts`。
- [x] scoped/dynamic slots 与 `Transition` / `KeepAlive` 原生目标降级：当前不提供 Vue scoped slot props、动态 slot 名、过渡状态机或组件缓存等价桥接，产物输出明确降级注释，不生成伪 runtime；覆盖 `tests/e2e/unsupported-template-boundary.test.ts`。
- [x] `watch/watchEffect/onWatcherCleanup` 原生目标降级：当前不提供 Vue watcher 副作用调度与 Vue 3.5 cleanup 等价桥接，产物输出降级注释且不恢复旧版轮询 watch helper；覆盖 `tests/e2e/watcher-degrade.test.ts`。
- [x] Vue 3.5 `useId` 原生目标映射：非 SSR 微信原生目标下生成稳定 `data` id，组件实例 `attached` 时追加唯一后缀，不生成 ID runtime；覆盖 `tests/e2e/use-id-native.test.ts`。
- [x] Vue 3.5 `useTemplateRef` 原生目标降级：微信原生目标无 Vue template ref / DOM 或组件实例等价桥接，产物输出降级注释和 template refs，不生成 runtime 代理；覆盖 `tests/e2e/use-template-ref-degrade.test.ts`。
- [x] Vue 3.5 Native-first 文档一致性审计：README、TODO、latest baseline 与 runtime boundary 中的测试引用必须存在，公开矩阵必须覆盖核心 Vue 3.5 能力测试面；覆盖 `tests/quality/vue35-docs-consistency.test.ts`。
- [x] 单文件行数约束：当前 `src/**/*` 未超过 600 行维护阈值；`src/runtime/core/reactivity.ts` 已拆出 ref/computed/reactive Proxy helper 并降至 368 行，`src/runtime/core/reactivity-proxy-helpers.ts` 当前为 313 行，`src/compiler/compiler.ts` 已拆出用户配置合并、组件路径解析、样式选项、样式处理管线、项目级输出刷新、结果构造、编译结果统计、运行时记录收集与输出写入 helper，当前为 412 行，新增 `src/compiler/compiler-project-output-utils.ts` 当前为 113 行，`src/compiler/compiler-style-utils.ts` 当前为 217 行，`src/compiler/compiler-result-utils.ts` 当前为 107 行；`src/transformer/style-transformer.ts` 已抽出单位转换、scoped selector、CSS 压缩、scopeId 与规则计数 helper 并降至 329 行，新增 `src/transformer/style-transformer-utils.ts` 当前为 123 行；`src/transformer/template-transformer.ts` 已复用 class 绑定表达式 helper、抽出 fallback 字符串管线，并继续抽出 AST 标签、`v-model`/`v-for`/`v-on` 指令与 WXML 校验 helper，当前为 418 行，`src/transformer/template-string-utils.ts` 当前为 390 行；`src/compiler/code-generator.ts` 已拆出文件头、runtime 相对路径、option 过滤、data 过滤、computed/watch/lifecycle/properties option helper 与模板 handler 生成 helper，当前为 427 行，`src/compiler/codegen/code-generator-utils.ts` 当前为 220 行，`src/compiler/codegen/runtime-injection-generator.ts` 已抽出 runtime 配置、自包含 runtime、响应式 runtime 片段与主 runtime 类 helper 并降至 184 行，新增 `src/compiler/codegen/runtime-injection-utils.ts` 当前为 328 行；`src/generator/page-generator.ts` 已抽出页面 WXSS、生命周期、methods、computed、模板事件与响应式 setup helper 并降至 344 行，`src/generator/page-generator-utils.ts` 当前为 271 行，`src/generator/component-generator.ts` 已抽出组件 methods 生成 helper 并降至 274 行，`src/generator/config-generator.ts` 已抽出 app/page/component/project/sitemap/tsconfig 配置构造 helper 并降至 236 行，新增 `src/generator/config-generator-utils.ts` 当前为 331 行，`src/optimization/performance.ts` 已抽出缓存条目、缓存管理器、缓存内存估算、最旧 key 查找、字节格式化与 GC 判断 helper 并降至 334 行，新增 `src/optimization/performance-utils.ts` 当前为 91 行，新增 `src/optimization/performance-cache-manager.ts` 当前为 128 行，`src/transformer/script-transformer.ts` 已拆出上下文初始化、import 记录、函数初始化、computed getter、props 默认值、defineModel、响应式 props 解构与生命周期追加 helper，当前为 429 行，`src/transformer/script-transformer-utils.ts` 当前为 238 行，`src/cli/commands/create.ts` 已抽出 create 模板定义并降至 101 行，`src/cli/commands/create-templates.ts` 已拆出基础模板与业务模板文件生成器并降至 93 行，新增 `src/cli/commands/create-basic-template-files.ts` 当前为 236 行、`src/cli/commands/create-business-template-files.ts` 当前为 179 行，`src/parser/script-parser.ts` 已抽出宏信息提取 helper 并降至 394 行，新增 `src/parser/script-macro-utils.ts` 当前为 175 行；`src/parser/style-parser.ts` 已抽出小程序样式、单位转换与 CSS 变量 PostCSS plugin helper 并降至 348 行，新增 `src/parser/style-parser-utils.ts` 当前为 106 行，并由 `tests/quality/source-size.test.ts` 固化。
- [x] 默认测试输出：Browserslist 过期提示已在 Vitest 环境中静默；真机测试默认跳过，需 `FUCKMP_REAL_DEVICE_TESTS=1` 显式启用。

## 后续约束 / 可选验收

- [x] 真机测试可用性边界已核查（2026-05-21）：本机 `/Applications/wechatwebdevtools.app/Contents/MacOS/cli` 存在且可执行，`FUCKMP_REAL_DEVICE_TESTS=1 WECHAT_IDE_CLI=/Applications/wechatwebdevtools.app/Contents/MacOS/cli pnpm vitest run tests/e2e/real-device.test.ts` 当前无法完成；进一步执行 `cli auto --project /Users/bing/Projects/vue3-wx/test-output --auto-port 9420 --trust-project` 返回 `AppID 不合法, invalid appid`，原因是当前 `test-output/project.config.json` 使用测试占位 appid `test-miniprogram`。真实验收需要配置合法微信小程序 AppID / 项目并开启自动化 HTTP 端口后重跑，不将该环境失败伪造成通过。
- [x] 真实示例 DevTools 自动化冒烟已核查（2026-05-22 16:07 CST）：`/Applications/wechatwebdevtools.app/Contents/MacOS/cli auto --project /Users/bing/Projects/vue3-wx/test-output/real-miniprogram --auto-port 9420 --trust-project` 返回 `IDE server has started`、`Using AppID: touristappid`、`auto`，说明真实示例输出可被微信开发者工具自动化打开。
- [x] 维护性后续边界已记录：当前已无超过 600 行的源码文件；后续继续扩展接近门禁的模块时，优先拆分明确边界，避免重新逼近 600 行维护阈值。

## 后续优先任务

1. 需要更深入真实小程序端验收时，使用合法微信小程序 AppID / 登录态运行 opt-in 真机测试，并可按 `examples/real-miniprogram/README.md` 接入 `wechat-devtools-mcp`。
2. 如需继续做维护性瘦身，当前已无 600 行以上源码文件；后续重点关注 `src/config/user-config.ts` 442 行、`src/runtime/core/template.ts` 433 行、`src/transformer/script-transformer.ts` 429 行、`src/compiler/code-generator.ts` 427 行与 `src/transformer/vue-template-transformer.ts` 423 行等接近门禁模块。
3. `watch/watchEffect/onWatcherCleanup` 已明确降级；只有真实实现 Vue watcher 调度与 cleanup 语义后，才允许进入 runtime 白名单。
4. 继续补齐最新 Vue 3.5 能力矩阵时，基础 slots 已原生映射；scoped/dynamic slots 与 `Transition` / `KeepAlive` 已明确降级；更复杂 DI 语义仍需真实方案或继续明确降级。
