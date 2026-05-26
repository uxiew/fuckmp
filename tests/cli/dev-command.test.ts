import { afterEach, describe, expect, it, vi } from 'vitest'
import { Command } from 'commander'

const { createBuildCommandMock, parseAsyncMock } = vi.hoisted(() => ({
  createBuildCommandMock: vi.fn(),
  parseAsyncMock: vi.fn()
}))

vi.mock('@/cli/commands/build.js', () => ({
  createBuildCommand: createBuildCommandMock
}))

describe('dev command', () => {
  const originalArgv = process.argv

  afterEach(() => {
    process.argv = originalArgv
    vi.clearAllMocks()
  })

  it('转发给 build watch 时只携带用户原始参数', async () => {
    const { buildDevForwardArgs } = await import('@/cli/commands/dev.js')

    expect(buildDevForwardArgs(['--config', 'vue3mp.config.js'])).toEqual([
      '--watch',
      '--config',
      'vue3mp.config.js'
    ])
    expect(buildDevForwardArgs(['--input', 'custom-src', '--output', 'custom-dist'])).toEqual([
      '--watch',
      '--input',
      'custom-src',
      '--output',
      'custom-dist'
    ])
  })

  it('dev alias 支持 build 常用选项并转发为 build --watch', async () => {
    parseAsyncMock.mockResolvedValueOnce(undefined)
    createBuildCommandMock.mockReturnValueOnce({
      parseAsync: parseAsyncMock
    })
    process.argv = [
      'node',
      'fuckmp',
      'dev',
      '--config',
      'vue3mp.config.js',
      '--app-id',
      'wx-test',
      '--sourcemap',
      '--no-sourcemap',
      '--minify',
      '--no-minify',
      '--clean'
    ]
    const { createDevCommand } = await import('@/cli/commands/dev.js')
    const command = createDevCommand()

    await command.parseAsync(process.argv)

    expect(createBuildCommandMock).toHaveBeenCalledTimes(1)
    expect(parseAsyncMock).toHaveBeenCalledWith([
      '--watch',
      '--config',
      'vue3mp.config.js',
      '--app-id',
      'wx-test',
      '--sourcemap',
      '--no-sourcemap',
      '--minify',
      '--no-minify',
      '--clean'
    ], { from: 'user' })
  })

  it('dev alias 不受全局参数位置影响', async () => {
    parseAsyncMock.mockResolvedValueOnce(undefined)
    createBuildCommandMock.mockReturnValueOnce({
      parseAsync: parseAsyncMock
    })
    process.argv = [
      'node',
      'fuckmp',
      '--silent',
      'dev',
      '--config',
      'vue3mp.config.js'
    ]
    const { createDevCommand } = await import('@/cli/commands/dev.js')
    const program = new Command()
      .option('--silent')
      .addCommand(createDevCommand())

    await program.parseAsync(process.argv)

    expect(parseAsyncMock).toHaveBeenCalledWith([
      '--watch',
      '--config',
      'vue3mp.config.js'
    ], { from: 'user' })
  })
})
