# 真实小程序示例

这个示例用于验收 Vue3 到微信小程序编译链路的完整性。

## 覆盖特性

### 页面与组件

- **app.vue**：应用入口，`onMounted` 映射到 `App.onLaunch`（同步执行）
- **pages/index/index.vue**：首页，`v-show` → `hidden`，`@click` → `bind:tap`，`<a href>` → `<navigator>`
- **pages/profile.vue**：资料页，ref / computed / v-if、原生组件全覆盖

### 组件

| 组件 | 覆盖特性 |
|------|---------|
| `UserCard.vue` | props、withDefaults、emits、`<img>` → `<image>` 映射 |
| `CounterInput.vue` | `defineModel`、组件 v-model、输入修饰符 |
| `ActivityList.vue` | v-if / v-for、动态 class、事件参数 → dataset |
| `SlotPanel.vue` | default / named slots、multipleSlots、styleIsolation |

### 响应式系统

- `ref()` / `reactive()` / `computed()` → 运行时 Proxy + `setData` 桥接
- computed 自动计算初始值
- ref/reactive 修改后自动触发 computed 更新

### 模板编译

- **v-if/v-for**：单子节点直接注入 `wx:if` / `wx:for`，无多余 `<view>` 包裹
- **WXS 辅助模块**：`.includes()` 等 JS 方法自动转换为 `wxsH.includes()` WXS 调用
- **原生组件文本**：`<movable-view>` / `<cover-view>` 内的纯文本子节点正确保留

### 事件系统

| 特性 | 映射 |
|------|------|
| `@click` | `bind:tap` |
| `@click.stop` | `catch:tap` |
| `@click.capture` | `capture-bind:tap` |
| `@click.capture.stop` | `capture-catch:tap` |
| touch / longtap / longpress | 原生事件透传 |

### 原生组件覆盖

scroll-view、swiper、video、movable-area / movable-view、cover-view / cover-image、canvas、map、camera、live-player、live-pusher、editor、web-view、page-container、progress、picker-view、rich-text、icon、text、button、switch、picker、slider、radio-group、checkbox-group、form。

> 为减少游客模式下的 DevTools 噪声，video、camera、live-player、live-pusher 和 web-view 默认不主动挂载，保留按钮手动加载。

### 样式

- Scoped 样式（`data-v-` 属性），自动排除 slot/block 控制标签
- SCSS 预处理
- 有 slot 的组件自动 `styleIsolation: "apply-shared"`

## 验证命令

```bash
# 编译验收测试
pnpm vitest run tests/e2e/real-example-acceptance.test.ts

# 手动编译
fuckmp build --input examples/real-miniprogram --output test-output/real-miniprogram --app-id touristappid
```

### 微信开发者工具

默认安全跳过 GUI 调用：

```bash
pnpm test:real-devtools
```

显式 opt-in：

```bash
FUCKMP_REAL_DEVTOOLS_SMOKE=1 \
WECHAT_IDE_CLI=/Applications/wechatwebdevtools.app/Contents/MacOS/cli \
pnpm test:real-devtools
```

### 环境变量

| 变量 | 说明 | 默认值 |
|------|------|--------|
| `FUCKMP_REAL_MINIPROGRAM_APPID` | 覆盖 AppID | `touristappid` |
| `FUCKMP_REAL_MINIPROGRAM_OUTPUT` | 覆盖输出目录 | `test-output/real-miniprogram` |
| `WECHAT_DEVTOOLS_AUTO_PORT` | 自动化端口 | `9420` |

### MCP 集成

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

默认使用 `touristappid`。如需上传、预览或真机验收，请替换为合法 AppID 并确认微信开发者工具已登录。
