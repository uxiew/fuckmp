import { describe, expect, it, vi } from 'vitest'
import {
  buildDevToolsAutoArgs,
  createRealMiniprogramDevToolsSmokeOptions,
  runRealMiniprogramDevToolsSmoke,
  type DevToolsSmokeSpawn
} from '../../scripts/real-miniprogram-devtools-smoke.js'

describe('real miniprogram DevTools smoke script', () => {
  it('默认未显式 opt-in 时跳过真实微信开发者工具调用', async () => {
    const spawn: DevToolsSmokeSpawn = vi.fn(async () => ({ code: 0 }))
    const compile = vi.fn(async () => undefined)

    const result = await runRealMiniprogramDevToolsSmoke({
      cwd: '/repo',
      env: {},
      spawn,
      compile
    })

    expect(result).toEqual({ status: 'skipped', reason: 'set FUCKMP_REAL_DEVTOOLS_SMOKE=1 to run WeChat DevTools smoke' })
    expect(compile).not.toHaveBeenCalled()
    expect(spawn).not.toHaveBeenCalled()
  })

  it('构造微信开发者工具 auto 参数并允许环境变量覆盖路径和端口', () => {
    const options = createRealMiniprogramDevToolsSmokeOptions({
      cwd: '/repo',
      env: {
        FUCKMP_REAL_DEVTOOLS_SMOKE: '1',
        WECHAT_IDE_CLI: '/custom/wechat/cli',
        WECHAT_DEVTOOLS_AUTO_PORT: '19000',
        FUCKMP_REAL_MINIPROGRAM_OUTPUT: 'tmp/out'
      }
    })

    expect(options.enabled).toBe(true)
    expect(options.cliPath).toBe('/custom/wechat/cli')
    expect(options.outputRoot).toBe('/repo/tmp/out')
    expect(options.autoPort).toBe(19000)
    expect(buildDevToolsAutoArgs(options)).toEqual([
      'auto',
      '--project',
      '/repo/tmp/out',
      '--auto-port',
      '19000',
      '--trust-project'
    ])
  })

  it('显式 opt-in 时先编译真实示例，再调用微信开发者工具 CLI', async () => {
    const spawn: DevToolsSmokeSpawn = vi.fn(async () => ({ code: 0 }))
    const compile = vi.fn(async () => undefined)

    const result = await runRealMiniprogramDevToolsSmoke({
      cwd: '/repo',
      env: {
        FUCKMP_REAL_DEVTOOLS_SMOKE: '1',
        WECHAT_IDE_CLI: '/custom/wechat/cli'
      },
      spawn,
      compile
    })

    expect(result).toEqual({ status: 'passed', code: 0 })
    expect(compile).toHaveBeenCalledWith(expect.objectContaining({
      inputRoot: '/repo/examples/real-miniprogram',
      outputRoot: '/repo/test-output/real-miniprogram',
      appId: 'touristappid'
    }))
    expect(spawn).toHaveBeenCalledWith('/custom/wechat/cli', [
      'auto',
      '--project',
      '/repo/test-output/real-miniprogram',
      '--auto-port',
      '9420',
      '--trust-project'
    ])
  })
})
