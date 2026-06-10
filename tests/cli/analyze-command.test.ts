import { afterEach, describe, expect, it, vi } from 'vitest'

const { scanVueFilesMock, loggerMock } = vi.hoisted(() => ({
  scanVueFilesMock: vi.fn(),
  loggerMock: {
    info: vi.fn(),
    error: vi.fn()
  }
}))

vi.mock('@/utils/index.js', () => ({
  scanVueFiles: scanVueFilesMock,
  logger: loggerMock
}))

describe('analyze command', () => {
  afterEach(() => {
    vi.restoreAllMocks()
    vi.clearAllMocks()
  })

  it('以文本格式输出项目文件统计和列表', async () => {
    scanVueFilesMock.mockResolvedValueOnce([
      'src/app.vue',
      'src/pages/home.vue',
      'src/components/UserCard.vue'
    ])
    const { createAnalyzeCommand } = await import('@/cli/commands/analyze.js')
    const command = createAnalyzeCommand()

    await command.parseAsync(['node', 'fuckmp', 'analyze', '--input', 'src'])

    expect(scanVueFilesMock).toHaveBeenCalledWith('src')
    expect(loggerMock.info).toHaveBeenCalledWith('分析项目结构...')
    expect(loggerMock.info).toHaveBeenCalledWith('\n项目分析结果:')
    expect(loggerMock.info).toHaveBeenCalledWith('📁 总文件数: 3')
    expect(loggerMock.info).toHaveBeenCalledWith('📄 页面数: 1')
    expect(loggerMock.info).toHaveBeenCalledWith('🧩 组件数: 1')
    expect(loggerMock.info).toHaveBeenCalledWith('\n文件列表:')
    expect(loggerMock.info).toHaveBeenCalledWith('  🧩 src/app.vue')
    expect(loggerMock.info).toHaveBeenCalledWith('  📄 src/pages/home.vue')
    expect(loggerMock.info).toHaveBeenCalledWith('  🧩 src/components/UserCard.vue')
  })

  it('以 JSON 格式输出项目分析结果', async () => {
    scanVueFilesMock.mockResolvedValueOnce([
      'src/pages/home.vue',
      'src/components/UserCard.vue'
    ])
    const log = vi.spyOn(console, 'log').mockImplementation(() => undefined)
    const { createAnalyzeCommand } = await import('@/cli/commands/analyze.js')
    const command = createAnalyzeCommand()

    await command.parseAsync([
      'node',
      'fuckmp',
      'analyze',
      '--input',
      'src',
      '--output-format',
      'json'
    ])

    expect(scanVueFilesMock).toHaveBeenCalledWith('src')
    expect(log).toHaveBeenCalledWith(JSON.stringify({
      totalFiles: 2,
      pages: 1,
      components: 1,
      files: [
        'src/pages/home.vue',
        'src/components/UserCard.vue'
      ]
    }, null, 2))
  })

  it('扫描失败时输出错误并退出', async () => {
    const scanError = new Error('scan failed')
    scanVueFilesMock.mockRejectedValueOnce(scanError)
    const exit = vi.spyOn(process, 'exit').mockImplementation((code?: string | number | null | undefined) => {
      throw new Error(`process.exit(${code})`)
    })
    const { createAnalyzeCommand } = await import('@/cli/commands/analyze.js')
    const command = createAnalyzeCommand()

    await expect(command.parseAsync(['node', 'fuckmp', 'analyze', '--input', 'missing']))
      .rejects.toThrow('process.exit(1)')

    expect(scanVueFilesMock).toHaveBeenCalledWith('missing')
    expect(loggerMock.error).toHaveBeenCalledWith('项目分析失败', scanError)
    expect(exit).toHaveBeenCalledWith(1)
  })
})
