import { afterEach, describe, expect, it, vi } from 'vitest'
import { promises as fs } from 'fs'
import { join } from 'path'
import { refreshProjectOutputFiles } from '@/compiler/compiler-project-output-utils.js'

const tempRoot = join(process.cwd(), 'tests/temp/compiler-project-output-utils')

describe('compiler project output utils', () => {
  afterEach(async () => {
    vi.restoreAllMocks()
    await fs.rm(tempRoot, { recursive: true, force: true })
  })

  it('刷新项目级输出并为运行时注入提供页面和组件记录', async () => {
    const inputRoot = join(tempRoot, 'src')
    const outputRoot = join(tempRoot, 'dist')
    const pagePath = join(inputRoot, 'pages/index.vue')
    const componentPath = join(inputRoot, 'components/Card.vue')
    const sourceFiles = new Map([[pagePath, '<template />']])
    const compiledPages = new Map([[pagePath, { config: { page: true }, context: { isPage: true } }]])
    const compiledComponents = new Map([[componentPath, { config: { component: true }, context: { isPage: false } }]])
    const appConfig = { config: { app: true } }
    const configGenerator = createConfigGenerator()
    const runtimeInjector = createRuntimeInjector()

    await refreshProjectOutputFiles({
      inputRoot,
      outputRoot,
      sourceFiles,
      appConfig,
      compiledPages,
      compiledComponents,
      configGenerator,
      runtimeInjector,
      typescript: true
    })

    expect(configGenerator.generateAppConfig).toHaveBeenCalledWith(['pages/index'], outputRoot)
    expect(runtimeInjector.injectRuntime).toHaveBeenCalledWith(
      sourceFiles,
      outputRoot,
      appConfig,
      expect.any(Map),
      expect.any(Map)
    )
    const runtimeCall = runtimeInjector.injectRuntime.mock.calls[0]
    expect([...runtimeCall[3].keys()]).toEqual(['pages/index'])
    expect([...runtimeCall[4].keys()]).toEqual(['components/Card'])
    expect(configGenerator.generateProjectConfig).toHaveBeenCalledWith(outputRoot)
    expect(configGenerator.generateSitemapConfig).toHaveBeenCalledWith(outputRoot)
    expect(configGenerator.generateTSConfig).toHaveBeenCalledWith(outputRoot)
    await expect(fs.readFile(join(outputRoot, 'app.wxss'), 'utf8')).resolves.toContain('Vue3 微信小程序编译器')
  })

  it('刷新项目级输出时复制根级静态资源目录', async () => {
    const inputRoot = join(tempRoot, 'src')
    const outputRoot = join(tempRoot, 'dist')
    const configGenerator = createConfigGenerator()
    const runtimeInjector = createRuntimeInjector()

    await fs.mkdir(join(inputRoot, 'images'), { recursive: true })
    await fs.mkdir(join(inputRoot, 'static/map'), { recursive: true })
    await fs.writeFile(join(inputRoot, 'images/component.png'), 'png')
    await fs.writeFile(join(inputRoot, 'static/map/amap-wx.js'), 'sdk')
    await fs.mkdir(join(outputRoot, 'images'), { recursive: true })
    await fs.writeFile(join(outputRoot, 'images/stale.png'), 'stale')

    await refreshProjectOutputFiles({
      inputRoot,
      outputRoot,
      sourceFiles: new Map(),
      appConfig: {},
      compiledPages: new Map(),
      compiledComponents: new Map(),
      configGenerator,
      runtimeInjector,
      typescript: false
    })

    await expect(fs.readFile(join(outputRoot, 'images/component.png'), 'utf8')).resolves.toBe('png')
    await expect(fs.readFile(join(outputRoot, 'static/map/amap-wx.js'), 'utf8')).resolves.toBe('sdk')
    await expect(fs.access(join(outputRoot, 'images/stale.png'))).rejects.toThrow()
  })

  it('运行时注入失败时仍继续生成项目配置', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => {})

    const inputRoot = join(tempRoot, 'src')
    const outputRoot = join(tempRoot, 'dist')
    const pagePath = join(inputRoot, 'pages/index.vue')
    const configGenerator = createConfigGenerator()
    const runtimeInjector = createRuntimeInjector()
    runtimeInjector.injectRuntime.mockRejectedValueOnce(new Error('inject failed'))

    await expect(refreshProjectOutputFiles({
      inputRoot,
      outputRoot,
      sourceFiles: new Map(),
      appConfig: {},
      compiledPages: new Map([[pagePath, { config: {}, context: { isPage: true } }]]),
      compiledComponents: new Map(),
      configGenerator,
      runtimeInjector,
      typescript: false
    })).resolves.toBeUndefined()

    expect(configGenerator.generateProjectConfig).toHaveBeenCalledWith(outputRoot)
    expect(configGenerator.generateSitemapConfig).toHaveBeenCalledWith(outputRoot)
    expect(configGenerator.generateTSConfig).not.toHaveBeenCalled()
  })
})

function createConfigGenerator() {
  return {
    generateAppConfig: vi.fn().mockResolvedValue(undefined),
    generateProjectConfig: vi.fn().mockResolvedValue(undefined),
    generateSitemapConfig: vi.fn().mockResolvedValue(undefined),
    generateTSConfig: vi.fn().mockResolvedValue(undefined)
  }
}

function createRuntimeInjector() {
  return {
    injectRuntime: vi.fn().mockResolvedValue(undefined)
  }
}
