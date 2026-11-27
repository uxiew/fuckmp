# Vue 模板 → 微信原生产物契约

以下以默认 Vue AST 编译链路为准。小程序端不加载 Vue renderer、DOM 模拟层或通用模板运行时。

| Vue 写法 | 产物和支持边界 |
| --- | --- |
| 插值、静态属性、静态参数的 v-bind | WXML 文本及 Mustache 属性；部分 HTML 标签/属性映射到微信原生（如 a/href → navigator/url）。括号参数若是合法属性名或事件名的字符串字面量，按静态参数处理；真正动态的属性名、事件名、模型名及无参数绑定/监听对象明确降级并省略。 |
| v-if / v-else-if / v-else、v-show | wx:if / wx:elif / wx:else（必要时用 block），以及反向 hidden。 |
| v-for | 数组映射 wx:for / wx:for-item / wx:for-index，未声明的循环索引不会覆盖外层索引。直接 item 字段或原始值 *this 可作 wx:key；复合 key / 索引 key 标注并省略。整数常量区间用 WXS 生成 1 到 N。可识别的对象枚举和解构标注并省略；不对未知数据类型做 Vue 运行时枚举。 |
| 静态和动态 class/style | 静态字符串保留；class 对象为条件类名；style 对象展开为 CSS 声明。数组按顺序组合字符串、对象或嵌套数组；动态值仅支持已规范化的字符串而非任意运行时对象。 |
| 模板表达式 | WXML 可表达的值、属性读取、基础运算使用原生表达式；已知方法可走 wxsH，也允许显式声明的 WXS 模块调用。JS 函数调用、可选链等非原生表达式标注并以 null 替换；不存在通用 JS 表达式执行器。 |
| v-on | 事件名按原生映射（如 click → tap），普通监听 bind:；.stop → catch:；.capture → capture-bind:；.capture.stop → capture-catch:，按微信事件本身是否支持冒泡/捕获。方法名和仅传 `$event` 的调用直接绑定；其他可表达的参数使用 `data-arg*`，由生成的处理器解码静态字面量并透传动态绑定值。 |
| 其他事件修饰符 | .prevent、.self、.once、.passive、按键/鼠标等没有对应的原生绑定协议；输出诊断并省略监听器，不偷偷改变语义。mut-bind 是微信互斥事件的原生概念，和这些 Vue 修饰符都不等价。 |
| v-model | 已覆盖的原生输入和静态参数组件模型映射到属性、事件、回写；复杂 Vue transform 不应推断为支持。 |
| v-html | 近似：在宿主中生成 rich-text 的 nodes 绑定，用微信支持的富文本子集渲染；不是 HTML DOM 注入，不执行脚本，内部不能承载 Vue 事件或组件；只传入可信内容。 |
| 静态 slots、scoped/dynamic slots | 默认/具名静态 slot 使用原生 WXML slot 和 JS Component() 多插槽选项；scoped/dynamic slots 及 Transition/KeepAlive 保持明确降级。 |

事件参考：[微信 WXML 事件](https://developers.weixin.qq.com/miniprogram/dev/framework/view/wxml/event.html)。对于省略的指令、修饰符或参数，生成 JS 的 `unsupported template capabilities:` 列出能力名；CLI 和 `CompileResult.warnings` 同时报告源文件和降级能力。这不会引入替代运行时。基础 slot 详见 [native-first runtime boundary](./native-first-runtime-boundary.md)。

## S/P 接口

- `TransformContext.templateUnsupported` 保留原结构；只扩充 capabilities 的值。模板阶段在上下文记录可选的 `templateWxsModules: ReadonlySet<string>`，供表达式检查使用；脚本和最终 codegen 无需提供它。`TemplateTransformResult` 额外用 `datasetEventHandlers` 标记有模板参数调用的方法；每个绑定的 `data-fmp-args` 标记其静态参数类型。
- 页面、组件最终 JS 的 codegen 现在也保留模板能力诊断；断言可针对整项目编译或 `refreshProjectOutputs()` 后的产物。不要只依赖中间 JS。
- 默认使用 Vue AST；`TemplateTransformer` 的显式 parser 选项属于公开 API，不把旧 AST/增强模式视为不可达。默认路径的异常/无 AST 时也仍可回退到字符串；后续需要用真实输入验证后，才能改变回退策略。
