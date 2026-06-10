import { promises as fs } from 'fs'
import { dirname, join } from 'path'
import { describe, expect, it, vi } from 'vitest'
import {
  createImportedStyleParseOptions,
  createImportedStyleTransformOptions,
  createVueStyleParseOptions,
  createVueStyleTransformOptions,
  inferStyleLanguage,
  transformImportedStyleFiles,
  transformVueStyleBlocks
} from '@/compiler/compiler-style-utils.js'

describe('compiler style utils', () => {
  it('为 Vue SFC style block 创建解析与转换选项', () => {
    expect(createVueStyleParseOptions({ scoped: true }, '/project/src/pages/index.vue', true)).toEqual({
      scoped: true,
      sourcemap: true,
      baseDir: '/project/src/pages'
    })
    expect(createVueStyleTransformOptions({ scoped: true }, false)).toEqual({
      scoped: true,
      minify: false
    })
  })

  it('未声明 scoped 时不写入 scoped 选项', () => {
    expect(createVueStyleParseOptions({}, '/project/src/pages/index.vue', false)).toEqual({
      sourcemap: false,
      baseDir: '/project/src/pages'
    })
    expect(createVueStyleTransformOptions({}, true)).toEqual({
      minify: true
    })
  })

  it('为 JavaScript 导入样式创建固定非 scoped 选项', () => {
    expect(createImportedStyleParseOptions('/project/src/styles/app.scss', true)).toEqual({
      scoped: false,
      sourcemap: true,
      baseDir: '/project/src/styles'
    })
    expect(createImportedStyleTransformOptions(false, true)).toEqual({
      scoped: false,
      minify: false,
      sourcemap: true
    })
  })

  it('根据导入路径推断样式语言', () => {
    expect(inferStyleLanguage('app.scss')).toBe('scss')
    expect(inferStyleLanguage('app.sass')).toBe('sass')
    expect(inferStyleLanguage('app.wxss')).toBe('css')
  })

  it('解析并转换 Vue SFC style blocks', async () => {
    const context = { filename: '/project/src/pages/index.vue' } as any
    const parseResult = { css: '.title{}' }
    const styleParser = {
      parseStyle: vi.fn(async () => parseResult)
    }
    const transformResult = { code: '.title{}' }
    const styleTransformer = {
      transformStyle: vi.fn(async () => transformResult)
    }

    const results = await transformVueStyleBlocks(
      [{ content: '.title{}', lang: 'scss', scoped: true }],
      context,
      { styleParser, styleTransformer },
      { minify: true, sourcemap: false }
    )

    expect(styleParser.parseStyle).toHaveBeenCalledWith(
      '.title{}',
      'scss',
      '/project/src/pages/index.vue',
      {
        scoped: true,
        sourcemap: false,
        baseDir: '/project/src/pages'
      }
    )
    expect(styleTransformer.transformStyle).toHaveBeenCalledWith(
      parseResult,
      context,
      {
        scoped: true,
        minify: true
      }
    )
    expect(results).toEqual([transformResult])
  })

  it('解析并转换 JavaScript 导入样式文件', async () => {
    const tempRoot = join(process.cwd(), 'tests/temp/compiler-style-imports')
    const vueFile = join(tempRoot, 'src/pages/index.vue')
    const styleFile = join(tempRoot, 'src/styles/theme.scss')
    await fs.rm(tempRoot, { recursive: true, force: true })
    await fs.mkdir(dirname(styleFile), { recursive: true })
    await fs.writeFile(styleFile, '.theme{}')

    const context = {
      filename: vueFile,
      styleImports: ['../styles/theme.scss']
    } as any
    const parseResult = { css: '.theme{}' }
    const styleParser = {
      parseStyle: vi.fn(async () => parseResult)
    }
    const transformResult = { code: '.theme{}' }
    const styleTransformer = {
      transformStyle: vi.fn(async () => transformResult)
    }

    const results = await transformImportedStyleFiles(
      context.styleImports,
      context,
      { styleParser, styleTransformer },
      { minify: false, sourcemap: true }
    )

    expect(styleParser.parseStyle).toHaveBeenCalledWith(
      '.theme{}',
      'scss',
      styleFile,
      {
        scoped: false,
        sourcemap: true,
        baseDir: dirname(styleFile)
      }
    )
    expect(styleTransformer.transformStyle).toHaveBeenCalledWith(
      parseResult,
      context,
      {
        scoped: false,
        minify: false,
        sourcemap: true
      }
    )
    expect(results).toEqual([transformResult])
  })
})
