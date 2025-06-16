## Vue3 微信小程序编译器 (Vue3 to WeChat MiniProgram Compiler)

> 一个将 Vue3 单文件组件编译为原生微信小程序的编译器工具

> 支持 Vue3 的完整特性，包括 `<script setup>`、TypeScript、SCSS、响应式系统、双向绑定、事件系统等，能够将复杂的 Vue3 组件转换为高质量的微信小程序代码

> 项目状态：🎉 生产就绪 - 核心编译功能已实现并通过综合测试，响应式系统基于 @vue/reactivity 重构，WXML 编译错误已修复，AST 模板转换器完美实现，可稳定编译 Vue3 项目为小程序格式

> 开发团队：个人项目

> 技术栈：TypeScript 5.6+、Node.js、Vue3 编译器、Babel、PostCSS、SCSS、Vitest 测试框架、pnpm 包管理



## Dependencies

* @vue/compiler-sfc (^3.4.0): Vue3 单文件组件编译器，用于解析 .vue 文件
* @vue/reactivity (^3.4.0): Vue3 官方响应式系统，替代自定义响应式实现
* @babel/core (^7.23.0): JavaScript 编译器，用于 AST 转换和代码生成
* @babel/parser (^7.23.0): JavaScript 解析器，用于解析 script 部分
* @babel/traverse (^7.23.0): AST 遍历工具，用于转换语法树
* @babel/types (^7.23.0): AST 节点类型定义
* sass (^1.69.0): SCSS 编译器，用于样式预处理
* postcss (^8.4.0): CSS 后处理器，用于样式转换和优化
* chokidar (^3.5.0): 文件监听器，用于开发模式热更新
* commander (^11.0.0): CLI 工具框架
* typescript (^5.6.0): TypeScript 编译器
* vitest (^1.0.0): 测试框架
* eslint (^8.0.0): 代码检查工具
* prettier (^3.0.0): 代码格式化工具


## Development Environment

> 开发环境要求：
> - Node.js 18+ (推荐使用 fnm 管理版本)
> - pnpm 8+ (包管理工具)
> - TypeScript 5.6+ (类型检查)
> - macOS/Linux/Windows (跨平台支持)

> 开发工具：
> - VS Code + Vue Language Features 插件
> - 微信开发者工具 (用于预览编译结果)

> 构建脚本：
> - `pnpm dev`: 开发模式，启动文件监听和热更新
> - `pnpm build`: 构建生产版本
> - `pnpm test`: 运行测试套件
> - `pnpm lint`: 代码检查和格式化
> - `pnpm type-check`: TypeScript 类型检查


## Structure

> 项目采用模块化架构，核心编译器分为 parser、transformer、generator、runtime 四个主要模块，每个模块职责明确，便于维护和扩展。

```
root
├── plan/                           # 设计文档目录
│   ├── design.md                   # 项目设计文档，包含技术方案和实现思路
│   ├── vue-to-miniprogram-compiler-v1.ts  # 编译器架构设计 v1
│   ├── vue-to-miniprogram-compiler-v2.ts  # 编译器架构设计 v2 (增强版)
│   └── vue-to-miniprogram-compiler-v3.ts  # 编译器架构设计 v3 (完整版)
├── src/                            # ✅ 源代码目录 (已完成)
│   ├── index.ts                   # ✅ 主入口文件
│   ├── parser/                    # ✅ SFC 解析器模块 (已完成)
│   │   ├── index.ts               # ✅ 解析器入口，导出主要解析功能
│   │   ├── sfc-parser.ts          # ✅ Vue SFC 文件解析器
│   │   ├── script-parser.ts       # ✅ Script 部分解析器，处理 <script setup>
│   │   ├── template-parser.ts     # ✅ Template 部分解析器
│   │   └── style-parser.ts        # ✅ Style 部分解析器，支持 SCSS
│   ├── transformer/               # ✅ AST 转换器模块 (已完成)
│   │   ├── index.ts               # ✅ 转换器入口
│   │   ├── script-transformer.ts  # ✅ Script 转换器，处理 Vue3 宏和响应式
│   │   ├── template-transformer.ts # ✅ Template 转换器，Vue 模板到 WXML
│   │   ├── style-transformer.ts   # ✅ Style 转换器，CSS 到 WXSS
│   │   └── macro-handlers/        # ✅ Vue3 宏处理器 (已完成)
│   │       ├── index.ts           # ✅ 宏处理器入口
│   │       ├── define-props.ts    # ✅ defineProps 宏处理
│   │       ├── define-emits.ts    # ✅ defineEmits 宏处理
│   │       ├── reactivity.ts      # ✅ ref/reactive/computed 处理
│   │       └── lifecycle.ts       # ✅ 生命周期钩子处理
│   ├── generator/                 # ✅ 代码生成器模块 (已完成)
│   │   ├── index.ts               # ✅ 生成器入口
│   │   ├── component-generator.ts # ✅ 小程序组件代码生成
│   │   ├── page-generator.ts      # ✅ 小程序页面代码生成
│   │   └── config-generator.ts    # ✅ 配置文件生成 (app.json, *.json)
│   ├── runtime/                   # ✅ 运行时适配层 (已完成)
│   │   ├── index.ts               # ✅ 运行时入口
│   │   ├── reactivity.ts          # ✅ 响应式系统适配
│   │   ├── lifecycle.ts           # ✅ 生命周期适配
│   │   └── event-system.ts        # ✅ 事件系统适配
│   ├── compiler/                  # ✅ 主编译器 (已完成)
│   │   ├── index.ts               # ✅ 编译器入口
│   │   ├── compiler.ts            # ✅ 主编译器类
│   │   ├── options.ts             # ✅ 编译选项定义
│   │   └── utils.ts               # ✅ 编译工具函数
│   ├── cli/                       # ✅ CLI 工具 (已完成)
│   │   ├── index.ts               # ✅ CLI 入口
│   │   └── commands/              # ✅ CLI 命令
│   │       ├── build.ts           # ✅ 构建命令
│   │       └── create.ts          # ✅ 创建项目命令
│   ├── utils/                     # ✅ 工具函数 (已完成)
│   │   ├── index.ts               # ✅ 工具函数入口
│   │   ├── file-utils.ts          # ✅ 文件操作工具
│   │   ├── ast-utils.ts           # ✅ AST 操作工具
│   │   ├── path-utils.ts          # ✅ 路径处理工具
│   │   └── logger.ts              # ✅ 日志工具
│   └── types/                     # ✅ 类型定义 (已完成)
│       ├── index.ts               # ✅ 类型定义入口
│       ├── compiler.ts            # ✅ 编译器类型定义
│       ├── vue.ts                 # ✅ Vue 相关类型定义
│       └── miniprogram.ts         # ✅ 小程序相关类型定义
├── tests/                         # 测试目录
│   ├── unit/                      # 单元测试
│   │   ├── parser/                # 解析器测试
│   │   ├── transformer/           # 转换器测试
│   │   └── generator/             # 生成器测试
│   ├── integration/               # 集成测试
│   │   └── compiler/              # 编译器集成测试
│   ├── e2e/                       # 端到端测试
│   │   └── fixtures/              # 测试用例
│   └── __fixtures__/              # 测试数据
├── test-project/                  # ✅ 综合测试项目 (已完成)
│   ├── app.vue                    # ✅ 应用入口文件
│   ├── pages/                     # ✅ 页面目录
│   │   ├── index/index.vue        # ✅ 首页
│   │   └── profile/index.vue      # ✅ 个人中心页面
│   └── components/                # ✅ 组件目录
│       ├── UserCard.vue           # ✅ 用户卡片组件
│       └── LoadingSpinner.vue     # ✅ 加载动画组件
├── test-output/                   # ✅ 编译输出目录 (已生成)
│   ├── app.js/json/wxml/wxss      # ✅ 应用文件
│   ├── pages/                     # ✅ 页面文件
│   ├── components/                # ✅ 组件文件
│   └── project.config.json        # ✅ 项目配置
├── test-report.md                 # ✅ 综合测试报告
├── examples/                      # 示例项目
│   ├── basic/                     # 基础示例
│   ├── advanced/                  # 高级示例
│   └── real-world/                # 真实项目示例
├── docs/                          # 文档目录
│   ├── api/                       # API 文档
│   ├── guide/                     # 使用指南
│   └── examples/                  # 示例文档
├── .codelf/                       # 项目元信息
│   ├── project.md                 # 项目描述文件
│   ├── attention.md               # 开发注意事项
│   └── _changelog.md              # 变更日志模板
├── package.json                   # 项目配置和依赖
├── tsconfig.json                  # TypeScript 配置
├── vitest.config.ts               # 测试配置
├── eslint.config.js               # ESLint 配置
├── prettier.config.js             # Prettier 配置
└── README.md                      # 项目说明文档
```
