import { describe, expect, it } from 'vitest'
import type { CompilerOptions, TransformContext } from '@/types/index.js'
import {
  CachePlugin,
  CodeQualityPlugin,
  PerformancePlugin,
  createBuiltinPlugins
} from '@/plugins/plugin-system-builtins.js'
import {
  CachePlugin as LegacyCachePlugin,
  CodeQualityPlugin as LegacyCodeQualityPlugin,
  PerformancePlugin as LegacyPerformancePlugin,
  createDefaultPluginManager
} from '@/plugins/plugin-system.js'

function createContext(filename = 'src/page.vue'): TransformContext {
  return {
    filename,
    isPage: true,
    hasScoped: false,
    props: {},
    emits: [],
    expose: {},
    data: {},
    methods: {},
    computed: {},
    watch: {},
    lifecycle: {},
    imports: new Set(),
    components: new Map()
  }
}

function createOptions(): CompilerOptions {
  return {
    input: 'src',
    output: 'dist',
    mode: 'development',
    appId: 'test-appid',
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
      sourcemap: false,
      incremental: false
    },
    injection: {
      pureMode: false,
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
        extraHelpers: false
      }
    }
  }
}

describe('plugin system builtins', () => {
  it('创建默认内置插件列表并保持旧入口导出兼容', () => {
    const plugins = createBuiltinPlugins()
    const nextPlugins = createBuiltinPlugins()

    expect(plugins.map(plugin => plugin.name)).toEqual(['performance', 'code-quality', 'cache'])
    expect(plugins[0]).toBeInstanceOf(PerformancePlugin)
    expect(plugins[1]).toBeInstanceOf(CodeQualityPlugin)
    expect(plugins[2]).toBeInstanceOf(CachePlugin)
    expect(nextPlugins[0]).not.toBe(plugins[0])

    expect(LegacyPerformancePlugin).toBe(PerformancePlugin)
    expect(LegacyCodeQualityPlugin).toBe(CodeQualityPlugin)
    expect(LegacyCachePlugin).toBe(CachePlugin)

    const manager = createDefaultPluginManager()
    expect(manager.getAll().map(plugin => plugin.name)).toEqual(['performance', 'code-quality', 'cache'])
  })

  it('PerformancePlugin 记录编译耗时并返回旧指标摘要', async () => {
    const plugin = new PerformancePlugin()
    const context = createContext('src/perf.vue')
    const originalNow = Date.now

    try {
      Date.now = () => 100
      await plugin.beforeCompile(context)
      Date.now = () => 125
      await plugin.afterCompile(context, {})
    } finally {
      Date.now = originalNow
    }

    expect(plugin.getMetrics()).toEqual({
      totalFiles: 1,
      averageTime: 25,
      maxTime: 25,
      minTime: 25
    })

    plugin.cleanup()
    expect(plugin.getMetrics()).toEqual({
      totalFiles: 0,
      averageTime: 0,
      maxTime: 0,
      minTime: 0
    })
  })

  it('CodeQualityPlugin 和 CachePlugin 保持 transform/cache 钩子外部语义', async () => {
    const qualityPlugin = new CodeQualityPlugin()
    const cachePlugin = new CachePlugin()
    const context = createContext('src/cache.vue')

    await expect(qualityPlugin.transformFile('src/cache.vue', 'console.log("debug")')).resolves.toBe('console.log("debug")')

    await cachePlugin.beforeCompile(context)
    await cachePlugin.afterCompile(context, { js: 'Page({})' })
    await cachePlugin.beforeCompile(context)

    expect(qualityPlugin.name).toBe('code-quality')
    expect(cachePlugin.name).toBe('cache')
    expect(cachePlugin.version).toBe('1.0.0')
    expect(typeof cachePlugin.cleanup).toBe('function')

    await qualityPlugin.cleanup?.()
    await cachePlugin.cleanup?.()

    const plugins = createBuiltinPlugins()
    for (const plugin of plugins) {
      await plugin.setup?.(createOptions())
      await plugin.cleanup?.()
    }
  })
})
