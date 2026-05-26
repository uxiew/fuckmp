import { afterEach, describe, expect, it, vi } from 'vitest'

const { existsMock, removeMock, loggerMock } = vi.hoisted(() => ({
  existsMock: vi.fn(),
  removeMock: vi.fn(),
  loggerMock: {
    info: vi.fn(),
    success: vi.fn(),
    error: vi.fn()
  }
}))

vi.mock('@/utils/index.js', () => ({
  exists: existsMock,
  remove: removeMock,
  logger: loggerMock
}))

describe('clean command', () => {
  afterEach(() => {
    vi.restoreAllMocks()
    vi.clearAllMocks()
  })

  it('输出目录存在时删除目录并提示完成', async () => {
    existsMock.mockResolvedValueOnce(true)
    removeMock.mockResolvedValueOnce(undefined)
    const { createCleanCommand } = await import('@/cli/commands/clean.js')
    const command = createCleanCommand()

    await command.parseAsync(['node', 'fuckmp', 'clean', '--output', 'dist/miniprogram'])

    expect(loggerMock.info).toHaveBeenCalledWith('清理输出目录: dist/miniprogram')
    expect(existsMock).toHaveBeenCalledWith('dist/miniprogram')
    expect(removeMock).toHaveBeenCalledWith('dist/miniprogram')
    expect(loggerMock.success).toHaveBeenCalledWith('输出目录清理完成')
  })

  it('输出目录不存在时跳过删除', async () => {
    existsMock.mockResolvedValueOnce(false)
    const { createCleanCommand } = await import('@/cli/commands/clean.js')
    const command = createCleanCommand()

    await command.parseAsync(['node', 'fuckmp', 'clean'])

    expect(loggerMock.info).toHaveBeenCalledWith('清理输出目录: dist')
    expect(existsMock).toHaveBeenCalledWith('dist')
    expect(removeMock).not.toHaveBeenCalled()
    expect(loggerMock.info).toHaveBeenCalledWith('输出目录不存在，无需清理')
  })

  it('删除失败时输出错误并退出', async () => {
    const removeError = new Error('permission denied')
    existsMock.mockResolvedValueOnce(true)
    removeMock.mockRejectedValueOnce(removeError)
    const exit = vi.spyOn(process, 'exit').mockImplementation((code?: string | number | null | undefined) => {
      throw new Error(`process.exit(${code})`)
    })
    const { createCleanCommand } = await import('@/cli/commands/clean.js')
    const command = createCleanCommand()

    await expect(command.parseAsync(['node', 'fuckmp', 'clean', '--output', 'dist']))
      .rejects.toThrow('process.exit(1)')

    expect(loggerMock.error).toHaveBeenCalledWith('清理失败', removeError)
    expect(exit).toHaveBeenCalledWith(1)
  })
})
