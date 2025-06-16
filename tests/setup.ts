/**
 * 测试环境设置
 */

import { beforeAll, afterAll, beforeEach, afterEach } from 'vitest'
import { logger } from '@/utils/index.js'
import { promises as fs } from 'fs'
import { join } from 'path'

// 测试环境配置
beforeAll(async () => {
  // 设置测试日志级别
  logger.setLevel('error')
  
  // 创建测试临时目录
  await ensureTestDir()
})

afterAll(async () => {
  // 清理测试临时目录
  await cleanupTestDir()
})

beforeEach(() => {
  // 每个测试前的设置
})

afterEach(() => {
  // 每个测试后的清理
})

/**
 * 确保测试目录存在
 */
async function ensureTestDir(): Promise<void> {
  const testDir = getTestDir()
  try {
    await fs.access(testDir)
  } catch {
    await fs.mkdir(testDir, { recursive: true })
  }
}

/**
 * 清理测试目录
 */
async function cleanupTestDir(): Promise<void> {
  const testDir = getTestDir()
  try {
    await fs.rm(testDir, { recursive: true, force: true })
  } catch {
    // 忽略清理错误
  }
}

/**
 * 获取测试目录路径
 */
export function getTestDir(): string {
  return join(process.cwd(), 'tests', 'temp')
}

/**
 * 创建测试文件
 */
export async function createTestFile(filename: string, content: string): Promise<string> {
  const testDir = getTestDir()
  const filePath = join(testDir, filename)
  
  // 确保目录存在
  await fs.mkdir(join(filePath, '..'), { recursive: true })
  
  // 写入文件
  await fs.writeFile(filePath, content, 'utf-8')
  
  return filePath
}

/**
 * 读取测试文件
 */
export async function readTestFile(filename: string): Promise<string> {
  const testDir = getTestDir()
  const filePath = join(testDir, filename)
  return fs.readFile(filePath, 'utf-8')
}

/**
 * 删除测试文件
 */
export async function removeTestFile(filename: string): Promise<void> {
  const testDir = getTestDir()
  const filePath = join(testDir, filename)
  try {
    await fs.unlink(filePath)
  } catch {
    // 忽略删除错误
  }
}

/**
 * 创建测试 Vue 文件
 */
export function createTestVueFile(options: {
  template?: string
  script?: string
  style?: string
  lang?: string
  setup?: boolean
}): string {
  const {
    template = '<template><view>Test</view></template>',
    script = 'console.log("test")',
    style = '.test { color: red; }',
    lang = 'js',
    setup = false
  } = options

  const scriptTag = setup 
    ? `<script setup lang="${lang}">\n${script}\n</script>`
    : `<script lang="${lang}">\n${script}\n</script>`

  return `${template}

${scriptTag}

<style scoped>
${style}
</style>`
}

/**
 * 测试工具函数
 */
export const testUtils = {
  /**
   * 等待指定时间
   */
  wait: (ms: number) => new Promise(resolve => setTimeout(resolve, ms)),

  /**
   * 模拟异步操作
   */
  mockAsync: <T>(value: T, delay = 10): Promise<T> => {
    return new Promise(resolve => {
      setTimeout(() => resolve(value), delay)
    })
  },

  /**
   * 创建模拟函数
   */
  createMock: <T extends (...args: any[]) => any>(implementation?: T) => {
    const calls: Parameters<T>[] = []
    const mock = ((...args: Parameters<T>) => {
      calls.push(args)
      return implementation?.(...args)
    }) as T & { calls: Parameters<T>[] }
    
    mock.calls = calls
    return mock
  },

  /**
   * 断言错误
   */
  expectError: async (fn: () => Promise<any>, expectedMessage?: string) => {
    try {
      await fn()
      throw new Error('Expected function to throw an error')
    } catch (error) {
      if (expectedMessage && !(error as Error).message.includes(expectedMessage)) {
        throw new Error(`Expected error message to contain "${expectedMessage}", got "${(error as Error).message}"`)
      }
    }
  }
}

/**
 * 性能测试工具
 */
export class PerformanceTest {
  private startTime: number = 0
  private measurements: Map<string, number[]> = new Map()

  /**
   * 开始测量
   */
  start(): void {
    this.startTime = performance.now()
  }

  /**
   * 结束测量并记录
   */
  end(name: string): number {
    const duration = performance.now() - this.startTime
    
    if (!this.measurements.has(name)) {
      this.measurements.set(name, [])
    }
    
    this.measurements.get(name)!.push(duration)
    return duration
  }

  /**
   * 获取平均时间
   */
  getAverage(name: string): number {
    const times = this.measurements.get(name) || []
    return times.length > 0 ? times.reduce((a, b) => a + b, 0) / times.length : 0
  }

  /**
   * 获取最小时间
   */
  getMin(name: string): number {
    const times = this.measurements.get(name) || []
    return times.length > 0 ? Math.min(...times) : 0
  }

  /**
   * 获取最大时间
   */
  getMax(name: string): number {
    const times = this.measurements.get(name) || []
    return times.length > 0 ? Math.max(...times) : 0
  }

  /**
   * 清理测量数据
   */
  clear(): void {
    this.measurements.clear()
  }

  /**
   * 生成性能报告
   */
  generateReport(): string {
    const reports: string[] = ['性能测试报告:']
    
    this.measurements.forEach((times, name) => {
      const avg = this.getAverage(name)
      const min = this.getMin(name)
      const max = this.getMax(name)
      
      reports.push(`${name}:`)
      reports.push(`  平均: ${avg.toFixed(2)}ms`)
      reports.push(`  最小: ${min.toFixed(2)}ms`)
      reports.push(`  最大: ${max.toFixed(2)}ms`)
      reports.push(`  次数: ${times.length}`)
    })
    
    return reports.join('\n')
  }
}

/**
 * 内存使用监控
 */
export class MemoryMonitor {
  private baseline: NodeJS.MemoryUsage | null = null

  /**
   * 设置基线
   */
  setBaseline(): void {
    this.baseline = process.memoryUsage()
  }

  /**
   * 获取内存使用情况
   */
  getUsage(): NodeJS.MemoryUsage {
    return process.memoryUsage()
  }

  /**
   * 获取内存增长
   */
  getGrowth(): NodeJS.MemoryUsage | null {
    if (!this.baseline) return null
    
    const current = this.getUsage()
    return {
      rss: current.rss - this.baseline.rss,
      heapTotal: current.heapTotal - this.baseline.heapTotal,
      heapUsed: current.heapUsed - this.baseline.heapUsed,
      external: current.external - this.baseline.external,
      arrayBuffers: current.arrayBuffers - this.baseline.arrayBuffers
    }
  }

  /**
   * 格式化内存大小
   */
  formatBytes(bytes: number): string {
    const units = ['B', 'KB', 'MB', 'GB']
    let size = Math.abs(bytes)
    let unitIndex = 0

    while (size >= 1024 && unitIndex < units.length - 1) {
      size /= 1024
      unitIndex++
    }

    const sign = bytes < 0 ? '-' : ''
    return `${sign}${size.toFixed(1)} ${units[unitIndex]}`
  }

  /**
   * 生成内存报告
   */
  generateReport(): string {
    const usage = this.getUsage()
    const growth = this.getGrowth()
    
    const reports = [
      '内存使用报告:',
      `RSS: ${this.formatBytes(usage.rss)}`,
      `Heap Total: ${this.formatBytes(usage.heapTotal)}`,
      `Heap Used: ${this.formatBytes(usage.heapUsed)}`,
      `External: ${this.formatBytes(usage.external)}`
    ]
    
    if (growth) {
      reports.push('', '内存增长:')
      reports.push(`RSS: ${this.formatBytes(growth.rss)}`)
      reports.push(`Heap Total: ${this.formatBytes(growth.heapTotal)}`)
      reports.push(`Heap Used: ${this.formatBytes(growth.heapUsed)}`)
      reports.push(`External: ${this.formatBytes(growth.external)}`)
    }
    
    return reports.join('\n')
  }
}
