import { describe, expect, it } from 'vitest'
import { parse } from '@babel/parser'
import { mkdtemp, mkdir, readFile, rm, stat, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { dirname, join } from 'node:path'
import { getProjectTemplate } from '@/cli/commands/create-templates.js'
import { createBasicTemplateFiles } from '@/cli/commands/create-basic-template-files.js'
import { createAdvancedTemplateFiles, createEcommerceTemplateFiles } from '@/cli/commands/create-business-template-files.js'
import { Vue3MiniprogramCompiler } from '@/compiler/compiler.js'

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

  it('基础模板文件生成器按特性切换脚本和样式扩展', () => {
    const files = createBasicTemplateFiles({ typescript: false, scss: true })
    const packageJson = JSON.parse(files['package.json'] || '{}')

    expect(files).not.toHaveProperty('tsconfig.json')
    expect(files['src/pages/index/index.vue']).toContain('<script setup lang="js">')
    expect(files['src/pages/index/index.vue']).toContain('<style lang="scss" scoped>')
    expect(packageJson.scripts).toEqual({
      dev: 'fuckmp build --watch',
      build: 'fuckmp build',
      'build:prod': 'fuckmp build --minify'
    })
    expect(packageJson.devDependencies).toEqual(expect.objectContaining({
      fuckmp: '^1.0.0',
      sass: '^1.69.0'
    }))
    expect(packageJson.devDependencies).not.toHaveProperty('@vue3-miniprogram/compiler')
  })

  it('业务模板文件生成器只追加对应业务文件', () => {
    const advancedFiles = createAdvancedTemplateFiles()
    const ecommerceFiles = createEcommerceTemplateFiles()

    expect(Object.keys(advancedFiles).sort()).toEqual([
      'src/pages/profile/index.vue',
      'src/store/index.ts',
      'src/utils/request.ts'
    ])
    expect(Object.keys(ecommerceFiles).sort()).toEqual([
      'src/components/ProductCard.vue',
      'src/pages/cart/index.vue',
      'src/pages/products/index.vue'
    ])
  })

  it('基础模板写入临时项目后可被当前编译器编译', async () => {
    const projectRoot = await mkdtemp(join(tmpdir(), 'fuckmp-create-template-'))

    try {
      await writeTemplateProject(projectRoot, createBasicTemplateFiles({ typescript: true, scss: true }))

      const outputRoot = join(projectRoot, 'dist')
      const compiler = new Vue3MiniprogramCompiler({
        input: join(projectRoot, 'src'),
        output: outputRoot,
        appId: 'test-app-id',
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
      expect(result.stats.failed).toBe(0)
      expect(result.stats.success).toBe(3)

      await expectFilesExist(outputRoot, [
        'app.js',
        'app.json',
        'app.wxss',
        'pages/index/index.js',
        'pages/index/index.json',
        'pages/index/index.wxml',
        'pages/index/index.wxss',
        'components/HelloWorld.js',
        'components/HelloWorld.json',
        'components/HelloWorld.wxml',
        'components/HelloWorld.wxss',
        'runtime-injection.js'
      ])

      const appJson = JSON.parse(await readFile(join(outputRoot, 'app.json'), 'utf8'))
      expect(appJson.pages).toEqual(['pages/index/index'])

      const pageWxml = await readFile(join(outputRoot, 'pages/index/index.wxml'), 'utf8')
      expect(pageWxml).toContain('<hello-world')
      expect(pageWxml).toContain('msg="{{message}}"')

      for (const jsFile of [
        'app.js',
        'pages/index/index.js',
        'components/HelloWorld.js',
        'runtime-injection.js'
      ]) {
        await parseJavaScriptFile(outputRoot, jsFile)
      }
    } finally {
      await rm(projectRoot, { recursive: true, force: true })
    }
  })
})

async function writeTemplateProject(projectRoot: string, files: Record<string, string>): Promise<void> {
  for (const [filePath, content] of Object.entries(files)) {
    const targetPath = join(projectRoot, filePath)
    await mkdir(dirname(targetPath), { recursive: true })
    await writeFile(targetPath, content.replace(/{{PROJECT_NAME}}/g, 'template-smoke'), 'utf8')
  }
}

async function expectFilesExist(root: string, files: string[]): Promise<void> {
  for (const file of files) {
    await expect(stat(join(root, file)), file).resolves.toBeTruthy()
  }
}

async function parseJavaScriptFile(root: string, file: string): Promise<void> {
  parse(await readFile(join(root, file), 'utf8'), { sourceType: 'script' })
}
