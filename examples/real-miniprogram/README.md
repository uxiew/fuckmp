# 真实小程序示例

这个示例用于验收 Vue3 到微信小程序编译链路，覆盖页面、组件、props、emits、组件 `v-model`、基础 default / named slots、`v-if` / `v-for` 原生映射、JavaScript 配置、SCSS 样式与 runtime 注入。

当前示例重点组件：

- `components/UserCard.vue`：props、`withDefaults`、emits 与事件修饰符。
- `components/CounterInput.vue`：`defineModel`、组件 `v-model` 与输入修饰符。
- `components/ActivityList.vue`：`v-if` / `v-for`、动态 class、微信原生 dataset 事件参数与列表项事件回传。
- `components/SlotPanel.vue`：微信原生可等价的 default slot 与 named slot 内容投递；不覆盖 scoped slot props 或动态 slot 名。

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
