import { describe, expect, it } from 'vitest'
import { RuntimeInjectionGenerator } from '@/compiler/codegen/runtime-injection-generator'
import type { BundleResult } from '@/compiler/runtime-bundler'
import type { RuntimeInjectionConfig, Vue3FeatureUsage } from '@/compiler/runtime-injector'

const baseConfig: RuntimeInjectionConfig = {
  enableRuntime: true,
  runtimePath: './runtime/index.js',
  autoInject: true,
  runtimeConfig: {
    debug: true,
    performance: false
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
  code: '// bundled runtime placeholder',
  modules: ['core', 'reactivity'],
  totalSize: 100,
  minifiedSize: 80
}

function createUsage(overrides: Partial<Vue3FeatureUsage> = {}): Vue3FeatureUsage {
  return {
    reactivity: {
      ref: false,
      reactive: false,
      computed: false,
      watch: false,
      watchEffect: false,
      ...overrides.reactivity
    },
    composition: {
      setup: false,
      defineProps: false,
      defineEmits: false,
      defineExpose: false,
      provide: false,
      inject: false,
      ...overrides.composition
    },
    directives: {
      vIf: false,
      vFor: false,
      vModel: false,
      vShow: false,
      vOn: false,
      vBind: false,
      ...overrides.directives
    },
    lifecycle: {
      onMounted: false,
      onUnmounted: false,
      onUpdated: false,
      onBeforeMount: false,
      onBeforeUnmount: false,
      onBeforeUpdate: false,
      ...overrides.lifecycle
    },
    advanced: {
      slots: false,
      teleport: false,
      suspense: false,
      keepAlive: false,
      transition: false,
      ...overrides.advanced
    }
  }
}

describe('RuntimeInjectionGenerator', () => {
  it('生成带固定文件头、运行时配置和注入 API 的 runtime-injection 内容', () => {
    const generator = new RuntimeInjectionGenerator(baseConfig)
    const content = generator.generateRuntimeInjectionCode(
      bundleResult,
      createUsage({ reactivity: { ref: true } }),
      '// fixed header'
    )

    expect(content).toContain('// fixed header')
    expect(content).toContain('const RUNTIME_CONFIG = {')
    expect(content).toContain('"version": "test-runtime"')
    expect(content).toContain('"modules": [')
    expect(content).toContain('function initVue3Runtime(customConfig = {})')
    expect(content).toContain('function createPage(pageConfig)')
    expect(content).toContain('function createComponent(componentConfig)')
    expect(content).toContain('module.exports = {')
  })

  it('只有使用已实现的响应式 API 时才生成响应式 runtime 模块', () => {
    const generator = new RuntimeInjectionGenerator(baseConfig)
    const plainContent = generator.generateRuntimeInjectionCode(
      bundleResult,
      createUsage(),
      '// fixed header'
    )
    const setupOnlyContent = generator.generateRuntimeInjectionCode(
      bundleResult,
      createUsage({ composition: { setup: true } }),
      '// fixed header'
    )
    const reactiveContent = generator.generateRuntimeInjectionCode(
      bundleResult,
      createUsage({ reactivity: { ref: true } }),
      '// fixed header'
    )

    expect(plainContent).not.toContain('function ref(value, context)')
    expect(setupOnlyContent).not.toContain('function ref(value, context)')
    expect(setupOnlyContent).not.toContain('function reactive(obj, context)')
    expect(setupOnlyContent).not.toContain('function computed(getter, context)')
    expect(reactiveContent).toContain('function ref(value, context)')
    expect(reactiveContent).toContain('function reactive(obj, context)')
    expect(reactiveContent).toContain('function computed(getter, context)')
  })
})
