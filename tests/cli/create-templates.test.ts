import { describe, expect, it } from 'vitest'
import { getProjectTemplate } from '@/cli/commands/create-templates.js'

describe('create templates', () => {
  it('生成 TypeScript + SCSS 基础模板', () => {
    const template = getProjectTemplate('basic', { typescript: true, scss: true })

    expect(template.name).toBe('basic')
    expect(template.features).toEqual(['Vue3', 'Composition API', 'TypeScript', 'SCSS'])
    expect(Object.keys(template.files)).toEqual(expect.arrayContaining([
      'package.json',
      'src/app.vue',
      'src/pages/index/index.vue',
      'src/components/HelloWorld.vue',
      'vue3mp.config.js',
      'tsconfig.json'
    ]))
    expect(template.files['src/pages/index/index.vue']).toContain('<script setup lang="ts">')
    expect(template.files['src/pages/index/index.vue']).toContain('<style lang="scss" scoped>')
  })

  it('高级和电商模板继承基础模板文件并追加业务文件', () => {
    const advanced = getProjectTemplate('advanced', { typescript: false, scss: false })
    const ecommerce = getProjectTemplate('ecommerce', { typescript: false, scss: false })

    expect(advanced.files).toHaveProperty('src/store/index.ts')
    expect(advanced.files).toHaveProperty('src/utils/request.ts')
    expect(advanced.files).toHaveProperty('src/pages/profile/index.vue')
    expect(ecommerce.files).toHaveProperty('src/pages/products/index.vue')
    expect(ecommerce.files).toHaveProperty('src/pages/cart/index.vue')
    expect(ecommerce.files).toHaveProperty('src/components/ProductCard.vue')
  })

  it('未知模板名抛出明确错误', () => {
    expect(() => getProjectTemplate('unknown', { typescript: false, scss: false }))
      .toThrow('未知的模板: unknown')
  })
})
