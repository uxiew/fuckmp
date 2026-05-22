import { describe, expect, it } from 'vitest'
import { promises as fs } from 'fs'
import { join } from 'path'
import { UserConfigManager } from '@/config/user-config.js'

describe('UserConfigManager', () => {
  it('加载 CommonJS JavaScript 配置文件', async () => {
    const projectRoot = await createProjectRoot('commonjs')
    await writeProjectFile(projectRoot, 'vue3mp.config.js', `
module.exports = {
  app: {
    window: {
      navigationBarTitleText: 'JS 配置标题'
    }
  },
  pageTitles: {
    dashboard: '仪表盘'
  }
}
`)

    const config = new UserConfigManager().loadConfig(projectRoot)

    expect(config.app?.window?.navigationBarTitleText).toBe('JS 配置标题')
    expect(config.pageTitles?.dashboard).toBe('仪表盘')
  })

  it('加载 export default JavaScript 配置文件', async () => {
    const projectRoot = await createProjectRoot('esm')
    await writeProjectFile(projectRoot, 'vue3mp.config.js', `
export default {
  pages: {
    'pages/home': {
      navigationBarTitleText: '首页'
    }
  }
}
`)

    const config = new UserConfigManager().loadConfig(projectRoot)

    expect(config.pages?.['pages/home']?.navigationBarTitleText).toBe('首页')
  })

  it('加载 defineConfig 包裹的 JavaScript 配置文件', async () => {
    const projectRoot = await createProjectRoot('define-config')
    await writeProjectFile(projectRoot, 'vue3mp.config.js', `
export default defineConfig({
  app: {
    name: 'define-config-app'
  }
})
`)

    const config = new UserConfigManager().loadConfig(projectRoot)

    expect(config.app?.name).toBe('define-config-app')
  })

  it('JavaScript 配置优先于 JSON 配置', async () => {
    const projectRoot = await createProjectRoot('priority')
    await writeProjectFile(projectRoot, 'vue3mp.config.js', `
module.exports = {
  app: {
    name: 'from-js'
  }
}
`)
    await writeProjectFile(projectRoot, 'vue3mp.config.json', JSON.stringify({
      app: { name: 'from-json' }
    }))

    const config = new UserConfigManager().loadConfig(projectRoot)

    expect(config.app?.name).toBe('from-js')
  })

  it('跳过暂不支持的 TypeScript 配置并继续加载 JSON 配置', async () => {
    const projectRoot = await createProjectRoot('skip-ts')
    await writeProjectFile(projectRoot, 'vue3mp.config.ts', 'export default { app: { name: "from-ts" } }')
    await writeProjectFile(projectRoot, 'vue3mp.config.json', JSON.stringify({
      app: { name: 'from-json' }
    }))

    const config = new UserConfigManager().loadConfig(projectRoot)

    expect(config.app?.name).toBe('from-json')
  })

  it('重复加载不同项目时不会复用上一次配置', async () => {
    const firstProjectRoot = await createProjectRoot('reuse-first')
    const secondProjectRoot = await createProjectRoot('reuse-second')
    await writeProjectFile(firstProjectRoot, 'vue3mp.config.json', JSON.stringify({
      app: { name: 'first-project' }
    }))

    const manager = new UserConfigManager()
    manager.loadConfig(firstProjectRoot)
    const secondConfig = manager.loadConfig(secondProjectRoot)

    expect(secondConfig.app?.name).toBeUndefined()
    expect(secondConfig.app?.window?.navigationBarTitleText).toBe('Vue3 小程序')
  })
})

/**
 * 创建隔离的临时项目根目录。
 */
async function createProjectRoot(name: string): Promise<string> {
  const projectRoot = join(process.cwd(), 'tests/temp/user-config', name)
  await fs.rm(projectRoot, { recursive: true, force: true })
  await fs.mkdir(projectRoot, { recursive: true })

  return projectRoot
}

/**
 * 写入临时项目文件。
 */
async function writeProjectFile(projectRoot: string, filename: string, content: string): Promise<void> {
  await fs.writeFile(join(projectRoot, filename), content, 'utf-8')
}
