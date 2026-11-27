# 社区自提示例

这是一个可离线运行的业务示例，使用固定商品列表，不连接服务端，也不保存预订。首页展示当周商品；点击商品卡的「预订一份」后，页面更新预订数量；点击「查看自提须知」进入说明页，再返回首页。

以下命令在仓库根目录执行，`fuckmp` 为已安装的 CLI：

```sh
fuckmp build --input examples/community-pickup --output test-output/community-pickup --app-id touristappid
pnpm vitest run tests/e2e/native-project-acceptance.test.ts
```

静态验收覆盖原生页面与组件注册、组件事件、列表和条件渲染、路径、SCSS 及可序列化的初始数据。要核对微信客户端行为，请用微信开发者工具打开输出目录并手动完成上述操作。
