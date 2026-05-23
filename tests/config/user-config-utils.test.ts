import { describe, expect, it } from 'vitest'
import {
  createDefaultUserConfig,
  normalizeJavaScriptConfigSource,
  normalizeUserConfigExport
} from '@/config/user-config-utils.js'

describe('user-config utils', () => {
  it('归一化简单 export default 配置源码', () => {
    expect(normalizeJavaScriptConfigSource('  export default defineConfig({ app: { name: "demo" } })'))
      .toBe('module.exports = defineConfig({ app: { name: "demo" } })')
  })

  it('优先读取 default export 配置对象', () => {
    const config = normalizeUserConfigExport({
      default: {
        app: { name: 'default-app' }
      }
    })

    expect(config.app?.name).toBe('default-app')
  })

  it('非法配置导出归一为空对象', () => {
    expect(normalizeUserConfigExport(null)).toEqual({})
    expect(normalizeUserConfigExport('invalid')).toEqual({})
    expect(normalizeUserConfigExport([])).toEqual({})
  })

  it('每次创建独立默认配置对象并保留关键默认值', () => {
    const first = createDefaultUserConfig()
    const second = createDefaultUserConfig()

    expect(first).not.toBe(second)
    expect(first.app?.window?.navigationBarTitleText).toBe('Vue3 小程序')
    expect(first.project?.compileType).toBe('miniprogram')
    expect(first.pageTitles?.index).toBe('首页')

    first.app!.window!.navigationBarTitleText = 'mutated'
    expect(second.app?.window?.navigationBarTitleText).toBe('Vue3 小程序')
  })
})
