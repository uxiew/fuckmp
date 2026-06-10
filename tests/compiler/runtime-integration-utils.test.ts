import { describe, expect, it } from 'vitest'
import {
  createDefaultRuntimeIntegrationConfig,
  generateAppRuntimeCode,
  generateComponentRuntimeCode,
  generatePageRuntimeCode,
  generateRuntimeInjectionCode,
  transpileRuntimeTypeScript
} from '@/compiler/runtime-integration-utils.js'
import type { CompilerOptions } from '@/types/index.js'
import type { RuntimeIntegrationConfig } from '@/compiler/runtime-integration.js'

const compilerOptions = {
  mode: 'development'
} as CompilerOptions

const enabledConfig: RuntimeIntegrationConfig = {
  enableRuntime: true,
  runtimePath: './runtime/index.js',
  autoInject: true,
  runtimeConfig: {
    debug: true,
    performance: false
  },
  plugins: {
    enableAll: true,
    include: [],
    exclude: []
  }
}

const disabledConfig: RuntimeIntegrationConfig = {
  ...enabledConfig,
  enableRuntime: false
}

describe('runtime integration utils', () => {
  it('根据编译模式生成默认运行时集成配置', () => {
    expect(createDefaultRuntimeIntegrationConfig(compilerOptions)).toEqual(enabledConfig)
    expect(createDefaultRuntimeIntegrationConfig({ ...compilerOptions, mode: 'production' })).toEqual({
      ...enabledConfig,
      runtimeConfig: {
        debug: false,
        performance: false
      }
    })
  })

  it('生成稳定的运行时注入入口代码', () => {
    const code = generateRuntimeInjectionCode(enabledConfig)

    expect(generateRuntimeInjectionCode(disabledConfig)).toBe('')
    expect(code).toContain("const { initVue3Runtime, definePage, defineComponent } = require('./runtime/index.js')")
    expect(code).toContain('const runtimeConfig = {\n  "debug": true,\n  "performance": false\n}')
    expect(code).toContain('async function initRuntime()')
    expect(code).toContain('function createPage(config)')
    expect(code).toContain('function createComponent(config)')
    expect(code).toContain('runtime: runtimeInstance')
  })

  it('按 runtime 开关生成页面、组件和 app 包装代码', () => {
    const pageConfig = { data: { count: 1 } }
    const componentConfig = { properties: { title: String } }
    const appConfig = { window: { navigationBarTitleText: 'Demo' } }

    expect(generatePageRuntimeCode(disabledConfig, pageConfig)).toBe(`Page(${JSON.stringify(pageConfig, null, 2)})`)
    expect(generateComponentRuntimeCode(disabledConfig, componentConfig)).toBe(`Component(${JSON.stringify(componentConfig, null, 2)})`)
    expect(generateAppRuntimeCode(disabledConfig, appConfig)).toBe(`App(${JSON.stringify(appConfig, null, 2)})`)

    expect(generatePageRuntimeCode(enabledConfig, pageConfig)).toContain("const { createPage } = require('./runtime-injection.js')")
    expect(generatePageRuntimeCode(enabledConfig, pageConfig)).toContain('Page(createPage(pageConfig))')
    expect(generateComponentRuntimeCode(enabledConfig, componentConfig)).toContain('Component(createComponent(componentConfig))')
    expect(generateAppRuntimeCode(enabledConfig, appConfig)).toContain('await initRuntime()')
    expect(generateAppRuntimeCode(enabledConfig, appConfig)).toContain('appConfig.onLaunch.call(this, options)')
  })

  it('保留旧的正则级 TypeScript 转换行为', () => {
    const source = `import { foo } from './foo';\nexport default class Demo {}\nexport interface Props { title: string }\nconst count: number = 1\nfunction inc(step: number) { return step }`

    expect(transpileRuntimeTypeScript(source)).toBe(`const ./foo = require('./foo');\nmodule.exports = class Demo {}\nmodule.exports.\nconst count= 1\nfunction inc(step) { return step }`)
  })
})
