import { describe, expect, it } from 'vitest'
import {
  createImportedStyleParseOptions,
  createImportedStyleTransformOptions,
  createVueStyleParseOptions,
  createVueStyleTransformOptions,
  inferStyleLanguage
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
})
