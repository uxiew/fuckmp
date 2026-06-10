import { describe, expect, it } from 'vitest'
import type { CompilerOptions } from '@/types/index.js'
import {
  createCompilerOptionsSummary,
  DEFAULT_COMPILER_OPTIONS,
  mergeCompilerOptions,
  normalizeCompilerOptions,
  validateCompilerOptions
} from '@/compiler/compiler-options-utils.js'

describe('compiler options utils', () => {
  it('验证必需字段、框架限制和 TypeScript/scriptSetup 旧语义', () => {
    expect(validateCompilerOptions({})).toEqual({
      valid: false,
      errors: ['input 选项是必需的', 'output 选项是必需的', 'appId 选项是必需的']
    })

    expect(validateCompilerOptions({
      input: 'src',
      output: 'dist',
      appId: 'appid',
      framework: 'react' as any
    })).toEqual({
      valid: false,
      errors: ['目前只支持 vue3 框架']
    })

    expect(validateCompilerOptions({
      input: 'src',
      output: 'dist',
      appId: 'appid',
      features: {
        typescript: true,
        scriptSetup: false
      } as any
    })).toEqual({
      valid: false,
      errors: ['使用 TypeScript 时建议启用 scriptSetup']
    })
  })

  it('规范化选项时保持默认值并深合并 features、optimization 与 injection', () => {
    const normalized = normalizeCompilerOptions({
      input: 'app',
      output: 'build',
      appId: 'wx-test',
      features: { scss: false } as any,
      optimization: { minify: true } as any,
      injection: {
        pureMode: false,
        page: { shareAppMessage: true },
        component: { inputHandlers: true },
        reactivity: { extraHelpers: true }
      } as any
    })

    expect(normalized).toMatchObject({
      input: 'app',
      output: 'build',
      appId: 'wx-test',
      features: {
        scriptSetup: true,
        scss: false,
        typescript: true
      },
      optimization: {
        minify: true,
        treeshaking: true,
        sourcemap: true
      },
      injection: {
        pureMode: false,
        page: {
          shareAppMessage: true,
          shareTimeline: false
        },
        component: {
          inputHandlers: true,
          eventHandlers: false
        },
        reactivity: {
          extraHelpers: true
        }
      }
    })
    expect(normalized.features.provide).toBe(DEFAULT_COMPILER_OPTIONS.features.provide)
  })

  it('更新选项时以当前配置为 base 并保持嵌套注入配置', () => {
    const current = normalizeCompilerOptions({
      input: 'src',
      output: 'dist',
      appId: 'appid',
      injection: {
        pureMode: false,
        page: { shareAppMessage: true },
        component: { eventHandlers: true },
        reactivity: { extraHelpers: true }
      } as any
    })

    const merged = mergeCompilerOptions(current, {
      output: 'out',
      features: { scss: false } as any,
      injection: {
        page: { shareTimeline: true }
      } as any
    })

    expect(merged.output).toBe('out')
    expect(merged.features.scss).toBe(false)
    expect(merged.features.scriptSetup).toBe(true)
    expect(merged.injection.pureMode).toBe(false)
    expect(merged.injection.page.shareAppMessage).toBe(true)
    expect(merged.injection.page.shareTimeline).toBe(true)
    expect(merged.injection.component.eventHandlers).toBe(true)
    expect(merged.injection.reactivity.extraHelpers).toBe(true)
  })

  it('生成配置摘要时保持原有格式', () => {
    const options: CompilerOptions = normalizeCompilerOptions({
      input: 'src',
      output: 'dist',
      appId: 'appid',
      features: { scss: false } as any,
      optimization: { minify: true, sourcemap: false } as any
    } as any)

    expect(DEFAULT_COMPILER_OPTIONS.input).toBe('src')
    expect(createCompilerOptionsSummary(options)).toBe(`编译器配置摘要:
- 输入目录: src
- 输出目录: dist
- 框架: vue3
- 启用特性: scriptSetup, typescript, compositionApi, emits, slots, provide
- 启用优化: minify, treeshaking, incremental`)
  })
})
