import { afterEach, describe, expect, it, vi } from 'vitest'

const { compilerConstructor, configManagerFromFile, loggerMock } = vi.hoisted(() => ({
  compilerConstructor: vi.fn(),
  configManagerFromFile: vi.fn(),
  loggerMock: {
    setLevel: vi.fn(),
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
    debug: vi.fn(),
    getLevel: vi.fn(() => 'info')
  }
}))

vi.mock('@/compiler/index.js', () => ({
  Vue3MiniprogramCompiler: compilerConstructor,
  ConfigManager: {
    fromFile: configManagerFromFile
  }
}))

vi.mock('@/utils/index.js', () => ({
  logger: loggerMock
}))

describe('build command', () => {
  afterEach(() => {
    vi.restoreAllMocks()
    vi.clearAllMocks()
  })

  it('未显式传 input/output 时保留配置文件中的路径和优化项', async () => {
    configManagerFromFile.mockResolvedValueOnce({
      getOptions: () => ({
        input: 'configured-src',
        output: 'configured-dist',
        optimization: {
          minify: false,
          sourcemap: true,
          treeshaking: false,
          incremental: false
        }
      })
    })
    compilerConstructor.mockImplementationOnce(() => ({
      compile: vi.fn(async () => ({
        errors: [],
        success: [],
        stats: {
          success: 0,
          failed: 0,
          duration: 0
        }
      }))
    }))
    const { createBuildCommand } = await import('@/cli/commands/build.js')
    const command = createBuildCommand()

    await command.parseAsync([
      'node',
      'fuckmp',
      'build',
      '--config',
      'vue3mp.config.js'
    ])

    expect(configManagerFromFile).toHaveBeenCalledWith('vue3mp.config.js')
    expect(compilerConstructor).toHaveBeenCalledWith(expect.objectContaining({
      input: 'configured-src',
      output: 'configured-dist',
      optimization: {
        minify: false,
        sourcemap: true,
        treeshaking: false,
        incremental: false
      }
    }))
  })

  it('配置文件中的 input/output 路径等价时合并后提前诊断', async () => {
    configManagerFromFile.mockResolvedValueOnce({
      getOptions: () => ({
        input: 'configured-src',
        output: './configured-src'
      })
    })
    const exit = vi.spyOn(process, 'exit').mockImplementation((code?: string | number | null | undefined) => {
      throw new Error(`process.exit(${code})`)
    })
    const { createBuildCommand } = await import('@/cli/commands/build.js')
    const command = createBuildCommand()

    await expect(command.parseAsync([
      'node',
      'fuckmp',
      'build',
      '--config',
      'vue3mp.config.js'
    ])).rejects.toThrow('process.exit(1)')

    expect(loggerMock.error).toHaveBeenCalledWith('构建参数无效')
    expect(loggerMock.error).toHaveBeenCalledWith('输入目录和输出目录不能相同')
    expect(compilerConstructor).not.toHaveBeenCalled()
    expect(exit).toHaveBeenCalledWith(1)
  })

  it('输入目录和输出目录相同时提前给出明确诊断且不启动编译器', async () => {
    await expectInvalidSamePathToExit(['--input', 'src', '--output', 'src'])
  })

  it('输入目录和输出目录路径等价时提前给出明确诊断', async () => {
    await expectInvalidSamePathToExit(['--input', './src', '--output', 'src'])
  })

  it('显式配置文件加载失败时提前给出明确诊断且不启动编译器', async () => {
    const configError = new Error('ENOENT: no such file or directory')
    configManagerFromFile.mockRejectedValueOnce(configError)
    const exit = vi.spyOn(process, 'exit').mockImplementation((code?: string | number | null | undefined) => {
      throw new Error(`process.exit(${code})`)
    })
    const { createBuildCommand } = await import('@/cli/commands/build.js')
    const command = createBuildCommand()

    await expect(command.parseAsync([
      'node',
      'fuckmp',
      'build',
      '--config',
      'missing.config.js'
    ])).rejects.toThrow('process.exit(1)')

    expect(configManagerFromFile).toHaveBeenCalledWith('missing.config.js')
    expect(loggerMock.error).toHaveBeenCalledWith('配置文件加载失败: missing.config.js', configError)
    expect(compilerConstructor).not.toHaveBeenCalled()
    expect(exit).toHaveBeenCalledWith(1)
  })
})

async function expectInvalidSamePathToExit(args: string[]): Promise<void> {
  const exit = vi.spyOn(process, 'exit').mockImplementation((code?: string | number | null | undefined) => {
    throw new Error(`process.exit(${code})`)
  })
  const { createBuildCommand } = await import('@/cli/commands/build.js')
  const command = createBuildCommand()

  await expect(command.parseAsync([
    'node',
    'fuckmp',
    'build',
    ...args
  ])).rejects.toThrow('process.exit(1)')

  expect(loggerMock.error).toHaveBeenCalledWith('构建参数无效')
  expect(loggerMock.error).toHaveBeenCalledWith('输入目录和输出目录不能相同')
  expect(compilerConstructor).not.toHaveBeenCalled()
  expect(exit).toHaveBeenCalledWith(1)
}
