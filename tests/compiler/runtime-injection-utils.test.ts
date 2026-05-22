import { describe, expect, it } from 'vitest'
import {
  buildRuntimeConfig,
  generateMainRuntimeClassCode,
  generateReactivityRuntimeCode,
  generateRuntimeUtilityCode,
  needsRuntimeReactivity
} from '@/compiler/codegen/runtime-injection-utils.js'
import type { BundleResult } from '@/compiler/runtime-bundler'
import type { RuntimeInjectionConfig, Vue3FeatureUsage } from '@/compiler/runtime-injector'

const baseConfig: RuntimeInjectionConfig = {
  enableRuntime: true,
  runtimePath: './runtime/index.js',
  autoInject: true,
  runtimeConfig: {
    debug: true
  },
  plugins: { enableAll: true, include: [], exclude: [] },
  treeshaking: true,
  minify: false,
  codeSplitting: true,
  chunkStrategy: 'feature',
  runtimeVersion: 'test-runtime',
  customModules: []
}

const bundleResult: BundleResult = {
  code: '',
  modules: ['core', 'reactivity'],
  totalSize: 100,
  minifiedSize: 80
}

function createUsage(reactivity: Partial<Vue3FeatureUsage['reactivity']> = {}): Vue3FeatureUsage {
  return {
    reactivity: {
      ref: false,
      reactive: false,
      computed: false,
      watch: false,
      watchEffect: false,
      ...reactivity
    },
    composition: {
      setup: false,
      defineProps: false,
      defineEmits: false,
      defineExpose: false,
      provide: false,
      inject: false
    },
    directives: {
      vIf: false,
      vFor: false,
      vModel: false,
      vShow: false,
      vOn: false,
      vBind: false
    },
    lifecycle: {
      onMounted: false,
      onUnmounted: false,
      onUpdated: false,
      onBeforeMount: false,
      onBeforeUnmount: false,
      onBeforeUpdate: false
    },
    advanced: {
      slots: false,
      teleport: false,
      suspense: false,
      keepAlive: false,
      transition: false
    }
  }
}

describe('runtime-injection utils', () => {
  it('构造 runtime 配置并保留版本、模块与特性', () => {
    expect(buildRuntimeConfig(baseConfig, bundleResult, createUsage({ ref: true }))).toEqual({
      debug: true,
      features: createUsage({ ref: true }),
      modules: ['core', 'reactivity'],
      version: 'test-runtime'
    })
  })

  it('仅在已实现响应式能力被使用时需要响应式 runtime', () => {
    expect(needsRuntimeReactivity(createUsage())).toBe(false)
    expect(needsRuntimeReactivity(createUsage({ watch: true }))).toBe(false)
    expect(needsRuntimeReactivity(createUsage({ ref: true }))).toBe(true)
    expect(needsRuntimeReactivity(createUsage({ reactive: true }))).toBe(true)
    expect(needsRuntimeReactivity(createUsage({ computed: true }))).toBe(true)
  })

  it('生成稳定的 runtime 代码片段', () => {
    expect(generateRuntimeUtilityCode()).toContain('const logger = {')
    expect(generateReactivityRuntimeCode()).toContain('function ref(value, context)')
    expect(generateReactivityRuntimeCode()).toContain('function reactive(obj, context)')
    expect(generateReactivityRuntimeCode()).toContain('function computed(getter, context)')
    expect(generateMainRuntimeClassCode()).toContain('class Vue3MiniRuntime')
    expect(generateMainRuntimeClassCode()).toContain('static createRuntime(config)')
  })
})
