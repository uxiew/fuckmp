/**
 * 编译器核心类型定义
 */

import type { SFCDescriptor } from '@vue/compiler-sfc'
import type { Node as BabelNode } from '@babel/types'

/**
 * 编译器选项配置
 */
export interface CompilerOptions {
  /** 输入目录 */
  input: string
  /** 输出目录 */
  output: string
  /** 小程序 AppID */
  appId: string
  /** 框架版本 */
  framework: 'vue3'
  /** 功能特性配置 */
  features: {
    /** 支持 <script setup> */
    scriptSetup: boolean
    /** 支持 SCSS */
    scss: boolean
    /** 支持 TypeScript */
    typescript: boolean
    /** 支持组合式 API */
    compositionApi: boolean
    /** 支持 emits */
    emits: boolean
    /** 支持插槽 */
    slots: boolean
    /** 支持 provide/inject */
    provide: boolean
  }
  /** 优化配置 */
  optimization: {
    /** 代码压缩 */
    minify: boolean
    /** Tree Shaking */
    treeshaking: boolean
    /** Source Map */
    sourcemap: boolean
    /** 增量编译 */
    incremental: boolean
  }
  /** 代码注入控制配置 */
  injection: {
    /** 是否启用纯净模式（不自动注入任何代码） */
    pureMode: boolean
    /** 页面功能注入控制 */
    page: {
      /** 是否自动注入分享到好友功能 */
      shareAppMessage: boolean
      /** 是否自动注入分享到朋友圈功能 */
      shareTimeline: boolean
      /** 是否自动注入加载状态UI */
      loadingState: boolean
      /** 是否自动注入下拉刷新功能 */
      pullDownRefresh: boolean
      /** 是否自动注入上拉加载更多功能 */
      reachBottom: boolean
      /** 是否自动注入基础页面样式 */
      baseStyles: boolean
      /** 是否自动注入通用事件处理器 */
      eventHandlers: boolean
    }
    /** 组件功能注入控制 */
    component: {
      /** 是否自动注入输入处理器 */
      inputHandlers: boolean
      /** 是否自动注入事件处理器 */
      eventHandlers: boolean
    }
    /** 响应式系统注入控制 */
    reactivity: {
      /** 是否自动注入额外的响应式辅助方法（核心方法始终生成） */
      extraHelpers: boolean
    }
  }
}

/**
 * 解析结果
 */
export interface ParseResult {
  /** 文件路径 */
  filename: string
  /** SFC 描述符 */
  descriptor: SFCDescriptor
  /** 模板内容 */
  template?: {
    content: string
    lang?: string
    scoped?: boolean
  } | undefined
  /** 脚本内容 */
  script?: {
    content: string
    lang?: string
    setup?: boolean
  } | undefined
  /** 样式内容 */
  styles: Array<{
    content: string
    lang?: string
    scoped?: boolean
    module?: boolean | string
  }>
  /** 自定义块 */
  customBlocks: Array<{
    type: string
    content: string
    attrs: Record<string, string | true>
  }>
}

/**
 * 转换上下文
 */
export interface TransformContext {
  /** 文件名 */
  filename: string
  /** 是否为页面组件 */
  isPage: boolean
  /** 是否使用了 scoped 样式 */
  hasScoped: boolean
  /** Props 定义 */
  props: Record<string, any>
  /** Emits 定义 */
  emits: string[]
  /** 暴露的方法 */
  expose: Record<string, any>
  /** 响应式数据 */
  data: Record<string, any>
  /** 方法定义 */
  methods: Record<string, any>
  /** 计算属性 */
  computed: Record<string, any>
  /** 监听器 */
  watch: Record<string, any>
  /** 生命周期钩子 */
  lifecycle: Record<string, string>
  /** 导入的模块 */
  imports: Set<string>
  /** 使用的组件 */
  components: Map<string, string>
  /** 导入的样式文件 */
  styleImports?: string[]
}

/**
 * 生成结果
 */
export interface GenerateResult {
  /** JavaScript 代码 */
  js: string
  /** JSON 配置 */
  json: Record<string, any>
  /** WXML 模板 */
  wxml: string
  /** WXSS 样式 */
  wxss: string
  /** Source Map */
  sourceMap?: string
}

/**
 * 编译结果
 */
export interface CompileResult {
  /** 编译成功的文件 */
  success: string[]
  /** 编译失败的文件 */
  errors: Array<{
    file: string
    message: string
    stack?: string
  }>
  /** 编译统计 */
  stats: {
    /** 总文件数 */
    total: number
    /** 成功数 */
    success: number
    /** 失败数 */
    failed: number
    /** 编译时间 */
    duration: number
  }
}

/**
 * Babel AST 节点类型
 */
export type BabelASTNode = BabelNode

/**
 * 宏处理器类型
 */
export type MacroHandler = (node: BabelASTNode, context: TransformContext) => any

/**
 * 指令转换器类型
 */
export type DirectiveTransformer = (node: any, directive: any) => Record<string, any>

/**
 * 文件类型
 */
export type FileType = 'page' | 'component' | 'app'

/**
 * 编译模式
 */
export type CompileMode = 'development' | 'production'

/**
 * 日志级别
 */
export type LogLevel = 'debug' | 'info' | 'warn' | 'error'
