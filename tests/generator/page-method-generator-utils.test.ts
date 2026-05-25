import { describe, expect, it } from 'vitest'
import { generatePageMethodsCode } from '@/generator/page-method-generator-utils.js'
import { generatePageMethodsCode as publicGeneratePageMethodsCode } from '@/generator/page-generator-utils.js'

describe('page method generator utils', () => {
  it('继续通过 page-generator-utils 旧入口导出页面 methods helper', () => {
    expect(publicGeneratePageMethodsCode).toBe(generatePageMethodsCode)
  })

  it('生成对象 body、箭头表达式、字符串 body 和函数 methods', () => {
    function submit(value: string) {
      return value.trim()
    }

    const methods = generatePageMethodsCode({
      inc: { body: '(step) => { this.count += step }' },
      label: { body: '() => count + 1' },
      raw: 'console.log("ok")',
      submit,
      fallback: undefined
    })

    expect(methods).toContain(`  inc(step) {
    this.count += step
  }`)
    expect(methods).toContain(`  label() {
    return count + 1
  }`)
    expect(methods).toContain(`  raw() {
    console.log("ok")
  }`)
    expect(methods).toContain('  submit(value) {')
    expect(methods).toContain('return value.trim()')
    expect(methods).toContain(`  fallback() {
    // 方法实现
  }`)
  })

  it('没有 methods 时返回空字符串', () => {
    expect(generatePageMethodsCode({})).toBe('')
  })
})
