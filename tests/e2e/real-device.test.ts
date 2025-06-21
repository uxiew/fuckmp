/**
 * 真机测试用例
 * 使用 miniprogram-automator 在真实小程序环境中测试响应式变量
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import automator from 'miniprogram-automator'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

describe('真机测试 - 响应式变量', () => {
  let miniProgram: any
  let page: any

  beforeAll(async () => {
    try {
      // 启动小程序
      miniProgram = await automator.launch({
        cliPath: '/Applications/wechatwebdevtools.app/Contents/MacOS/cli', // 微信开发者工具 CLI 路径
        projectPath: path.resolve(__dirname, '../../test-output'), // 编译输出的小程序项目路径
        qr: false
      } as any)

      // 获取首页
      page = await miniProgram.reLaunch('/pages/index/index')
      await page.waitFor(1000) // 等待页面加载
    } catch (error: any) {
      console.warn('真机测试环境未配置，跳过测试:', error?.message || error)
      // 如果无法启动小程序，跳过所有测试
      return
    }
  }, 30000) // 30秒超时

  afterAll(async () => {
    if (miniProgram) {
      await miniProgram.close()
    }
  })

  it('应该在真机环境中正确更新响应式变量', async () => {
    if (!page) {
      console.warn('小程序未启动，跳过测试')
      return
    }

    try {
      // 获取初始访问次数
      const initialCount = await page.data('visitCount')
      expect(typeof initialCount).toBe('number')

      // 点击增加访问次数按钮
      const incrementButton = await page.$('.increment-btn')
      if (incrementButton) {
        await incrementButton.tap()
        await page.waitFor(500) // 等待界面更新

        // 验证访问次数增加
        const updatedCount = await page.data('visitCount')
        expect(updatedCount).toBe(initialCount + 1)

        // 验证界面显示更新
        const countText = await page.$('.visit-count')
        if (countText) {
          const text = await countText.text()
          expect(text).toContain(String(updatedCount))
        }
      }
    } catch (error) {
      console.error('真机测试执行失败:', error)
      throw error
    }
  })

  it('应该在真机环境中正确处理复杂响应式操作', async () => {
    if (!page) {
      console.warn('小程序未启动，跳过测试')
      return
    }

    try {
      // 测试多种响应式操作
      const operations = [
        { selector: '.increment-btn', operation: 'tap' },
        { selector: '.increment-btn', operation: 'tap' },
        { selector: '.increment-btn', operation: 'tap' }
      ]

      let expectedCount = await page.data('visitCount')

      for (const op of operations) {
        const element = await page.$(op.selector)
        if (element) {
          await element[op.operation]()
          await page.waitFor(300) // 等待界面更新
          expectedCount++

          // 验证数据更新
          const currentCount = await page.data('visitCount')
          expect(currentCount).toBe(expectedCount)
        }
      }
    } catch (error) {
      console.error('复杂响应式操作测试失败:', error)
      throw error
    }
  })

  it('应该在真机环境中正确处理组件响应式变量', async () => {
    if (!page) {
      console.warn('小程序未启动，跳过测试')
      return
    }

    try {
      // 导航到包含组件的页面
      await miniProgram.navigateTo('/pages/profile/index')
      await page.waitFor(1000)

      // 测试组件内的响应式变量
      const toggleButton = await page.$('.toggle-details-btn')
      if (toggleButton) {
        // 获取初始状态
        const initialShowDetails = await page.data('showDetails')

        // 点击切换按钮
        await toggleButton.tap()
        await page.waitFor(500)

        // 验证状态切换
        const updatedShowDetails = await page.data('showDetails')
        expect(updatedShowDetails).toBe(!initialShowDetails)

        // 验证界面更新
        const detailsSection = await page.$('.user-details')
        if (detailsSection) {
          const isVisible = await detailsSection.attribute('hidden')
          if (updatedShowDetails) {
            expect(isVisible).toBeFalsy()
          } else {
            expect(isVisible).toBeTruthy()
          }
        }
      }
    } catch (error) {
      console.error('组件响应式测试失败:', error)
      throw error
    }
  })

  it('应该在真机环境中正确处理计算属性', async () => {
    if (!page) {
      console.warn('小程序未启动，跳过测试')
      return
    }

    try {
      // 返回首页测试计算属性
      await miniProgram.reLaunch('/pages/index/index')
      await page.waitFor(1000)

      // 获取初始计算属性值
      const initialDoubleCount = await page.data('doubleCount')
      const initialVisitCount = await page.data('visitCount')

      expect(initialDoubleCount).toBe(initialVisitCount * 2)

      // 修改基础数据
      const incrementButton = await page.$('.increment-btn')
      if (incrementButton) {
        await incrementButton.tap()
        await page.waitFor(500)

        // 验证计算属性自动更新
        const updatedDoubleCount = await page.data('doubleCount')
        const updatedVisitCount = await page.data('visitCount')

        expect(updatedDoubleCount).toBe(updatedVisitCount * 2)
        expect(updatedVisitCount).toBe(initialVisitCount + 1)
      }
    } catch (error) {
      console.error('计算属性测试失败:', error)
      throw error
    }
  })

  it('应该在真机环境中正确处理性能压力测试', async () => {
    if (!page) {
      console.warn('小程序未启动，跳过测试')
      return
    }

    try {
      // 性能压力测试：快速连续操作
      const startTime = Date.now()
      const incrementButton = await page.$('.increment-btn')

      if (incrementButton) {
        const initialCount = await page.data('visitCount')
        const operationCount = 10

        // 快速连续点击
        for (let i = 0; i < operationCount; i++) {
          await incrementButton.tap()
          await page.waitFor(50) // 短暂等待
        }

        // 等待所有更新完成
        await page.waitFor(1000)

        // 验证最终结果
        const finalCount = await page.data('visitCount')
        expect(finalCount).toBe(initialCount + operationCount)

        const endTime = Date.now()
        const duration = endTime - startTime

        // 性能验证：10次操作应该在合理时间内完成
        expect(duration).toBeLessThan(5000) // 5秒内完成

        console.log(`性能测试完成: ${operationCount}次操作耗时 ${duration}ms`)
      }
    } catch (error) {
      console.error('性能压力测试失败:', error)
      throw error
    }
  })
})
