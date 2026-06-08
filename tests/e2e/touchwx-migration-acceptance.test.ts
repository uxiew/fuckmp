/**
 * TouchWX 迁移示例验收测试。
 */

import { parse as babelParse } from '@babel/parser'
import { parse as parseSfc } from '@vue/compiler-sfc'
import { beforeEach, describe, expect, it } from 'vitest'
import { dirname, join, resolve } from 'path'
import { promises as fs } from 'fs'
import { Vue3MiniprogramCompiler } from '@/compiler/compiler.js'

describe('TouchWX 迁移示例验收', () => {
  const exampleRoot = join(process.cwd(), 'examples/touchwx-migrated')
  const outputRoot = join(process.cwd(), 'test-output/touchwx-migrated')

  beforeEach(async () => {
    await fs.rm(outputRoot, { recursive: true, force: true })
  })

  it('编译迁移后的 TouchWX 示例并保证自定义组件路径可被 DevTools 解析', async () => {
    const sourceFiles = await walkVueFiles(exampleRoot)
    expect(sourceFiles).toHaveLength(127)

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
    expect(result.stats.total).toBe(127)
    expect(result.stats.success).toBe(127)
    expect(result.stats.failed).toBe(0)

    const appJson = JSON.parse(await readOutputFile('app.json'))
    expect(appJson.pages).toHaveLength(84)
    expect(appJson.pages).toEqual(expect.arrayContaining([
      'pages/index',
      'pages/home/about',
      'pages/componentDemo/button',
      'pages/componentDemo/map/mapDemo',
      'pages/componentDemo/mapsdk/routePlanning'
    ]))
    expect(appJson.window.navigationBarTitleText).toBe('TouchUI')
    expect(appJson.tabBar.list).toEqual(expect.arrayContaining([
      expect.objectContaining({ pagePath: 'pages/index', text: '组件' }),
      expect.objectContaining({ pagePath: 'pages/home/about', text: '关于' })
    ]))
    await expectTabBarIconTargetsToExist(appJson)
    await expectStaticAssetsToExist([
      'static/data/city.js',
      'static/map/amap-wx.js',
      'static/map/qqmap-wx-jssdk.min.js'
    ])

    const indexJson = JSON.parse(await readOutputFile('pages/index.json'))
    expect(indexJson.usingComponents).toMatchObject({
      'ui-nav-bar': '../components/ui-nav-bar',
      'ui-row': '../components/ui-row',
      'ui-col': '../components/ui-col',
      'ui-icon': '../components/ui-icon'
    })

    const indexWxml = await readOutputFile('pages/index.wxml')
    expect(indexWxml).toContain('<ui-row')
    expect(indexWxml).toContain('<navigator url="/pages/home/viewList"')

    const buttonWxml = await readOutputFile('pages/componentDemo/button.wxml')
    expect(buttonWxml).toContain('<button type="primary"')
    expect(buttonWxml).toContain('bindtap="submitHandler"')

    const mapWxml = await readOutputFile('pages/componentDemo/map/mapDemo.wxml')
    expect(mapWxml).toContain('<map')
    expect(mapWxml).toContain('markers="{{markers}}"')

    const uiRowJson = JSON.parse(await readOutputFile('components/ui-row.json'))
    expect(uiRowJson.component).toBe(true)
    expect(uiRowJson.options).toEqual({ multipleSlots: true })

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

  async function expectTabBarIconTargetsToExist(appJson: {
    tabBar?: {
      list?: Array<{
        iconPath?: string
        selectedIconPath?: string
      }>
    }
  }): Promise<void> {
    const iconPaths = (appJson.tabBar?.list || []).flatMap(item => [
      item.iconPath,
      item.selectedIconPath
    ]).filter((iconPath): iconPath is string => Boolean(iconPath))

    for (const iconPath of iconPaths) {
      const target = join(outputRoot, iconPath)
      await expect(fs.access(target), `tabBar iconPath: ${target}`).resolves.toBeUndefined()
    }
  }

  async function expectStaticAssetsToExist(relativePaths: string[]): Promise<void> {
    for (const relativePath of relativePaths) {
      const target = join(outputRoot, relativePath)
      await expect(fs.access(target), `static asset: ${target}`).resolves.toBeUndefined()
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
