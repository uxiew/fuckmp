/**
 * TouchWX `_original` 优先迁移验收测试。
 */

import { parse as babelParse } from '@babel/parser'
import { parse as parseSfc } from '@vue/compiler-sfc'
import { beforeEach, describe, expect, it } from 'vitest'
import { dirname, join, resolve } from 'path'
import { promises as fs } from 'fs'
import { Vue3MiniprogramCompiler } from '@/compiler/compiler.js'
import { migrateTouchWxOriginalProject } from '../../scripts/migrate-touchwx-original.js'

describe('TouchWX _original 优先迁移验收', () => {
  const originalRoot = '/Users/bing/Workspace/touchwx/_original'
  const exampleRoot = join(process.cwd(), 'examples/touchwx-original-migrated')
  const outputRoot = join(process.cwd(), 'test-output/touchwx-original-migrated')

  beforeEach(async () => {
    await fs.rm(exampleRoot, { recursive: true, force: true })
    await fs.rm(outputRoot, { recursive: true, force: true })
  })

  it('应该先从 _original 生成 Vue3 SFC 并完成小程序编译', async () => {
    const summary = await migrateTouchWxOriginalProject(originalRoot, exampleRoot)

    expect(summary.originalRoot).toBe(originalRoot)
    expect(summary.components.filter(item => !item.source.startsWith('generated missing referenced component'))).toHaveLength(41)
    expect(summary.components).toHaveLength(43)
    expect(summary.pages).toHaveLength(4)
    expect(summary.components.map(item => item.output)).toEqual(expect.arrayContaining([
      'components/ui-accordion.vue',
      'components/ui-count-down-index1.vue',
      'components/ui-count-up-index1.vue',
      'components/original-scaffold-package.vue',
      'components/ui-icon.vue',
      'components/wxc-example-menu.vue'
    ]))
    expect(summary.pages.map(item => item.output)).toEqual(expect.arrayContaining([
      'pages/home/index.vue',
      'pages/original-fixtures/scaffold-example.vue',
      'pages/original-fixtures/scaffold-page.vue',
      'pages/original-fixtures/component-home.vue'
    ]))

    const sourceFiles = await walkVueFiles(exampleRoot)
    expect(sourceFiles).toHaveLength(48)

    for (const file of sourceFiles) {
      const source = await fs.readFile(file, 'utf8')
      const parsed = parseSfc(source, { filename: file })
      expect(parsed.errors, file).toEqual([])

      const script = parsed.descriptor.scriptSetup
      if (script) {
        expect(() => babelParse(script.content, {
          sourceType: 'module',
          plugins: ['typescript']
        }), file).not.toThrow()
      }
    }

    const compiler = new Vue3MiniprogramCompiler({
      input: exampleRoot,
      output: outputRoot,
      appId: 'touristappid',
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

    expect(result.errors).toEqual([])
    expect(result.stats.total).toBe(48)
    expect(result.stats.success).toBe(48)
    expect(result.stats.failed).toBe(0)

    const appJson = JSON.parse(await readOutputFile('app.json'))
    expect(appJson.pages).toEqual(expect.arrayContaining([
      'pages/home/index',
      'pages/original-fixtures/scaffold-example',
      'pages/original-fixtures/scaffold-page',
      'pages/original-fixtures/component-home'
    ]))

    const accordionJson = JSON.parse(await readOutputFile('components/ui-accordion.json'))
    expect(accordionJson.component).toBe(true)
    expect(accordionJson.options).toEqual({ multipleSlots: true })

    const accordionWxml = await readOutputFile('components/ui-accordion.wxml')
    expect(accordionWxml).toContain('<slot name="header"')
    expect(accordionWxml).toContain('<slot name="content"')

    const fixtureJson = JSON.parse(await readOutputFile('components/original-scaffold-package.json'))
    expect(fixtureJson.component).toBe(true)

    await expectUsingComponentTargetsToExist()
  })

  async function readOutputFile(relativePath: string): Promise<string> {
    return fs.readFile(join(outputRoot, relativePath), 'utf8')
  }

  async function expectUsingComponentTargetsToExist(): Promise<void> {
    const jsonFiles = await walkFiles(outputRoot, file => file.endsWith('.json'))
    for (const file of jsonFiles) {
      const config = JSON.parse(await fs.readFile(file, 'utf8')) as {
        usingComponents?: Record<string, string>
      }

      for (const [tag, componentPath] of Object.entries(config.usingComponents || {})) {
        const target = resolve(dirname(file), `${componentPath}.json`)
        await expect(fs.access(target), `${file} -> ${tag}: ${target}`).resolves.toBeUndefined()
      }
    }
  }
})

async function walkVueFiles(root: string): Promise<string[]> {
  return walkFiles(root, file => file.endsWith('.vue'))
}

async function walkFiles(root: string, filter: (file: string) => boolean): Promise<string[]> {
  const files: string[] = []
  const entries = await fs.readdir(root, { withFileTypes: true })

  for (const entry of entries) {
    const fullPath = join(root, entry.name)
    if (entry.isDirectory()) {
      files.push(...await walkFiles(fullPath, filter))
    } else if (entry.isFile() && filter(fullPath)) {
      files.push(fullPath)
    }
  }

  return files.sort()
}
