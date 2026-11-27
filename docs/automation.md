# 自动化测试与验收

## 测试体系

FuckMP 使用 Vitest 作为测试框架，测试覆盖编译器核心、端到端验收和质量检查三个层级。

### 运行测试

```bash
# 全量测试
pnpm test

# 指定目录
pnpm vitest run tests/e2e

# 监听模式
pnpm test:watch

# 覆盖率
pnpm test:coverage
```

### 测试目录结构

```
tests/
├── compiler/          # 编译器核心模块单元测试
├── e2e/               # 端到端编译验收测试
├── generator/         # 代码生成器测试
├── plugins/           # 插件功能测试
├── quality/           # 源码质量检查
└── transformer/       # 模板/脚本转换器测试
```

### 真实示例验收

`examples/real-miniprogram` 是一个完整的 Vue3 小程序项目，覆盖了所有编译特性的验收：

```bash
# 编译验收测试（不启动 DevTools）
pnpm vitest run tests/e2e/real-example-acceptance.test.ts

# 手动编译查看产物
fuckmp build --input examples/real-miniprogram --output test-output/real-miniprogram --app-id touristappid
```

`examples/community-pickup` 补充了从商品列表、组件预订事件到页面更新和自提须知的业务链。两个项目的原生产物验收及已知不通过用例见 [Phase 1 P 验收记录](phase-1-p-acceptance.md)。

## 微信开发者工具集成

### 自动化冒烟测试

默认安全跳过 GUI 调用，可安全纳入本地检查：

```bash
pnpm test:real-devtools
```

显式 opt-in 启动微信开发者工具：

```bash
FUCKMP_REAL_DEVTOOLS_SMOKE=1 \
WECHAT_IDE_CLI=/Applications/wechatwebdevtools.app/Contents/MacOS/cli \
pnpm test:real-devtools
```

### 环境变量

| 变量 | 说明 | 默认值 |
|------|------|--------|
| `FUCKMP_REAL_DEVTOOLS_SMOKE` | 启用真实 DevTools 调用 | 未设置（跳过） |
| `WECHAT_IDE_CLI` | 微信开发者工具 CLI 路径 | — |
| `FUCKMP_REAL_MINIPROGRAM_APPID` | 覆盖测试 AppID | `touristappid` |
| `FUCKMP_REAL_MINIPROGRAM_OUTPUT` | 覆盖输出目录 | `test-output/real-miniprogram` |
| `WECHAT_DEVTOOLS_AUTO_PORT` | 自动化端口 | `9420` |

### MCP 集成

可通过 wechat-devtools-mcp 接入微信开发者工具：

```json
{
  "mcpServers": {
    "wechat-devtools": {
      "command": "npx",
      "args": [
        "-y",
        "wechat-devtools-mcp",
        "--projectPath=./test-output/real-miniprogram",
        "--cliPath=/Applications/wechatwebdevtools.app/Contents/MacOS/cli"
      ]
    }
  }
}
```

## npm 包发布验收

```bash
FUCKMP_PACKAGE_SMOKE=1 pnpm test:package-smoke
```

执行流程：`pnpm build` → `npm pack` → 临时项目安装 tarball → 验证根入口和两个 CLI bin → 用安装后的 `fuckmp build` 编译社区自提示例并检查原生路由、组件引用和 JS/WXML/WXSS。

## 参考链接

- [微信小程序自动化文档](https://developers.weixin.qq.com/miniprogram/dev/devtools/auto/quick-start.html)
- [wechat-devtools-mcp](https://github.com/jiawei686/wechat-dev-mcp)
- [weapp-dev-mcp](https://github.com/yfmeii/weapp-dev-mcp)
