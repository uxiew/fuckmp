# 真实小程序示例

这个示例用于验收 Vue3 到微信小程序编译链路，覆盖页面、组件、props、emits、组件 `v-model`、基础 default / named slots、`v-if` / `v-for` / `v-show` 原生映射、`<img :src>` 图片资源与 load/error 原生事件映射、input / textarea 原生 `value/input/focus/blur` 事件映射、touch / longtap / longpress 原生事件映射、`.capture` 到 `capture-bind`、`.capture.stop` 到 `capture-catch` 的事件修饰符映射、scroll-view 原生 `scrolltoupper/scrolltolower/scroll` 事件映射、swiper 原生 `current/change` 映射、video 原生 `src/play/pause/ended/timeupdate` 映射、movable-view 原生 `x/y/direction/scale/change` 映射、cover-view / cover-image 原生 `tap/src/load/error` 映射、canvas 原生 `canvas-id/type/error` 映射、switch 原生 `checked/change` 映射、picker 原生 `value/range/change` 映射、slider 原生 `value/change` 映射、radio-group / checkbox-group 原生 `change` 映射、form 原生 `submit/reset` 事件映射、JavaScript 配置、SCSS 样式与 runtime 注入。

当前示例重点组件：

- `app.vue`：应用级 `onMounted` 归一到微信原生 `App.onLaunch`，避免生成不可调用的组件 `lifetimes`。
- `components/UserCard.vue`：props、`withDefaults`、emits，Vue/HTML 常见 `<img :src @load @error>` 到微信原生 `<image src bind:load bind:error>` 的图片资源与事件映射，Vue 常用 `@click` / `@click.stop` 到微信原生 `tap` / `catch:tap` 的事件映射，以及组件 `onMounted` / `onUnmounted` 到 `attached` / `detached` 的生命周期映射。
- `components/CounterInput.vue`：`defineModel`、组件 `v-model` 与输入修饰符。
- `components/ActivityList.vue`：`v-if` / `v-for`、动态 class、Vue 源侧 `@click="handler(arg)"` 事件参数到微信原生 dataset 的映射，以及子组件 `selectActivity` payload 经微信原生 `event.detail` 回传给父页面。
- `components/SlotPanel.vue`：微信原生可等价的 default slot 与 named slot 内容投递；不覆盖 scoped slot props 或动态 slot 名。
- `pages/index/index.vue`：`v-show` 到微信原生 `hidden` 属性的页面级映射，页面按钮 Vue 源侧 `@click` 到微信原生 `bind:tap` 的事件映射，以及 `<a href>` 到微信原生 `<navigator url>` 的页面导航映射。
- `pages/profile.vue`：第二页面级 `ref` / `computed` / `v-if`、input / textarea 原生 `:value` / `@input` / `@focus` / `@blur` 事件映射、touch / longtap / longpress 原生事件映射、`.capture` 到 `capture-bind`、`.capture.stop` 到 `capture-catch` 的事件修饰符映射、scroll-view 原生 `scroll-y` / `@scrolltoupper` / `@scrolltolower` / `@scroll` 映射、swiper 原生 `:current` / `@change` 映射、video 原生 `:src` / `@play` / `@pause` / `@ended` / `@timeupdate` 映射、movable-area / movable-view 原生 `:x` / `:y` / `direction` / `scale` / `@change` / `@scale` 映射、cover-view / cover-image 原生 `@tap` / `:src` / `@load` / `@error` 映射、canvas 原生 `canvas-id` / `type` / `@error` 映射、switch 原生 `:checked` / `@change` 映射、picker 原生 `:value` / `:range` / `@change` 映射、slider 原生 `:value` / `@change` 映射、radio-group / checkbox-group 原生 `@change` 与动态 `:checked` 映射、form 原生 `@submit` / `@reset` 与 `form-type` 按钮映射，以及 scoped/shared 样式验收。

推荐验证命令：

```bash
pnpm vitest run tests/e2e/real-example-acceptance.test.ts
```

微信开发者工具 CLI 冒烟脚本默认跳过真实 GUI 调用，可安全纳入本地检查：

```bash
pnpm test:real-devtools
```

如需真实启动微信开发者工具，请显式 opt-in：

```bash
FUCKMP_REAL_DEVTOOLS_SMOKE=1 \
WECHAT_IDE_CLI=/Applications/wechatwebdevtools.app/Contents/MacOS/cli \
pnpm test:real-devtools
```

可选环境变量：

- `FUCKMP_REAL_MINIPROGRAM_APPID`：覆盖默认 `touristappid`。
- `FUCKMP_REAL_MINIPROGRAM_OUTPUT`：覆盖默认 `test-output/real-miniprogram`。
- `WECHAT_DEVTOOLS_AUTO_PORT`：覆盖默认自动化端口 `9420`。

`wechat-devtools-mcp` 可按其 MCP 配置方式接入：

```json
{
  "mcpServers": {
    "wechat-devtools": {
      "command": "npx",
      "args": [
        "-y",
        "wechat-devtools-mcp",
        "--projectPath=/Users/bing/Projects/vue3-wx/test-output/real-miniprogram",
        "--cliPath=/Applications/wechatwebdevtools.app/Contents/MacOS/cli"
      ]
    }
  }
}
```

默认使用 `touristappid`。如需上传、预览或真机级验收，请替换为合法 AppID 并确认微信开发者工具已登录。
