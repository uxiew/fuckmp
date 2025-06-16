/**
 * 真实项目编译测试 - 使用实际的测试项目
 */

import { describe, it, expect, beforeEach } from 'vitest'
import { Vue3MiniprogramCompiler } from '@/compiler/compiler.js'
import { PerformanceTest } from '../setup.js'
import { join } from 'path'

describe('真实项目编译测试', () => {
  let compiler: Vue3MiniprogramCompiler
  let performanceTest: PerformanceTest

  beforeEach(() => {
    compiler = new Vue3MiniprogramCompiler({
      input: join(process.cwd(), 'test-project'),
      output: join(process.cwd(), 'test-output'),
      appId: 'test-miniprogram',
      features: {
        scriptSetup: true,
        typescript: true,
        scss: true,
        compositionApi: true,
        emits: true,
        slots: true,
        provide: false
      },
      optimization: {
        minify: false,
        sourcemap: true,
        treeshaking: false,
        incremental: false
      }
    })
    performanceTest = new PerformanceTest()
  })

  describe('完整项目编译', () => {
    it('应该成功编译测试项目中的所有文件', async () => {
      console.log('🚀 开始编译测试项目...')
      
      // 执行完整项目编译
      performanceTest.start()
      const result = await compiler.compile()
      const duration = performanceTest.end('full-project-compile')

      console.log(`📊 编译结果: 成功 ${result.stats.success}/${result.stats.total} 个文件`)
      console.log(`⏱️  编译耗时: ${duration}ms`)

      // 验证编译结果
      expect(result.stats.total).toBeGreaterThan(0)
      expect(result.stats.success).toBe(result.stats.total)
      expect(result.stats.failed).toBe(0)
      
      if (result.errors.length > 0) {
        console.error('❌ 编译错误:', result.errors)
      }
      expect(result.errors).toHaveLength(0)

      // 验证生成的文件存在
      const { exists } = await import('@/utils/index.js')
      const outputDir = join(process.cwd(), 'test-output')
      
      console.log(`📁 检查输出目录: ${outputDir}`)

      // 验证应用文件
      expect(await exists(join(outputDir, 'app.js'))).toBe(true)
      expect(await exists(join(outputDir, 'app.json'))).toBe(true)
      expect(await exists(join(outputDir, 'app.wxss'))).toBe(true)

      // 验证页面文件
      const pages = ['index', 'profile', 'settings']
      for (const page of pages) {
        const pageDir = join(outputDir, 'pages', page)
        expect(await exists(join(pageDir, `${page}.js`))).toBe(true)
        expect(await exists(join(pageDir, `${page}.json`))).toBe(true)
        expect(await exists(join(pageDir, `${page}.wxml`))).toBe(true)
        expect(await exists(join(pageDir, `${page}.wxss`))).toBe(true)
        console.log(`✅ 页面 ${page} 编译成功`)
      }

      // 验证组件文件
      const components = ['UserCard']
      for (const component of components) {
        const componentDir = join(outputDir, 'components')
        expect(await exists(join(componentDir, `${component}.js`))).toBe(true)
        expect(await exists(join(componentDir, `${component}.json`))).toBe(true)
        expect(await exists(join(componentDir, `${component}.wxml`))).toBe(true)
        expect(await exists(join(componentDir, `${component}.wxss`))).toBe(true)
        console.log(`✅ 组件 ${component} 编译成功`)
      }

      // 性能验证
      expect(duration).toBeLessThan(15000) // 应该在 15 秒内完成

      console.log('🎉 所有文件编译成功！')
    })

    it('应该生成正确的应用配置', async () => {
      await compiler.compile()
      
      const { readFile } = await import('@/utils/index.js')
      const outputDir = join(process.cwd(), 'test-output')
      
      // 验证应用配置
      const appConfigContent = await readFile(join(outputDir, 'app.json'))
      const appConfig = JSON.parse(appConfigContent)
      
      expect(appConfig.pages).toContain('pages/index/index')
      expect(appConfig.pages).toContain('pages/profile/index')
      expect(appConfig.pages).toContain('pages/settings/index')
      expect(appConfig.window).toBeDefined()
      expect(appConfig.sitemapLocation).toBe('sitemap.json')
      
      console.log('✅ 应用配置生成正确')
    })

    it('应该正确转换 Vue3 语法', async () => {
      await compiler.compile()
      
      const { readFile } = await import('@/utils/index.js')
      const outputDir = join(process.cwd(), 'test-output')
      
      // 验证首页 JS 文件
      const indexJsContent = await readFile(join(outputDir, 'pages/index/index.js'))
      expect(indexJsContent).toContain('Page(')
      expect(indexJsContent).toContain('onLoad')
      expect(indexJsContent).toContain('onShow')
      expect(indexJsContent).toContain('data:')
      
      // 验证首页 WXML 文件
      const indexWxmlContent = await readFile(join(outputDir, 'pages/index/index.wxml'))
      expect(indexWxmlContent).toContain('{{title}}')
      expect(indexWxmlContent).toContain('wx:if')
      expect(indexWxmlContent).toContain('wx:for')
      expect(indexWxmlContent).toContain('bindtap')
      
      // 验证组件 JS 文件
      const userCardJsContent = await readFile(join(outputDir, 'components/UserCard.js'))
      expect(userCardJsContent).toContain('Component(')
      expect(userCardJsContent).toContain('properties:')
      expect(userCardJsContent).toContain('methods:')
      
      console.log('✅ Vue3 语法转换正确')
    })

    it('应该正确转换样式', async () => {
      await compiler.compile()
      
      const { readFile } = await import('@/utils/index.js')
      const outputDir = join(process.cwd(), 'test-output')
      
      // 验证首页样式文件
      const indexWxssContent = await readFile(join(outputDir, 'pages/index/index.wxss'))
      expect(indexWxssContent).toContain('.index-page')
      expect(indexWxssContent).toContain('rpx') // 单位转换
      expect(indexWxssContent).not.toContain('$') // SCSS 变量应该被处理
      expect(indexWxssContent).not.toContain('&') // SCSS 嵌套应该被展开
      
      console.log('✅ 样式转换正确')
    })
  })

  describe('性能测试', () => {
    it('编译性能应该在合理范围内', async () => {
      const iterations = 3
      const durations: number[] = []
      
      for (let i = 0; i < iterations; i++) {
        performanceTest.start()
        await compiler.compile()
        const duration = performanceTest.end(`compile-iteration-${i + 1}`)
        durations.push(duration)
        console.log(`第 ${i + 1} 次编译耗时: ${duration}ms`)
      }
      
      const averageDuration = durations.reduce((a, b) => a + b, 0) / durations.length
      const maxDuration = Math.max(...durations)
      const minDuration = Math.min(...durations)
      
      console.log(`平均编译时间: ${averageDuration.toFixed(2)}ms`)
      console.log(`最长编译时间: ${maxDuration}ms`)
      console.log(`最短编译时间: ${minDuration}ms`)
      
      // 性能要求
      expect(averageDuration).toBeLessThan(10000) // 平均不超过 10 秒
      expect(maxDuration).toBeLessThan(15000) // 最长不超过 15 秒
    })
  })

  describe('错误处理', () => {
    it('应该能处理编译错误并继续', async () => {
      // 创建一个有错误的编译器配置
      const errorCompiler = new Vue3MiniprogramCompiler({
        input: join(process.cwd(), 'non-existent-directory'),
        output: join(process.cwd(), 'test-output'),
        appId: 'test-app'
      })
      
      const result = await errorCompiler.compile()
      
      // 应该有错误但不会崩溃
      expect(result.stats.failed).toBeGreaterThan(0)
      expect(result.errors.length).toBeGreaterThan(0)
      
      console.log('✅ 错误处理正常')
    })
  })
})
