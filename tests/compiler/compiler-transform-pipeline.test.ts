import { describe, expect, it, vi } from 'vitest'
import { parseAndTransformSfcSections } from '@/compiler/compiler-transform-pipeline.js'
import { createInitialTransformContext } from '@/compiler/transform-context.js'

describe('compiler transform pipeline', () => {
  it('按脚本、模板和样式顺序解析转换并合并上下文', async () => {
    const context = createInitialTransformContext('/project/src/pages/index.vue', true)
    const scriptParseResult = { ast: 'script-ast' }
    const scriptContext = createInitialTransformContext('/project/src/pages/index.vue', true)
    scriptContext.data.count = 0
    scriptContext.lifecycle.onReady = 'this.init()'
    const scriptTransformResult = { code: 'script', context: scriptContext }
    const templateParseResult = { ast: 'template-ast' }
    const templateTransformResult = {
      wxml: '<view />',
      components: new Set(),
      eventHandlers: new Map()
    }
    const styleParseResult = { css: '.page{}' }
    const styleTransformResult = { code: '.page{}' }
    const dependencies = {
      scriptParser: { parseScript: vi.fn(async () => scriptParseResult) },
      scriptTransformer: { transformScript: vi.fn(async () => scriptTransformResult) },
      templateParser: { parseTemplate: vi.fn(async () => templateParseResult) },
      templateTransformer: {
        transformTemplate: vi.fn(async () => {
          context.templateUnsupported = { unsupported: true }
          return templateTransformResult
        })
      },
      styleParser: { parseStyle: vi.fn(async () => styleParseResult) },
      styleTransformer: { transformStyle: vi.fn(async () => styleTransformResult) }
    }

    const result = await parseAndTransformSfcSections(
      {
        filename: context.filename,
        descriptor: {} as any,
        script: { content: 'const count = ref(0)' },
        template: { content: '<view />' },
        styles: [{ content: '.page{}', lang: 'scss', scoped: true }],
        customBlocks: []
      } as any,
      context,
      dependencies,
      { minify: true, sourcemap: false }
    )

    expect(dependencies.scriptParser.parseScript).toHaveBeenCalledWith(
      'const count = ref(0)',
      context.filename
    )
    expect(dependencies.scriptTransformer.transformScript).toHaveBeenCalledWith(
      scriptParseResult,
      context.filename,
      context.isPage
    )
    expect(context.data).toHaveProperty('count', 0)
    expect(context.lifecycle.onReady).toBe('this.init()')
    expect(dependencies.templateParser.parseTemplate).toHaveBeenCalledWith('<view />', context.filename)
    expect(dependencies.templateTransformer.transformTemplate).toHaveBeenCalledWith(templateParseResult, context)
    expect(result.script.context.templateUnsupported).toEqual({ unsupported: true })
    expect(dependencies.styleParser.parseStyle).toHaveBeenCalledWith(
      '.page{}',
      'scss',
      context.filename,
      {
        scoped: true,
        sourcemap: false,
        baseDir: '/project/src/pages'
      }
    )
    expect(dependencies.styleTransformer.transformStyle).toHaveBeenCalledWith(
      styleParseResult,
      context,
      {
        scoped: true,
        minify: true
      }
    )
    expect(result).toMatchObject({
      script: scriptTransformResult,
      template: templateTransformResult,
      styles: [styleTransformResult]
    })
  })

  it('缺少 script/template 时仍返回空样式数组', async () => {
    const context = createInitialTransformContext('/project/src/components/Empty.vue', false)
    const dependencies = {
      scriptParser: { parseScript: vi.fn() },
      scriptTransformer: { transformScript: vi.fn() },
      templateParser: { parseTemplate: vi.fn() },
      templateTransformer: { transformTemplate: vi.fn() },
      styleParser: { parseStyle: vi.fn() },
      styleTransformer: { transformStyle: vi.fn() }
    }

    const result = await parseAndTransformSfcSections(
      {
        filename: context.filename,
        descriptor: {} as any,
        styles: [],
        customBlocks: []
      } as any,
      context,
      dependencies,
      { minify: false, sourcemap: true }
    )

    expect(dependencies.scriptParser.parseScript).not.toHaveBeenCalled()
    expect(dependencies.templateParser.parseTemplate).not.toHaveBeenCalled()
    expect(result).toEqual({ styles: [] })
  })
})
