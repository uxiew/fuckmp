import { describe, expect, it, beforeEach, vi } from 'vitest'
import {
  createCompilerWatchHandlers,
  createVueFileWatchOptions,
  createVueFileWatchPattern,
  type CompilerWatchHost
} from '@/compiler/compiler-watch-utils.js'

const loggerMock = vi.hoisted(() => ({
  info: vi.fn(),
  success: vi.fn(),
  error: vi.fn()
}))

vi.mock('@/utils/index.js', () => ({
  logger: loggerMock
}))

describe('compiler watch utils', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('构造与旧 watch 逻辑一致的 Vue 文件监听配置', () => {
    expect(createVueFileWatchPattern('/project/src')).toBe('/project/src/**/*.vue')

    const options = createVueFileWatchOptions()
    expect(options.persistent).toBe(true)
    expect(options.ignored.test('/project/node_modules/pkg/index.vue')).toBe(true)
    expect(options.ignored.test('/project/src/pages/index.vue')).toBe(false)
  })

  it('change 事件先编译文件，成功后刷新项目级输出', async () => {
    const calls: string[] = []
    const host = createHost(calls)
    const handlers = createCompilerWatchHandlers(host)

    await handlers.change('pages/index.vue')

    expect(calls).toEqual(['compile:pages/index.vue', 'refresh'])
    expect(loggerMock.info).toHaveBeenCalledWith('文件变更: pages/index.vue')
    expect(loggerMock.success).toHaveBeenCalledWith('文件重新编译完成: pages/index.vue')
  })

  it('add 事件复用新增文件成功日志并刷新项目级输出', async () => {
    const calls: string[] = []
    const host = createHost(calls)
    const handlers = createCompilerWatchHandlers(host)

    await handlers.add('components/card.vue')

    expect(calls).toEqual(['compile:components/card.vue', 'refresh'])
    expect(loggerMock.info).toHaveBeenCalledWith('新增文件: components/card.vue')
    expect(loggerMock.success).toHaveBeenCalledWith('新文件编译完成: components/card.vue')
  })

  it('unlink 事件委托 removeSourceFile，避免重复刷新项目级输出', async () => {
    const calls: string[] = []
    const host = createHost(calls, ['pages/index.js', 'pages/index.wxml'])
    const handlers = createCompilerWatchHandlers(host)

    await handlers.unlink('pages/index.vue')

    expect(calls).toEqual(['remove:pages/index.vue'])
    expect(loggerMock.info).toHaveBeenCalledWith('删除文件: pages/index.vue')
    expect(loggerMock.success).toHaveBeenCalledWith('已清理输出产物: 2 个')
  })

  it('事件处理失败时记录错误且不向 watcher 抛出异常', async () => {
    const error = new Error('compile failed')
    const host: CompilerWatchHost = {
      compileFile: vi.fn(async () => {
        throw error
      }),
      refreshProjectOutputs: vi.fn(),
      removeSourceFile: vi.fn(async () => [])
    }
    const handlers = createCompilerWatchHandlers(host)

    await expect(handlers.change('broken.vue')).resolves.toBeUndefined()

    expect(host.refreshProjectOutputs).not.toHaveBeenCalled()
    expect(loggerMock.error).toHaveBeenCalledWith('文件重新编译失败: broken.vue', error)
  })
})

function createHost(calls: string[], removedFiles: string[] = []): CompilerWatchHost {
  return {
    compileFile: vi.fn(async (filePath: string) => {
      calls.push(`compile:${filePath}`)
    }),
    refreshProjectOutputs: vi.fn(async () => {
      calls.push('refresh')
    }),
    removeSourceFile: vi.fn(async (filePath: string) => {
      calls.push(`remove:${filePath}`)
      return removedFiles
    })
  }
}
