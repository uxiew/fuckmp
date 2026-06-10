import { describe, expect, it } from 'vitest'
import { applyUserConfigToJson, processComponentPaths } from '@/compiler/compiler-config-utils.js'
import { createPathResolver } from '@/utils/index.js'

const inputRoot = '/project/src'
const pathResolver = createPathResolver(inputRoot)

describe('compiler config utils', () => {
  it('合并页面用户配置并解析 usingComponents 路径', () => {
    const result = applyUserConfigToJson({
      inputPath: '/project/src/pages/home.vue',
      inputRoot,
      pathResolver,
      defaultConfig: {
        usingComponents: {},
        navigationBarTitleText: '默认标题',
      },
      userConfig: {
        pages: {
          'pages/home': {
            navigationBarTitleText: '首页',
            usingComponents: {
              'user-card': '@/components/UserCard',
            },
          },
        },
      },
    })

    expect(result).toEqual({
      navigationBarTitleText: '首页',
      usingComponents: {
        'user-card': '../components/UserCard',
      },
    })
  })

  it('合并组件用户配置并推断裸组件名路径', () => {
    const result = applyUserConfigToJson({
      inputPath: '/project/src/components/ProfileCard.vue',
      inputRoot,
      pathResolver,
      defaultConfig: {
        component: true,
      },
      userConfig: {
        components: {
          'components/ProfileCard': {
            component: true,
            usingComponents: {
              badge: 'Badge',
            },
            styleIsolation: 'apply-shared',
          },
        },
      },
    })

    expect(result).toEqual({
      component: true,
      styleIsolation: 'apply-shared',
      usingComponents: {
        badge: './Badge',
      },
    })
  })

  it('没有 usingComponents 时保持配置不变', () => {
    const config = { component: true }

    expect(
      processComponentPaths(config, '/project/src/components/ProfileCard.vue', pathResolver)
    ).toBe(config)
  })
})
