#!/usr/bin/env tsx

/**
 * npm 包真实安装 opt-in smoke。
 *
 * 默认跳过；只有显式设置 `FUCKMP_PACKAGE_SMOKE=1` 才会 build、pack 并在临时项目中安装 tarball。
 */

import { spawn as spawnChildProcess } from 'node:child_process'
import { cp, mkdtemp, readFile, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { basename, join, resolve } from 'node:path'

const SKIP_REASON = 'set FUCKMP_PACKAGE_SMOKE=1 to run package install smoke'

interface CommandResult {
  stdout: string
  stderr: string
}

interface PackFileEntry {
  path: string
}

interface PackResult {
  filename: string
  files: PackFileEntry[]
}

type PackageSmokeResult =
  | { status: 'skipped'; reason: string }
  | { status: 'passed' }

/** 运行 npm 包真实安装 smoke。 */
export async function runPackageSmoke(env: NodeJS.ProcessEnv = process.env, cwd = process.cwd()): Promise<PackageSmokeResult> {
  if (env.FUCKMP_PACKAGE_SMOKE !== '1') {
    return { status: 'skipped', reason: SKIP_REASON }
  }

  await runCommand('pnpm', ['build'], cwd)

  const packageRoot = await mkdtemp(join(tmpdir(), 'fuckmp-package-smoke-'))
  try {
    const pack = await packProject(cwd, packageRoot)
    const tarballPath = join(packageRoot, pack.filename)
    assertPackFiles(pack.files.map(file => file.path))
    await writeConsumerPackageJson(packageRoot)
    await runCommand('npm', ['install', '--silent', '--no-audit', '--no-fund', tarballPath, 'vue@3.5.35'], packageRoot)
    await verifyPublicApi(packageRoot)
    await verifyCliBins(packageRoot)
    await verifyCliBuild(cwd, packageRoot)
  } finally {
    await rm(packageRoot, { recursive: true, force: true })
  }

  return { status: 'passed' }
}

async function packProject(cwd: string, destination: string): Promise<PackResult> {
  const result = await runCommand('npm', ['pack', '--json', '--pack-destination', destination], cwd)
  const packs = JSON.parse(result.stdout) as PackResult[]
  const pack = packs[0]
  if (!pack) {
    throw new Error('npm pack did not produce a package')
  }

  return pack
}

function assertPackFiles(files: string[]): void {
  for (const expectedFile of [
    'README.md',
    'package.json',
    'dist/index.js',
    'dist/index.d.ts',
    'dist/cli/index.js'
  ]) {
    if (!files.includes(expectedFile)) {
      throw new Error(`package tarball missing ${expectedFile}`)
    }
  }

  if (files.some(file => file.startsWith('templates/'))) {
    throw new Error('package tarball should not include missing templates directory')
  }
}

async function writeConsumerPackageJson(packageRoot: string): Promise<void> {
  await writeFile(join(packageRoot, 'package.json'), JSON.stringify({
    name: 'fuckmp-package-smoke-consumer',
    private: true,
    type: 'module'
  }, null, 2))
}

async function verifyPublicApi(packageRoot: string): Promise<void> {
  await runCommand('node', [
    '--input-type=module',
    '-e',
    [
      'const mod = await import("fuckmp");',
      'if (!mod.FuckMPCompiler || !mod.Vue3MiniprogramCompiler || !mod.createCompiler) throw new Error("missing public exports");',
      'const compiler = new mod.FuckMPCompiler({ input: "src", output: "dist", appId: "test-app-id" });',
      'if (compiler.constructor.name !== "Vue3MiniprogramCompiler") throw new Error("unexpected compiler constructor");'
    ].join(' ')
  ], packageRoot)
}

async function verifyCliBins(packageRoot: string): Promise<void> {
  for (const binName of ['fuckmp', 'fmp']) {
    const result = await runCommand(join(packageRoot, 'node_modules/.bin', binName), ['--version'], packageRoot)
    if (!result.stdout.includes('1.0.0')) {
      throw new Error(`${binName} --version did not print package version`)
    }
  }
}

async function verifyCliBuild(cwd: string, packageRoot: string): Promise<void> {
  await cp(join(cwd, 'examples/community-pickup'), join(packageRoot, 'src'), { recursive: true })
  await runCommand(join(packageRoot, 'node_modules/.bin/fuckmp'), [
    'build', '--input', 'src', '--output', 'dist', '--app-id', 'touristappid'
  ], packageRoot)

  const readOutput = (file: string) => readFile(join(packageRoot, 'dist', file), 'utf8')
  const app = JSON.parse(await readOutput('app.json'))
  if (JSON.stringify(app.pages) !== JSON.stringify(['pages/booking', 'pages/pickup-info'])) {
    throw new Error('installed CLI did not generate the community pickup routes')
  }
  const booking = JSON.parse(await readOutput('pages/booking.json'))
  if (booking.usingComponents?.['pickup-offer'] !== '../components/PickupOffer') {
    throw new Error('installed CLI did not link the pickup offer component')
  }
  for (const [file, marker] of [
    ['app.js', 'App('],
    ['pages/booking.js', 'Page('],
    ['pages/pickup-info.wxml', 'open-type="navigateBack"'],
    ['pages/booking.wxml', 'bind:reserve="reserveOffer"'],
    ['pages/booking.wxss', '.pickup-page[data-v-'],
    ['components/PickupOffer.js', 'Component(']
  ]) {
    if (!(await readOutput(file)).includes(marker)) {
      throw new Error(`installed CLI generated unexpected output: ${file}`)
    }
  }
}

function runCommand(command: string, args: string[], cwd: string): Promise<CommandResult> {
  return new Promise((resolveCommand, reject) => {
    const child = spawnChildProcess(command, args, {
      cwd,
      env: process.env,
      stdio: ['ignore', 'pipe', 'pipe']
    })

    let stdout = ''
    let stderr = ''
    child.stdout.on('data', chunk => { stdout += String(chunk) })
    child.stderr.on('data', chunk => { stderr += String(chunk) })
    child.on('error', reject)
    child.on('close', code => {
      if (code === 0) {
        resolveCommand({ stdout, stderr })
        return
      }

      reject(new Error([
        `${basename(command)} ${args.join(' ')} failed with code ${code}`,
        stdout,
        stderr
      ].filter(Boolean).join('\n')))
    })
  })
}

async function main(): Promise<void> {
  const result = await runPackageSmoke()

  if (result.status === 'skipped') {
    console.log(`⏭️  跳过 npm 包真实安装 smoke：${result.reason}`)
    return
  }

  console.log('✅ npm 包真实安装 smoke 通过')
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch(async error => {
    console.error('❌ npm 包真实安装 smoke 执行失败:', error)
    try {
      const maybePackJson = await readFile(resolve(process.cwd(), 'package.json'), 'utf8')
      console.error(`当前 package.json 长度: ${maybePackJson.length}`)
    } catch {
      // 忽略附加诊断失败。
    }
    process.exit(1)
  })
}
