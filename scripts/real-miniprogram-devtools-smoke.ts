#!/usr/bin/env tsx

/**
 * 真实示例微信开发者工具 opt-in 冒烟脚本。
 *
 * 默认不会启动微信开发者工具；只有显式设置 `FUCKMP_REAL_DEVTOOLS_SMOKE=1` 才会执行真实 CLI。
 */

import { spawn as spawnChildProcess } from 'node:child_process'
import { resolve } from 'node:path'
import { Vue3MiniprogramCompiler } from '../src/compiler/compiler.js'

const DEFAULT_WECHAT_IDE_CLI = '/Applications/wechatwebdevtools.app/Contents/MacOS/cli'
const DEFAULT_AUTO_PORT = 9420
const DEFAULT_APP_ID = 'touristappid'
const SKIP_REASON = 'set FUCKMP_REAL_DEVTOOLS_SMOKE=1 to run WeChat DevTools smoke'

export interface DevToolsSmokeCompileOptions {
  /** 真实示例输入目录。 */
  inputRoot: string
  /** 小程序输出目录。 */
  outputRoot: string
  /** 小程序 AppID，默认使用 touristappid 仅做开发者工具冒烟。 */
  appId: string
}

export interface DevToolsSmokeOptions extends DevToolsSmokeCompileOptions {
  /** 是否执行真实微信开发者工具 CLI。 */
  enabled: boolean
  /** 当前项目根目录。 */
  cwd: string
  /** 微信开发者工具 CLI 路径。 */
  cliPath: string
  /** 自动化端口。 */
  autoPort: number
}

export type DevToolsSmokeSpawn = (command: string, args: string[]) => Promise<{ code: number | null }>
export type DevToolsSmokeCompile = (options: DevToolsSmokeCompileOptions) => Promise<void>

export type DevToolsSmokeResult =
  | { status: 'skipped'; reason: string }
  | { status: 'passed'; code: number | null }
  | { status: 'failed'; code: number | null }

interface CreateOptionsInput {
  cwd: string
  env: NodeJS.ProcessEnv | Record<string, string | undefined>
}

interface RunSmokeInput extends CreateOptionsInput {
  spawn?: DevToolsSmokeSpawn
  compile?: DevToolsSmokeCompile
}

/** 根据环境变量构造真实示例 DevTools 冒烟配置。 */
export function createRealMiniprogramDevToolsSmokeOptions(input: CreateOptionsInput): DevToolsSmokeOptions {
  const env = input.env
  const cwd = input.cwd

  return {
    enabled: env.FUCKMP_REAL_DEVTOOLS_SMOKE === '1',
    cwd,
    cliPath: env.WECHAT_IDE_CLI || DEFAULT_WECHAT_IDE_CLI,
    inputRoot: resolve(cwd, env.FUCKMP_REAL_MINIPROGRAM_INPUT || 'examples/real-miniprogram'),
    outputRoot: resolve(cwd, env.FUCKMP_REAL_MINIPROGRAM_OUTPUT || 'test-output/real-miniprogram'),
    appId: env.FUCKMP_REAL_MINIPROGRAM_APPID || DEFAULT_APP_ID,
    autoPort: parseAutoPort(env.WECHAT_DEVTOOLS_AUTO_PORT)
  }
}

/** 构造 `wechatwebdevtools cli auto` 参数。 */
export function buildDevToolsAutoArgs(options: DevToolsSmokeOptions): string[] {
  return [
    'auto',
    '--project',
    options.outputRoot,
    '--auto-port',
    String(options.autoPort),
    '--trust-project'
  ]
}

/** 运行真实示例微信开发者工具 opt-in 冒烟。 */
export async function runRealMiniprogramDevToolsSmoke(input: RunSmokeInput): Promise<DevToolsSmokeResult> {
  const options = createRealMiniprogramDevToolsSmokeOptions(input)

  if (!options.enabled) {
    return { status: 'skipped', reason: SKIP_REASON }
  }

  const compile = input.compile || compileRealMiniprogramExample
  const spawn = input.spawn || spawnDevToolsCli

  await compile({
    inputRoot: options.inputRoot,
    outputRoot: options.outputRoot,
    appId: options.appId
  })

  const result = await spawn(options.cliPath, buildDevToolsAutoArgs(options))

  return result.code === 0
    ? { status: 'passed', code: result.code }
    : { status: 'failed', code: result.code }
}

/** 编译真实示例输出，供 DevTools 打开。 */
export async function compileRealMiniprogramExample(options: DevToolsSmokeCompileOptions): Promise<void> {
  const compiler = new Vue3MiniprogramCompiler({
    input: options.inputRoot,
    output: options.outputRoot,
    appId: options.appId,
    features: {
      scriptSetup: true,
      typescript: true,
      scss: true,
      compositionApi: true,
      emits: true,
      slots: true,
      provide: false
    },
    optimization: {
      minify: false,
      sourcemap: true,
      treeshaking: false,
      incremental: false
    }
  })

  const result = await compiler.compile()
  if (result.errors.length > 0 || result.stats.failed > 0) {
    const message = result.errors.map(error => error.message).join('\n') || 'real miniprogram compilation failed'
    throw new Error(message)
  }
}

function spawnDevToolsCli(command: string, args: string[]): Promise<{ code: number | null }> {
  return new Promise((resolveSpawn, reject) => {
    const child = spawnChildProcess(command, args, {
      cwd: process.cwd(),
      stdio: 'inherit'
    })

    child.on('close', code => resolveSpawn({ code }))
    child.on('error', reject)
  })
}

function parseAutoPort(value: string | undefined): number {
  if (!value) return DEFAULT_AUTO_PORT

  const parsed = Number(value)
  return Number.isInteger(parsed) && parsed > 0 ? parsed : DEFAULT_AUTO_PORT
}

async function main(): Promise<void> {
  const result = await runRealMiniprogramDevToolsSmoke({
    cwd: process.cwd(),
    env: process.env
  })

  if (result.status === 'skipped') {
    console.log(`⏭️  跳过真实示例 DevTools 冒烟：${result.reason}`)
    return
  }

  if (result.status === 'passed') {
    console.log('✅ 真实示例 DevTools 冒烟通过')
    return
  }

  console.error(`❌ 真实示例 DevTools 冒烟失败，退出码：${result.code ?? 'unknown'}`)
  process.exit(1)
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch(error => {
    console.error('❌ 真实示例 DevTools 冒烟执行失败:', error)
    process.exit(1)
  })
}
