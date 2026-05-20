# TODO / 当前支持状态

更新时间：2026-05-20

## 当前已验证

- [x] Vue3 SFC 扫描与编译：支持 `app.vue`、`pages/**.vue`、`components/**.vue`，并过滤 `_` 开头的文件/目录。
- [x] `<script setup lang="ts">` 基础解析：支持 `ref`、`reactive`、`computed`、函数方法、组件导入、样式导入。
- [x] 模板转换：支持插值、组件标签、动态属性、事件参数、`v-if`、动态 `:class` 基础对象语法。
- [x] 事件属性规范：事件输出统一为 `bind:event` 形式；`@click` 映射为 `bind:tap`，自定义事件保持事件名。
- [x] 生命周期映射：页面 `onMounted/onUnmounted` 输出到 `onReady/onUnload`，组件输出到 `lifetimes.attached/detached`，并有端到端断言覆盖。
- [x] 样式转换：支持 SCSS、`@import`、JS 导入样式、scoped 样式和基础单位转换。
- [x] 运行时注入：支持按特性生成自包含 `runtime-injection.js`，Proxy ref/reactive/computed 已有回归测试覆盖。
- [x] 错误处理：输入目录不存在时返回结构化失败结果，不再静默成功。
- [x] 类型检查基线：`pnpm type-check` 当前通过，范围限定为源码 `src/**/*`。
- [x] 测试基线：`pnpm test:run` 当前通过 17 个测试文件、跳过 1 个显式 opt-in 真机测试文件；118 个测试通过、5 个真机测试跳过。
- [x] 构建基线：`pnpm build` 当前通过，DTS 生成通过。
- [x] Sass 弃用告警：运行时代码使用 Dart Sass namespace import，测试 SCSS 使用 `sass:color` 模块函数。
- [x] 旧运行时兼容层：删除无引用旧文件和 `setupRuntime/cleanupRuntime` 兼容导出，当前保留 `src/runtime/core/*`。
- [x] runtime 入口瘦身：移除 eager `runtime` 单例导出，`initVue3Runtime(config)` 首次配置可正确生效；组件管理器不再重复创建一套核心依赖。
- [x] runtime 打包流程瘦身：`RuntimeBundler` 仅负责模块选择与清单，删除未使用且易误导的 TS 字符串拼接“假打包”逻辑；实际自包含注入仍由 `CodeGenerator` 生成。
- [x] runtime 注入产物瘦身：`CodeGenerator` 不再输出未接入调用链的生命周期/模板/事件/组件占位模块和 `defineApp` 兼容别名，已补生成产物回归断言。
- [x] `CodeGenerator` 首轮拆分：对象字面量序列化和事件 handler 函数转换已抽离到 `src/compiler/codegen/object-serializer.ts`，定向运行时/真实项目测试通过。
- [x] `CodeGenerator` runtime 注入模板拆分：自包含 runtime 与注入层生成已抽离到 `src/compiler/codegen/runtime-injection-generator.ts`，`code-generator.ts` 已降至 607 行。
- [x] 页面/组件生成器首轮精简：共享 WXML 后处理、scoped hash 与组件引用 helper 已抽离到 `src/generator/shared-generator-utils.ts`，组件旧版未调用事件 handler 已删除；`page-generator.ts` 已降至 712 行。
- [x] 默认测试输出：Browserslist 过期提示已在 Vitest 环境中静默；真机测试默认跳过，需 `FUCKMP_REAL_DEVICE_TESTS=1` 显式启用。

## 当前不完整 / 待收敛

- [ ] `src/transformer/template-transformer.ts` 当前 800 行，已触及单文件硬上限；最终 Review 前需确认是否拆分或至少防止继续增长。
- [ ] 最终验收前补充生成 JS 语法级验证，覆盖 `runtime-injection` 覆盖后的页面/组件最终产物。
- [ ] 若未来要支持 runtime 子路径导入，需要显式声明 package `exports` 并补兼容测试。
- [ ] 真机测试默认不跑；需要真实验收时设置 `FUCKMP_REAL_DEVICE_TESTS=1`，必要时设置 `WECHAT_IDE_CLI`。

## 后续优先任务

1. 为最终生成的页面/组件 JS 增加语法级验证，避免仅靠字符串包含断言遗漏生成代码语法问题。
2. 如需对外暴露 runtime 子路径导入，补 package `exports` 与兼容测试。
3. 需要真实小程序端验收时，配置微信开发者工具 CLI 后运行 opt-in 真机测试。
