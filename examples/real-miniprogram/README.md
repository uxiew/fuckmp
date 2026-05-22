# 真实小程序示例

这个示例用于验收 Vue3 到微信小程序编译链路，覆盖页面、组件、props、emits、组件 `v-model`、JavaScript 配置、SCSS 样式与 runtime 注入。

推荐验证命令：

```bash
pnpm vitest run tests/e2e/real-example-acceptance.test.ts
```

微信开发者工具 CLI 冒烟命令：

```bash
/Applications/wechatwebdevtools.app/Contents/MacOS/cli auto \
  --project /Users/bing/Projects/vue3-wx/test-output/real-miniprogram \
  --auto-port 9420 \
  --trust-project
```

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
