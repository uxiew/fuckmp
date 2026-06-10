import { mkdtemp, readFile, rm } from 'fs/promises'
import { tmpdir } from 'os'
import { join } from 'path'
import { describe, expect, it } from 'vitest'
import type { CompilerOptions } from '@/types/compiler.js'
import type { RuntimeIntegrationConfig } from '@/compiler/runtime-integration.js'
import {
  createRuntimeInjectionConfig,
  writeRuntimeGeneratedFiles
} from '@/compiler/runtime-injector-utils.js'

const baseRuntimeConfig: RuntimeIntegrationConfig = {
  enableRuntime: true,
  runtimePath: './runtime',
  autoInject: true,
  runtimeConfig: {
    debug: false,
    performance: true
  },
  plugins: {
    enableAll: true,
    include: [],
    exclude: []
  }
}

function createCompilerOptions(mode: CompilerOptions['mode']): CompilerOptions {
  return {
    input: 'src',
    output: 'dist',
    mode,
    appId: 'test',
    framework: 'vue3',
    features: {
      scriptSetup: true,
      scss: true,
      typescript: true,
      compositionApi: true,
      emits: true,
      slots: true,
      provide: true
    },
    optimization: {
      minify: false,
      treeshaking: true,
      sourcemap: false,
      incremental: true
    },
    injection: {
      pureMode: false,
      page: {
        shareAppMessage: false,
        shareTimeline: false,
        loadingState: false,
        pullDownRefresh: false,
        reachBottom: false,
        baseStyles: false,
        eventHandlers: false
      },
      component: {
        inputHandlers: false,
        eventHandlers: false
      },
      reactivity: {
        extraHelpers: false
      }
    }
  }
}

describe('runtime injector utils', () => {
  it('基于 runtime integration 配置创建旧语义的默认注入配置', () => {
    expect(createRuntimeInjectionConfig(baseRuntimeConfig, createCompilerOptions('development')))
      .toEqual({
        ...baseRuntimeConfig,
        treeshaking: true,
        minify: false,
        codeSplitting: true,
        chunkStrategy: 'feature',
        runtimeVersion: '1.0.0',
        customModules: []
      })

    expect(createRuntimeInjectionConfig(baseRuntimeConfig, createCompilerOptions('production')).minify)
      .toBe(true)
  })

  it('递归写入生成文件并回调 debug 日志', async () => {
    const outputDir = await mkdtemp(join(tmpdir(), 'runtime-injector-utils-'))
    const debugLines: string[] = []

    try {
      await writeRuntimeGeneratedFiles(
        outputDir,
        [
          { path: 'runtime/runtime-injection.js', content: 'runtime code' },
          { path: 'pages/home/index.js', content: 'Page({})' }
        ],
        message => debugLines.push(message)
      )

      expect(await readFile(join(outputDir, 'runtime/runtime-injection.js'), 'utf8'))
        .toBe('runtime code')
      expect(await readFile(join(outputDir, 'pages/home/index.js'), 'utf8'))
        .toBe('Page({})')
      expect(debugLines).toEqual([
        '生成文件: runtime/runtime-injection.js (12 字节)',
        '生成文件: pages/home/index.js (8 字节)'
      ])
    } finally {
      await rm(outputDir, { recursive: true, force: true })
    }
  })
})
