# TouchWX 迁移示例

该目录由 `scripts/migrate-touchwx.ts` 从 `/Users/bing/Workspace/touchwx/touchwx` 生成，用于真实测试 FuckMP 对 Vue3 SFC → 原生微信小程序的编译能力。

## 迁移范围

- 页面：84 个 `.wx` 页面迁移为 `.vue` 页面。
- TouchWX UI 标签：42 种 `ui-*` 标签生成轻量 Vue3 stub 组件，避免微信开发者工具缺组件。
- 静态资源：images, static/data, static/map。
- 保留原模板中的微信原生语法，例如 `wx:for`、`bindtap`、`map`、`swiper`、`scroll-view`、`button` 等。

## 已知边界

- TouchWX 旧脚本按最小可编译策略迁移为 `<script setup lang="ts">`，保留核心状态、方法和生命周期；复杂运行时语义后续逐步增强。
- `ui-*` 组件当前是轻量占位，不复刻 TouchUI 完整交互，只用于真实页面编译和 DevTools 打开验证。
- 该示例是迁移夹具，重新运行迁移脚本会覆盖本目录。

## 重新生成

```bash
pnpm tsx scripts/migrate-touchwx.ts
```
