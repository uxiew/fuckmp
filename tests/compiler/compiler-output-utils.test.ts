import { describe, expect, it } from 'vitest'
import { promises as fs } from 'fs'
import { join } from 'path'
import { createPathResolver, exists, writeFile } from '@/utils/index.js'
import {
  buildCompiledFileList,
  buildPageRoutesFromFiles,
  getGeneratedOutputFilePaths,
  removeGeneratedOutputFiles,
  writeGeneratedOutputFiles
} from '@/compiler/compiler-output-utils.js'

describe('compiler output utils', () => {
  it('计算 Vue 源文件对应的小程序输出产物路径', () => {
    const inputRoot = join(process.cwd(), 'src')
    const outputRoot = join(process.cwd(), 'dist')
    const inputPath = join(inputRoot, 'pages/home/index.vue')

    expect(getGeneratedOutputFilePaths(inputPath, inputRoot, outputRoot)).toEqual([
      join(outputRoot, 'pages/home/index.js'),
      join(outputRoot, 'pages/home/index.json'),
      join(outputRoot, 'pages/home/index.wxml'),
      join(outputRoot, 'pages/home/index.wxss'),
      join(outputRoot, 'pages/home/index.js.map')
    ])
  })

  it('删除确定的编译产物并保留非编译产物', async () => {
    const tempRoot = join(process.cwd(), 'tests/temp/compiler-output-cleanup')
    const inputRoot = join(tempRoot, 'src')
    const outputRoot = join(tempRoot, 'dist')
    const inputPath = join(inputRoot, 'components/UserCard.vue')
    const generatedFiles = getGeneratedOutputFilePaths(inputPath, inputRoot, outputRoot)
    const unrelatedFile = join(outputRoot, 'components/UserCard.custom')

    await fs.rm(tempRoot, { recursive: true, force: true })
    await Promise.all([
      ...generatedFiles.map(file => writeFile(file, 'generated')),
      writeFile(unrelatedFile, 'keep me')
    ])

    await removeGeneratedOutputFiles(inputPath, inputRoot, outputRoot)

    await Promise.all(generatedFiles.map(async file => {
      expect(await exists(file)).toBe(false)
    }))
    expect(await exists(unrelatedFile)).toBe(true)
  })

  it('合并页面和组件编译记录路径', () => {
    const pages = new Map([
      ['/project/src/pages/index.vue', {}],
      ['/project/src/pages/about.vue', {}]
    ])
    const components = new Map([
      ['/project/src/components/Card.vue', {}]
    ])

    expect(buildCompiledFileList(pages, components)).toEqual([
      '/project/src/pages/index.vue',
      '/project/src/pages/about.vue',
      '/project/src/components/Card.vue'
    ])
  })

  it('从编译成功文件中构造 app.json 页面路由', () => {
    const inputRoot = '/project/src'

    expect(buildPageRoutesFromFiles([
      '/project/src/app.vue',
      '/project/src/pages/index/index.vue',
      '/project/src/components/UserCard.vue',
      '/project/src/pages/profile.vue'
    ], inputRoot)).toEqual([
      'pages/index/index',
      'pages/profile'
    ])
  })

  it('写入生成产物并在 JSON 中合并用户配置', async () => {
    const tempRoot = join(process.cwd(), 'tests/temp/compiler-output-write')
    const inputRoot = join(tempRoot, 'src')
    const outputRoot = join(tempRoot, 'dist')
    const inputPath = join(inputRoot, 'pages/home/index.vue')

    await fs.rm(tempRoot, { recursive: true, force: true })
    await writeGeneratedOutputFiles({
      inputPath,
      inputRoot,
      outputRoot,
      generateResult: {
        js: 'Page({})',
        json: { navigationBarTitleText: '默认标题' },
        wxml: '<view />',
        wxss: '.page{}',
        sourceMap: '{"version":3}'
      },
      userConfig: {
        pages: {
          'pages/home/index': {
            navigationBarTitleText: '首页'
          }
        }
      },
      pathResolver: createPathResolver(inputRoot)
    })

    expect(await fs.readFile(join(outputRoot, 'pages/home/index.js'), 'utf8')).toBe('Page({})')
    expect(JSON.parse(await fs.readFile(join(outputRoot, 'pages/home/index.json'), 'utf8')))
      .toEqual({ navigationBarTitleText: '首页' })
    expect(await fs.readFile(join(outputRoot, 'pages/home/index.wxml'), 'utf8')).toBe('<view />')
    expect(await fs.readFile(join(outputRoot, 'pages/home/index.wxss'), 'utf8')).toBe('.page{}')
    expect(await fs.readFile(join(outputRoot, 'pages/home/index.js.map'), 'utf8')).toBe('{"version":3}')
  })
})
