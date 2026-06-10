import { afterEach, describe, expect, it, vi } from 'vitest'

const { configManagerConstructor, configManagerFromFile, loggerMock } = vi.hoisted(() => ({
  configManagerConstructor: vi.fn(),
  configManagerFromFile: vi.fn(),
  loggerMock: {
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
    success: vi.fn()
  }
}))

vi.mock('@/compiler/index.js', () => ({
  ConfigManager: Object.assign(configManagerConstructor, {
    fromFile: configManagerFromFile
  })
}))

vi.mock('@/utils/index.js', () => ({
  logger: loggerMock
}))

describe('config command', () => {
  afterEach(() => {
    vi.restoreAllMocks()
    vi.clearAllMocks()
  })

  it('初始化默认配置文件', async () => {
    const saveToFile = vi.fn(async () => undefined)
    configManagerConstructor.mockImplementationOnce(() => ({ saveToFile }))
    const { createConfigCommand } = await import('@/cli/commands/config.js')
    const command = createConfigCommand()

    await command.parseAsync(['node', 'fuckmp', 'config', '--init'])

    expect(configManagerConstructor).toHaveBeenCalledTimes(1)
    expect(saveToFile).toHaveBeenCalledWith('vue3mp.config.js')
    expect(loggerMock.success).toHaveBeenCalledWith('配置文件已创建: vue3mp.config.js')
  })

  it('显示配置时未找到配置文件则回退默认配置', async () => {
    configManagerFromFile.mockRejectedValueOnce(new Error('missing'))
    configManagerConstructor.mockImplementationOnce(() => ({
      toJSON: () => '{"default":true}'
    }))
    const log = vi.spyOn(console, 'log').mockImplementation(() => undefined)
    const { createConfigCommand } = await import('@/cli/commands/config.js')
    const command = createConfigCommand()

    await command.parseAsync(['node', 'fuckmp', 'config', '--show'])

    expect(configManagerFromFile).toHaveBeenCalledWith('vue3mp.config.js')
    expect(loggerMock.warn).toHaveBeenCalledWith('未找到配置文件，显示默认配置:')
    expect(log).toHaveBeenCalledWith('{"default":true}')
  })

  it('验证配置失败时输出错误并退出', async () => {
    const configError = new Error('invalid config')
    configManagerFromFile.mockRejectedValueOnce(configError)
    const exit = vi.spyOn(process, 'exit').mockImplementation((code?: string | number | null | undefined) => {
      throw new Error(`process.exit(${code})`)
    })
    const { createConfigCommand } = await import('@/cli/commands/config.js')
    const command = createConfigCommand()

    await expect(command.parseAsync(['node', 'fuckmp', 'config', '--validate']))
      .rejects.toThrow('process.exit(1)')

    expect(configManagerFromFile).toHaveBeenCalledWith('vue3mp.config.js')
    expect(loggerMock.error).toHaveBeenCalledWith('配置文件验证失败', configError)
    expect(exit).toHaveBeenCalledWith(1)
  })
})
