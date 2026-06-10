# TouchWX _original 迁移示例

该目录由 `scripts/migrate-touchwx-original.ts` 从 `/Users/bing/Workspace/touchwx/_original` 生成，是 TouchWX 迁移的第一阶段验收夹具。

## 迁移范围

- scaffold 页面：4 个 `.wx` 页面迁移为 `.vue` 页面。
- 原始组件库：43 个 `.wxc` 组件迁移为 Vue3 SFC。
- 静态资源：static/data, static/styles, static/utils, components/images。

## 验收目标

先确保 `_original` 可以在当前 FuckMP Vue3 开发方式下完成 SFC 解析和小程序编译，再继续迁移真实 `touchwx/touchwx` 应用。
