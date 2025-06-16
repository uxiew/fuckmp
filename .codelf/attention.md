## Development Guidelines

### Framework and Language
> Vue3 到微信小程序编译器项目的技术栈选择和最佳实践指南

**Framework Considerations:**
- Vue3 兼容性: 确保支持 Vue3 的所有核心特性，包括 Composition API、`<script setup>`、响应式系统
- TypeScript 5.6+: 使用最新的 TypeScript 特性，确保类型安全和开发体验
- Node.js 18+: 利用现代 Node.js 特性，如 ES Modules、顶层 await 等
- 编译器架构: 采用模块化设计，parser -> transformer -> generator 的清晰流程
- 重要框架注意事项:
	* Vue3 编译器 API 变化频繁，需要锁定版本并及时跟进更新
	* Babel 插件系统复杂，需要深入理解 AST 操作
	* 微信小程序 API 限制较多，需要仔细处理兼容性问题

**Language Best Practices:**
- 严格类型检查: 使用 TypeScript strict 模式，确保类型安全
- 现代 ES 特性: 使用 ES2022+ 特性，如可选链、空值合并等
- 一致性原则: 统一的命名规范、代码风格和项目结构
- 文档完整性: 为所有公共 API 提供 JSDoc 注释和使用示例

### Code Abstraction and Reusability
> 编译器项目的模块化设计和代码复用策略，确保各个组件职责明确、易于维护和扩展

**Modular Design Principles:**
- 单一职责: 每个模块只负责一个特定功能 (parser 只解析，transformer 只转换)
- 高内聚低耦合: 相关功能集中在同一模块，模块间依赖最小化
- 稳定接口: 对外暴露稳定的 API，内部实现可以灵活变化
- 插件化架构: 支持自定义转换器和生成器插件

**Reusable Component Library:**
```
src/
├── utils/                          # 通用工具函数库
│   ├── file-utils.ts              # 文件操作: readFile, writeFile, ensureDir 等
│   ├── ast-utils.ts               # AST 操作: traverse, transform, generate 等
│   ├── logger.ts                  # 日志工具: info, warn, error, debug 等
│   └── path-utils.ts              # 路径处理: resolve, relative, normalize 等
├── transformer/macro-handlers/     # Vue3 宏处理器 (可复用的转换逻辑)
│   ├── define-props.ts            # defineProps 宏转换逻辑
│   ├── define-emits.ts            # defineEmits 宏转换逻辑
│   ├── reactivity.ts              # ref/reactive/computed 转换逻辑
│   └── lifecycle.ts               # 生命周期钩子转换逻辑
├── runtime/                       # 运行时适配层 (可在小程序中复用)
│   ├── reactivity.ts             # 响应式系统适配
│   ├── lifecycle.ts              # 生命周期适配
│   └── event-system.ts           # 事件系统适配
└── types/                         # 类型定义 (项目内通用类型)
    ├── compiler.ts               # 编译器相关类型
    ├── vue.ts                    # Vue 相关类型扩展
    └── miniprogram.ts            # 小程序相关类型定义
```

### Coding Standards and Tools
**Code Formatting Tools:**
- ESLint (^8.0.0) // TypeScript/JavaScript 代码检查，使用 @typescript-eslint 规则
- Prettier (^3.0.0) // 代码格式化，统一代码风格
- TypeScript (^5.6.0) // 类型检查，使用 strict 模式

**Naming and Structure Conventions:**
- 语义化命名: 变量/函数名应清晰表达其用途 (如 parseVueComponent, transformTemplate)
- 一致的命名风格:
  * 文件名使用 kebab-case (vue-parser.ts)
  * 类名使用 PascalCase (VueCompiler)
  * 函数/变量使用 camelCase (parseScript)
  * 常量使用 UPPER_SNAKE_CASE (VUE3_MACROS)
- 目录结构按功能职责划分，每个模块有明确的边界

### 编译器架构设计标准
**编译流程设计:**
- 清晰的编译管道: Vue SFC → AST 解析 → 语法转换 → 代码生成 → 小程序文件
	* 每个阶段职责明确，便于调试和维护
	* 支持增量编译和缓存机制
- 及时的错误处理和报告
	* 在每个编译阶段提供详细的错误信息
	* 支持 source map 用于调试
- 统一的配置管理
	* 使用 TypeScript 接口定义编译选项
	* 支持配置文件和 CLI 参数

**数据流转:**
- 清晰的 AST 转换流程
	* 使用标准的 Babel AST 格式
	* 每个转换器只处理特定的语法结构
- 类型安全的数据传递
	* 所有中间数据结构都有明确的 TypeScript 类型定义
	* 使用泛型确保类型安全
- 标准化的异步操作处理
	* 统一使用 async/await 处理异步编译任务
	* 支持并行编译多个文件

### Performance and Security
**编译性能优化重点:**
- 编译速度优化
	* 使用并行编译处理多个文件
	* 实现增量编译，只编译变更的文件
	* 使用缓存机制避免重复编译
- 内存使用优化
	* 及时释放大型 AST 对象
	* 使用流式处理大文件
	* 避免内存泄漏
- 合适的缓存策略
	* 缓存解析结果和转换结果
	* 使用文件哈希判断是否需要重新编译

**安全措施:**
- 输入验证和过滤
	* 验证 Vue 文件的合法性
	* 过滤潜在的恶意代码注入
	* 限制文件大小和复杂度
- 敏感信息保护
	* 不在编译产物中暴露源码路径
	* 清理调试信息和注释
- 访问控制机制
	* 限制编译器只能访问指定目录
	* 防止路径遍历攻击