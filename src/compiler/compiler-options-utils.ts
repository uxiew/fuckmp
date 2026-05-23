/**
 * 编译器选项纯函数工具。
 */

import type { CompilerOptions } from '@/types/index.js'

/** 默认编译器选项。 */
export const DEFAULT_COMPILER_OPTIONS: CompilerOptions = {
  input: 'src',
  output: 'dist',
  mode: 'development',
  appId: 'your-app-id',
  framework: 'vue3',
  features: {
    scriptSetup: true,
    scss: true,
    typescript: true,
    compositionApi: true,
    emits: true,
    slots: true,
    provide: true
  },
  optimization: {
    minify: false,
    treeshaking: true,
    sourcemap: true,
    incremental: true
  },
  injection: {
    // 默认启用纯净模式，不自动注入任何代码
    pureMode: true,
    page: {
      shareAppMessage: false,
      shareTimeline: false,
      loadingState: false,
      pullDownRefresh: false,
      reachBottom: false,
      baseStyles: false,
      eventHandlers: false
    },
    component: {
      inputHandlers: false,
      eventHandlers: false
    },
    reactivity: {
      extraHelpers: false  // 额外的响应式辅助方法（核心方法始终生成）
    }
  }
}

/** 验证编译器选项。 */
export function validateCompilerOptions(options: Partial<CompilerOptions>): { valid: boolean; errors: string[] } {
  const errors: string[] = []

  // 验证必需字段
  if (!options.input) {
    errors.push('input 选项是必需的')
  }

  if (!options.output) {
    errors.push('output 选项是必需的')
  }

  if (!options.appId) {
    errors.push('appId 选项是必需的')
  }

  // 验证框架
  if (options.framework && options.framework !== 'vue3') {
    errors.push('目前只支持 vue3 框架')
  }

  // 验证特性配置
  if (options.features) {
    const { features } = options

    if (features.typescript && !features.scriptSetup) {
      errors.push('使用 TypeScript 时建议启用 scriptSetup')
    }
  }

  return {
    valid: errors.length === 0,
    errors
  }
}

/** 深合并编译器选项。 */
export function mergeCompilerOptions(
  base: CompilerOptions,
  updates: Partial<CompilerOptions>
): CompilerOptions {
  return {
    ...base,
    ...updates,
    features: {
      ...base.features,
      ...updates.features
    },
    optimization: {
      ...base.optimization,
      ...updates.optimization
    },
    injection: {
      ...base.injection,
      ...updates.injection,
      page: {
        ...base.injection.page,
        ...updates.injection?.page
      },
      component: {
        ...base.injection.component,
        ...updates.injection?.component
      },
      reactivity: {
        ...base.injection.reactivity,
        ...updates.injection?.reactivity
      }
    }
  }
}

/** 规范化编译器选项。 */
export function normalizeCompilerOptions(options: Partial<CompilerOptions>): CompilerOptions {
  return mergeCompilerOptions(DEFAULT_COMPILER_OPTIONS, options)
}

/** 生成配置摘要。 */
export function createCompilerOptionsSummary(options: CompilerOptions): string {
  const { input, output, framework, features, optimization } = options

  const enabledFeatures = Object.entries(features)
    .filter(([, enabled]) => enabled)
    .map(([feature]) => feature)
    .join(', ')

  const enabledOptimizations = Object.entries(optimization)
    .filter(([, enabled]) => enabled)
    .map(([opt]) => opt)
    .join(', ')

  return `编译器配置摘要:
- 输入目录: ${input}
- 输出目录: ${output}
- 框架: ${framework}
- 启用特性: ${enabledFeatures}
- 启用优化: ${enabledOptimizations}`
}
