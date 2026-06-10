import { describe, expect, it } from 'vitest'
import {
  buildProjectConfig,
  buildSitemapConfig,
  buildTSConfig
} from '@/generator/config-file-generator-utils.js'
import {
  buildProjectConfig as publicBuildProjectConfig,
  buildSitemapConfig as publicBuildSitemapConfig,
  buildTSConfig as publicBuildTSConfig
} from '@/generator/config-generator-utils.js'

describe('config file generator utils', () => {
  it('继续通过 config-generator-utils 旧入口导出静态配置构造函数', () => {
    expect(publicBuildProjectConfig).toBe(buildProjectConfig)
    expect(publicBuildSitemapConfig).toBe(buildSitemapConfig)
    expect(publicBuildTSConfig).toBe(buildTSConfig)
  })

  it('构造 project.config.json 并保留用户项目配置覆盖点', () => {
    const config = buildProjectConfig('touristappid', {
      description: '自定义描述',
      compileType: 'plugin',
      libVersion: '3.0.0',
      projectname: 'demo-project'
    })

    expect(config.description).toBe('自定义描述')
    expect(config.compileType).toBe('plugin')
    expect(config.libVersion).toBe('3.0.0')
    expect(config.appid).toBe('touristappid')
    expect(config.projectname).toBe('demo-project')
    expect(config.packOptions.ignore).toContainEqual({ type: 'file', value: '.gitignore' })
    expect(config.setting).toMatchObject({
      urlCheck: false,
      es6: true,
      minified: true,
      useMultiFrameRuntime: true
    })
    expect(config.condition.miniprogram.list).toEqual([])
  })

  it('构造 sitemap.json 和小程序 TypeScript 配置', () => {
    expect(buildSitemapConfig()).toEqual({
      desc: 'sitemap 配置文件',
      rules: [
        {
          action: 'allow',
          page: '*'
        }
      ]
    })

    expect(buildTSConfig()).toEqual({
      compilerOptions: expect.objectContaining({
        target: 'ES2018',
        lib: ['ES2018'],
        allowJs: true,
        strict: true,
        types: ['miniprogram-api-typings'],
        paths: {
          '*': ['./typings/*']
        }
      }),
      include: ['./**/*.ts'],
      exclude: ['node_modules']
    })
  })
})
