/**
 * 运行时注入功能测试
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { RuntimeInjector, Vue3FeatureUsage } from '@/compiler/runtime-injector'
import { RuntimeBundler } from '@/compiler/runtime-bundler'
import { CodeGenerator } from '@/compiler/code-generator'
import { CompilerOptions } from '@/types/compiler'
import { logger } from '@/utils/logger'
import fs from 'fs/promises'
import path from 'path'

describe('运行时注入功能', () => {
  let runtimeInjector: RuntimeInjector
  let tempDir: string

  beforeEach(async () => {
    // 创建临时目录
    tempDir = path.join(__dirname, 'temp', `test-${Date.now()}`)
    await fs.mkdir(tempDir, { recursive: true })

    // 创建编译器选项
    const options: CompilerOptions = {
      input: './src',
      output: tempDir,
      mode: 'development',
      target: 'wechat',
      features: {
        typescript: true,
        scss: true,
        pinia: false,
        vueRouter: false
      },
      optimization: {
        minify: false,
        sourcemap: true,
        treeshaking: true
      }
    }

    runtimeInjector = new RuntimeInjector(options)
  })

  afterEach(async () => {
    // 清理临时目录
    try {
      await fs.rm(tempDir, { recursive: true, force: true })
    } catch (error) {
      // 忽略清理错误
    }
  })

  describe('特性使用情况分析', () => {
    it('应该正确分析响应式API使用情况', () => {
      const sourceFiles = new Map([
        ['test.vue', `
          <script setup>
          import { ref, reactive, computed } from 'vue'
          const count = ref(0)
          const state = reactive({ name: 'test' })
          const doubled = computed(() => count.value * 2)
          </script>
        `]
      ])

      const usage = runtimeInjector.analyzeFeatureUsage(sourceFiles)

      expect(usage.reactivity.ref).toBe(true)
      expect(usage.reactivity.reactive).toBe(true)
      expect(usage.reactivity.computed).toBe(true)
      expect(usage.composition.setup).toBe(true)
    })

    it('应该正确分析模板指令使用情况', () => {
      const sourceFiles = new Map([
        ['test.vue', `
          <template>
            <div v-if="show" v-for="item in items" :key="item.id">
              <input v-model="value" @click="handleClick" />
            </div>
          </template>
        `]
      ])

      const usage = runtimeInjector.analyzeFeatureUsage(sourceFiles)

      expect(usage.directives.vIf).toBe(true)
      expect(usage.directives.vFor).toBe(true)
      expect(usage.directives.vModel).toBe(true)
      expect(usage.directives.vOn).toBe(true)
      expect(usage.directives.vBind).toBe(true)
    })

    it('应该正确分析生命周期钩子使用情况', () => {
      const sourceFiles = new Map([
        ['test.vue', `
          <script setup>
          import { onMounted, onUnmounted } from 'vue'
          onMounted(() => {
            console.log('mounted')
          })
          onUnmounted(() => {
            console.log('unmounted')
          })
          </script>
        `]
      ])

      const usage = runtimeInjector.analyzeFeatureUsage(sourceFiles)

      expect(usage.lifecycle.onMounted).toBe(true)
      expect(usage.lifecycle.onUnmounted).toBe(true)
      expect(usage.composition.setup).toBe(true)
    })

    it('应该正确分析依赖注入使用情况', () => {
      const sourceFiles = new Map([
        ['test.vue', `
          <script setup>
          import { provide, inject } from 'vue'
          provide('key', 'value')
          const injected = inject('key')
          </script>
        `]
      ])

      const usage = runtimeInjector.analyzeFeatureUsage(sourceFiles)

      expect(usage.composition.provide).toBe(true)
      expect(usage.composition.inject).toBe(true)
    })
  })

  describe('运行时打包器', () => {
    it('应该根据特性使用情况确定需要的模块', () => {
      const bundler = new RuntimeBundler(runtimeInjector.getConfig())
      
      const featureUsage: Vue3FeatureUsage = {
        reactivity: { ref: true, reactive: false, computed: false, watch: false, watchEffect: false },
        composition: { setup: true, defineProps: false, defineEmits: false, defineExpose: false, provide: false, inject: false },
        directives: { vIf: true, vFor: false, vModel: false, vShow: false, vOn: false, vBind: false },
        lifecycle: { onMounted: false, onUnmounted: false, onUpdated: false, onBeforeMount: false, onBeforeUnmount: false, onBeforeUpdate: false },
        advanced: { slots: false, teleport: false, suspense: false, keepAlive: false, transition: false }
      }

      const requiredModules = bundler.getRequiredModules(featureUsage)

      expect(requiredModules).toContain('core')
      expect(requiredModules).toContain('reactivity')
      expect(requiredModules).toContain('template') // v-if 需要模板引擎
    })

    it('应该正确解析模块依赖关系', () => {
      const bundler = new RuntimeBundler(runtimeInjector.getConfig())
      
      const featureUsage: Vue3FeatureUsage = {
        reactivity: { ref: false, reactive: false, computed: false, watch: false, watchEffect: false },
        composition: { setup: false, defineProps: false, defineEmits: false, defineExpose: false, provide: true, inject: true },
        directives: { vIf: false, vFor: false, vModel: false, vShow: false, vOn: false, vBind: false },
        lifecycle: { onMounted: false, onUnmounted: false, onUpdated: false, onBeforeMount: false, onBeforeUnmount: false, onBeforeUpdate: false },
        advanced: { slots: false, teleport: false, suspense: false, keepAlive: false, transition: false }
      }

      const requiredModules = bundler.getRequiredModules(featureUsage)

      expect(requiredModules).toContain('core')
      expect(requiredModules).toContain('di') // provide/inject 需要依赖注入模块
      expect(requiredModules).toContain('reactivity') // di 模块依赖 reactivity
    })
  })

  describe('代码生成器', () => {
    it('应该生成正确的运行时注入代码', () => {
      const generator = new CodeGenerator(runtimeInjector.getConfig())
      
      const bundleResult = {
        code: '// 运行时库代码',
        modules: ['core', 'reactivity'],
        totalSize: 1024,
        minifiedSize: 512
      }

      const featureUsage: Vue3FeatureUsage = {
        reactivity: { ref: true, reactive: false, computed: false, watch: false, watchEffect: false },
        composition: { setup: true, defineProps: false, defineEmits: false, defineExpose: false, provide: false, inject: false },
        directives: { vIf: false, vFor: false, vModel: false, vShow: false, vOn: false, vBind: false },
        lifecycle: { onMounted: false, onUnmounted: false, onUpdated: false, onBeforeMount: false, onBeforeUnmount: false, onBeforeUpdate: false },
        advanced: { slots: false, teleport: false, suspense: false, keepAlive: false, transition: false }
      }

      const injectionFile = generator.generateRuntimeInjection(bundleResult, featureUsage)

      expect(injectionFile.path).toBe('runtime-injection.js')
      expect(injectionFile.type).toBe('js')
      expect(injectionFile.isRuntime).toBe(true)
      expect(injectionFile.content).toContain('initVue3Runtime')
      expect(injectionFile.content).toContain('createPage')
      expect(injectionFile.content).toContain('createComponent')
    })

    it('应该生成正确的页面代码', () => {
      const generator = new CodeGenerator(runtimeInjector.getConfig())
      
      const pageConfig = {
        navigationBarTitleText: '测试页面',
        usingComponents: {}
      }

      const pageFile = generator.generatePageCode(pageConfig, 'pages/index/index')

      expect(pageFile.path).toBe('pages/index/index.js')
      expect(pageFile.type).toBe('js')
      expect(pageFile.isRuntime).toBe(false)
      expect(pageFile.content).toContain('createPage')
      expect(pageFile.content).toContain('navigationBarTitleText')
    })
  })

  describe('完整注入流程', () => {
    it('应该成功执行完整的运行时注入流程', async () => {
      const sourceFiles = new Map([
        ['pages/index.vue', `
          <template>
            <div>{{ message }}</div>
          </template>
          <script setup>
          import { ref } from 'vue'
          const message = ref('Hello World')
          </script>
        `]
      ])

      const appConfig = {
        pages: ['pages/index/index']
      }

      const pages = new Map([
        ['pages/index/index', { navigationBarTitleText: '首页' }]
      ])

      const components = new Map()

      await runtimeInjector.injectRuntime(
        sourceFiles,
        tempDir,
        appConfig,
        pages,
        components
      )

      // 验证生成的文件
      const runtimeFile = path.join(tempDir, 'runtime-injection.js')
      const appFile = path.join(tempDir, 'app.js')
      const configFile = path.join(tempDir, 'runtime-config.json')

      expect(await fs.access(runtimeFile).then(() => true).catch(() => false)).toBe(true)
      expect(await fs.access(appFile).then(() => true).catch(() => false)).toBe(true)
      expect(await fs.access(configFile).then(() => true).catch(() => false)).toBe(true)

      // 验证运行时配置
      const configContent = await fs.readFile(configFile, 'utf-8')
      const config = JSON.parse(configContent)
      
      expect(config.features.reactivity.ref).toBe(true)
      expect(config.features.composition.setup).toBe(true)
    }, 10000) // 增加超时时间
  })

  describe('性能测试', () => {
    it('应该在合理时间内完成特性分析', () => {
      const largeSourceFiles = new Map()
      
      // 创建大量源文件
      for (let i = 0; i < 100; i++) {
        largeSourceFiles.set(`file${i}.vue`, `
          <template>
            <div v-if="show" v-for="item in items" :key="item.id">
              {{ item.name }}
            </div>
          </template>
          <script setup>
          import { ref, reactive, computed, onMounted } from 'vue'
          const show = ref(true)
          const items = reactive([])
          const count = computed(() => items.length)
          onMounted(() => {
            console.log('mounted')
          })
          </script>
        `)
      }

      const startTime = Date.now()
      const usage = runtimeInjector.analyzeFeatureUsage(largeSourceFiles)
      const duration = Date.now() - startTime

      expect(duration).toBeLessThan(1000) // 应该在1秒内完成
      expect(usage.reactivity.ref).toBe(true)
      expect(usage.directives.vIf).toBe(true)
    })
  })
})
