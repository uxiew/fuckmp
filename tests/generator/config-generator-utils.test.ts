import { describe, expect, it } from 'vitest'
import {
  buildAppConfig,
  buildComponentConfig,
  buildPageConfig,
  buildProjectConfig,
  buildSitemapConfig,
  buildSubpackages,
  buildTSConfig,
  getPageTitle,
  selectTabBarPages
} from '@/generator/config-generator-utils.js'

describe('config-generator utils', () => {
  it('根据用户 app 配置构造 app.json', () => {
    const appConfig = buildAppConfig(
      ['pages/index/index', 'pages/profile', 'pages/settings', 'admin/dashboard'],
      {
        window: {
          navigationBarTitleText: '自定义标题'
        },
        tabBar: {
          color: '#111111',
          list: [
            {
              pagePath: 'pages/profile',
              text: '我的',
              iconPath: 'icons/profile.png'
            },
            {
              pagePath: 'pages/settings',
              text: '设置'
            },
            { pagePath: 'admin/dashboard', text: '分包' },
            { pagePath: 'pages/missing', text: '缺失' },
            { pagePath: 'pages/profile', text: '重复' }
          ]
        }
      } as any,
      {
        navigationBarBackgroundColor: '#ffffff',
        navigationBarTextStyle: 'black',
        navigationBarTitleText: '默认标题'
      },
      { index: '首页' }
    )

    expect(appConfig.window.navigationBarTitleText).toBe('自定义标题')
    expect(appConfig.tabBar?.list).toEqual([
      {
        pagePath: 'pages/profile',
        text: '我的',
        iconPath: 'icons/profile.png'
      },
      {
        pagePath: 'pages/settings',
        text: '设置'
      }
    ])
    expect(appConfig.subpackages).toEqual([
      {
        root: 'admin',
        pages: ['dashboard']
      }
    ])
  })

  it('选择 tabBar 页面并生成分包配置', () => {
    const pages = ['pages/index/index', 'pages/about', 'package-a/detail', 'package-a/list']

    expect(selectTabBarPages(pages, undefined)).toEqual([])
    expect(selectTabBarPages(pages, {
      tabBar: {
        list: [
          { pagePath: 'pages/about', text: '关于' },
          { pagePath: 'missing/page', text: '缺失' }
        ]
      }
    } as any)).toEqual(['pages/about'])
    expect(buildSubpackages(pages)).toEqual([
      {
        root: 'package-a',
        pages: ['detail', 'list']
      }
    ])
  })

  it('省略仅指定样式或过滤后不足两个页面的 tabBar', () => {
    const pages = ['pages/index/index', 'pages/profile']
    expect(buildAppConfig(pages, { tabBar: { color: '#111111' } }, {})).not.toHaveProperty('tabBar')
    expect(buildAppConfig(pages, {
      tabBar: { list: [{ pagePath: 'pages/profile' }, { pagePath: 'missing/page' }] }
    }, {})).not.toHaveProperty('tabBar')
  })

  it('构造页面与组件配置', () => {
    expect(getPageTitle('pages/user/profile', { profile: '个人资料' })).toBe('个人资料')
    expect(buildPageConfig('pages/user/profile', { profile: '个人资料' }, {
      enablePullDownRefresh: true
    })).toEqual({
      navigationBarTitleText: '个人资料',
      enablePullDownRefresh: true,
      onReachBottomDistance: 50
    })
    expect(buildComponentConfig({ styleIsolation: 'shared' }, { 'x-card': './card' }, {
      pureDataPattern: /^_/
    })).toEqual({
      component: true,
      usingComponents: { 'x-card': './card' },
      styleIsolation: 'shared',
      pureDataPattern: /^_/
    })
  })

  it('构造项目、sitemap 与 TypeScript 配置', () => {
    expect(buildProjectConfig('touristappid', {
      projectname: 'demo',
      libVersion: '3.0.0'
    }).projectname).toBe('demo')
    expect(buildProjectConfig('touristappid', {}).appid).toBe('touristappid')
    expect(buildSitemapConfig()).toEqual({
      desc: 'sitemap 配置文件',
      rules: [
        {
          action: 'allow',
          page: '*'
        }
      ]
    })
    expect(buildTSConfig().compilerOptions.types).toEqual(['miniprogram-api-typings'])
  })
})
