/**
 * Vue3 微信小程序编译器主入口文件
 */

import { Vue3MiniprogramCompiler } from './compiler/index.js'
import type { CompilerOptions } from './types/index.js'

// 导出主编译器类
export { Vue3MiniprogramCompiler as default, Vue3MiniprogramCompiler, Vue3MiniprogramCompiler as FuckMPCompiler }

// 导出编译器相关
export * from './compiler/index.js'

// 导出类型定义
export * from './types/index.js'

// 导出解析器
export * from './parser/index.js'

// 导出转换器（避免类型冲突）
export {
  ScriptTransformer,
  TemplateTransformer,
  StyleTransformer,
  EnhancedScriptTransformer
} from './transformer/index.js'

// 导出生成器
export * from './generator/index.js'

// 导出运行时（避免类型冲突）
export {
  Vue3MiniRuntime,
  initVue3Runtime,
  definePage,
  defineComponent
} from './runtime/index.js'

// 导出工具函数
export * from './utils/index.js'

/**
 * 创建编译器实例的便捷函数
 */
export function createCompiler(options?: Partial<CompilerOptions>) {
  return new Vue3MiniprogramCompiler(options)
}

/**
 * 编译单个文件的便捷函数
 */
export async function compileFile(
  filePath: string,
  options?: Partial<CompilerOptions>
) {
  const compiler = createCompiler(options)
  return await compiler.compileFile(filePath)
}

/**
 * 编译整个项目的便捷函数
 */
export async function compile(options?: Partial<CompilerOptions>) {
  const compiler = createCompiler(options)
  return await compiler.compile()
}

/**
 * 版本信息
 */
export const version = '1.0.0'

/**
 * 编译器信息
 */
export const compilerInfo = {
  name: 'Vue3 MiniProgram Compiler',
  version,
  description: '将 Vue3 单文件组件编译为原生微信小程序的编译器工具',
  author: 'Vue3 MiniProgram Compiler Team',
  homepage: 'https://github.com/vue3-miniprogram/compiler',
  repository: 'https://github.com/vue3-miniprogram/compiler.git',
  license: 'MIT'
}
