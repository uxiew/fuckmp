/**
 * 运行时集成纯字符串与配置 helper。
 */

import type { CompilerOptions } from '@/types/index.js'
import type { RuntimeIntegrationConfig } from './runtime-integration.js'

/** 创建运行时集成默认配置。 */
export function createDefaultRuntimeIntegrationConfig(compilerOptions: CompilerOptions): RuntimeIntegrationConfig {
  return {
    enableRuntime: true,
    runtimePath: './runtime/index.js',
    autoInject: true,
    runtimeConfig: {
      debug: compilerOptions.mode === 'development',
      performance: false
    },
    plugins: {
      enableAll: true,
      include: [],
      exclude: []
    }
  }
}

/** 生成运行时注入入口代码。 */
export function generateRuntimeInjectionCode(config: RuntimeIntegrationConfig): string {
  if (!config.enableRuntime) {
    return ''
  }

  const runtimeConfig = JSON.stringify(config.runtimeConfig, null, 2)

  return `
// Vue3 小程序运行时库自动注入
const { initVue3Runtime, definePage, defineComponent } = require('${config.runtimePath}')

// 初始化运行时
const runtimeConfig = ${runtimeConfig}
let runtimeInstance = null

// 运行时初始化函数
async function initRuntime() {
  if (!runtimeInstance) {
    try {
      runtimeInstance = await initVue3Runtime(runtimeConfig)
      console.log('Vue3 小程序运行时初始化成功')
    } catch (error) {
      console.error('Vue3 小程序运行时初始化失败:', error)
    }
  }
  return runtimeInstance
}

// 页面创建包装器
function createPage(config) {
  return definePage(config)
}

// 组件创建包装器
function createComponent(config) {
  return defineComponent(config)
}

// 导出运行时API
module.exports = {
  initRuntime,
  createPage,
  createComponent,
  runtime: runtimeInstance
}
`
}

/** 生成页面运行时代码。 */
export function generatePageRuntimeCode(config: RuntimeIntegrationConfig, pageConfig: any): string {
  if (!config.enableRuntime) {
    return generateLegacyPageCode(pageConfig)
  }

  return `
// 引入运行时
const { createPage } = require('./runtime-injection.js')

// 页面配置
const pageConfig = ${JSON.stringify(pageConfig, null, 2)}

// 创建页面
Page(createPage(pageConfig))
`
}

/** 生成组件运行时代码。 */
export function generateComponentRuntimeCode(config: RuntimeIntegrationConfig, componentConfig: any): string {
  if (!config.enableRuntime) {
    return generateLegacyComponentCode(componentConfig)
  }

  return `
// 引入运行时
const { createComponent } = require('./runtime-injection.js')

// 组件配置
const componentConfig = ${JSON.stringify(componentConfig, null, 2)}

// 创建组件
Component(createComponent(componentConfig))
`
}

/** 生成 App 运行时代码。 */
export function generateAppRuntimeCode(config: RuntimeIntegrationConfig, appConfig: any): string {
  if (!config.enableRuntime) {
    return generateLegacyAppCode(appConfig)
  }

  return `
// 引入运行时
const { initRuntime } = require('./runtime-injection.js')

// 应用配置
const appConfig = ${JSON.stringify(appConfig, null, 2)}

// 应用入口
App({
  ...appConfig,

  async onLaunch(options) {
    // 初始化运行时
    await initRuntime()

    // 调用原始的onLaunch
    if (appConfig.onLaunch) {
      appConfig.onLaunch.call(this, options)
    }
  }
})
`
}

/** 简易 TypeScript 到 JavaScript 转换，保留旧正则级转换语义。 */
export function transpileRuntimeTypeScript(content: string): string {
  return content
    .replace(/import\s+.*?\s+from\s+['"](.+?)['"];?/g, "const $1 = require('$1');")
    .replace(/export\s+\{([^}]+)\}/g, 'module.exports = { $1 }')
    .replace(/export\s+default\s+/g, 'module.exports = ')
    .replace(/export\s+/g, 'module.exports.')
    .replace(/:\s*[A-Za-z<>[\]|&\s]+(?=\s*[=,)])/g, '')
    .replace(/interface\s+\w+\s*\{[^}]*\}/g, '')
    .replace(/type\s+\w+\s*=\s*[^;]+;/g, '')
}

function generateLegacyPageCode(pageConfig: any): string {
  return `Page(${JSON.stringify(pageConfig, null, 2)})`
}

function generateLegacyComponentCode(componentConfig: any): string {
  return `Component(${JSON.stringify(componentConfig, null, 2)})`
}

function generateLegacyAppCode(appConfig: any): string {
  return `App(${JSON.stringify(appConfig, null, 2)})`
}
