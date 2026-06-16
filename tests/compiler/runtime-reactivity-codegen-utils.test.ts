import { describe, expect, it } from 'vitest'
import {
  generateComputedRuntimeCode,
  generateReactiveRuntimeCode,
  generateReactivityRuntimeCode,
  generateRefRuntimeCode
} from '@/compiler/codegen/runtime-reactivity-codegen-utils.js'

describe('runtime reactivity codegen utils', () => {
  it('生成 ref runtime 代码片段并保留 setData 与只读属性语义', () => {
    const code = generateRefRuntimeCode()

    expect(code).toContain('function ref(value, context, name)')
    expect(code).toContain('context.setData({ [key]: value })')
    expect(code).toContain("target._context.setData({ [target._key]: newValue })")
    expect(code).toContain('尝试修改 ref 的只读属性')
  })

  it('生成 reactive runtime 代码片段并保留嵌套路径 setData 语义', () => {
    const code = generateReactiveRuntimeCode()

    expect(code).toContain('function reactive(obj, context, name)')
    expect(code).toContain('const proxyCache = new WeakMap()')
    expect(code).toContain("? `${key}.${[...path, prop].join('.')}`")
    expect(code).toContain('context.setData({ [fullPath]: newValue })')
    expect(code).toContain('context.setData({ [fullPath]: undefined })')
  })

  it('生成 computed runtime 代码片段并保留只读和循环依赖保护', () => {
    const code = generateComputedRuntimeCode()

    expect(code).toContain('function computed(getter, context, name)')
    expect(code).toContain('检测到计算属性')
    expect(code).toContain('计算属性 ${target._key} 的 value 是只读的')
    expect(code).toContain('target._context.setData({ [target._key]: _value })')
  })

  it('按 header、ref、reactive、computed 顺序组合响应式 runtime', () => {
    const code = generateReactivityRuntimeCode()

    const headerIndex = code.indexOf('// ===== 响应式系统 =====')
    const refIndex = code.indexOf('function ref(value, context, name)')
    const reactiveIndex = code.indexOf('function reactive(obj, context, name)')
    const computedIndex = code.indexOf('function computed(getter, context, name)')

    expect(headerIndex).toBeGreaterThanOrEqual(0)
    expect(refIndex).toBeGreaterThan(headerIndex)
    expect(reactiveIndex).toBeGreaterThan(refIndex)
    expect(computedIndex).toBeGreaterThan(reactiveIndex)
  })
})
