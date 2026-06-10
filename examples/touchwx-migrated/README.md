# TouchWX 迁移示例

该目录由 `scripts/migrate-touchwx.ts` 从 `/Users/bing/Workspace/touchwx/touchwx` 生成，用于真实测试 FuckMP 对 Vue3 SFC → 原生微信小程序的编译能力。

## 迁移范围

- 页面：84 个 `.wx` 页面迁移为 `.vue` 页面。
- TouchWX UI 标签：42 种 `ui-*` 标签；其中 37 个复用第一阶段 `_original` 转换组件，5 个使用轻量补位组件（ui-button, ui-col, ui-image, ui-input, ui-row）。
- 静态资源：images, static/data, static/map。
- 保留原模板中的微信原生语法，例如 `wx:for`、`bindtap`、`map`、`swiper`、`scroll-view`、`button` 等。

## 已知边界

- TouchWX 旧脚本按最小可编译策略迁移为 `<script setup lang="ts">`，保留核心状态、方法和生命周期；复杂运行时语义后续逐步增强。
- `ui-*` 组件优先来自 `_original` 迁移结果；`_original` 不存在的页面级兼容标签仍以轻量补位方式保证编译和 DevTools 打开验证。
- 该示例是迁移夹具，重新运行迁移脚本会覆盖本目录。

## 重新生成

```bash
pnpm tsx scripts/migrate-touchwx.ts
```
