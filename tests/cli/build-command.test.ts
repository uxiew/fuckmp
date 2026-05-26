import { afterEach, describe, expect, it, vi } from 'vitest'

const { compilerConstructor, loggerMock } = vi.hoisted(() => ({
  compilerConstructor: vi.fn(),
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
  Vue3MiniprogramCompiler: compilerConstructor
}))

vi.mock('@/utils/index.js', () => ({
  logger: loggerMock
}))

describe('build command', () => {
  afterEach(() => {
    vi.restoreAllMocks()
    vi.clearAllMocks()
  })

  it('输入目录和输出目录相同时提前给出明确诊断且不启动编译器', async () => {
    await expectInvalidSamePathToExit(['--input', 'src', '--output', 'src'])
  })

  it('输入目录和输出目录路径等价时提前给出明确诊断', async () => {
    await expectInvalidSamePathToExit(['--input', './src', '--output', 'src'])
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
