import { describe, expect, it, vi } from 'vitest'
import { generateTargetCode } from '@/compiler/compiler-generate-utils.js'

describe('compiler generate utils', () => {
  it('页面上下文调用 page generator 并保留 styles fallback', async () => {
    const pageResult = { js: 'page' }
    const pageGenerator = { generatePage: vi.fn().mockResolvedValue(pageResult) }
    const componentGenerator = { generateComponent: vi.fn() }
    const context = { isPage: true }
    const results = { script: { a: 1 }, template: { b: 2 } }

    await expect(generateTargetCode(results, context as any, {
      pageGenerator: pageGenerator as any,
      componentGenerator: componentGenerator as any
    })).resolves.toBe(pageResult)

    expect(pageGenerator.generatePage).toHaveBeenCalledWith(results.script, results.template, [], context)
    expect(componentGenerator.generateComponent).not.toHaveBeenCalled()
  })

  it('非页面上下文调用 component generator 并透传 styles', async () => {
    const componentResult = { js: 'component' }
    const pageGenerator = { generatePage: vi.fn() }
    const componentGenerator = { generateComponent: vi.fn().mockResolvedValue(componentResult) }
    const context = { isPage: false }
    const results = { script: { a: 1 }, template: { b: 2 }, styles: [{ css: '.a{}' }] }

    await expect(generateTargetCode(results, context as any, {
      pageGenerator: pageGenerator as any,
      componentGenerator: componentGenerator as any
    })).resolves.toBe(componentResult)

    expect(componentGenerator.generateComponent).toHaveBeenCalledWith(results.script, results.template, results.styles, context)
    expect(pageGenerator.generatePage).not.toHaveBeenCalled()
  })
})
