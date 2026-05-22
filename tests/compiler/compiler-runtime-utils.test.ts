import { describe, expect, it } from 'vitest'
import { join } from 'path'
import {
  buildRuntimeInjectionEntries,
  collectCompiledRuntimeRecord
} from '@/compiler/compiler-runtime-utils.js'
import type { TransformContext } from '@/types/index.js'
import type { TemplateTransformResult } from '@/transformer/index.js'

describe('compiler runtime utils', () => {
  const templateResult: TemplateTransformResult = {
    wxml: '<view />',
    components: new Set(),
    eventHandlers: new Map()
  }

  it('将绝对路径编译记录转换为运行时注入相对路径记录', () => {
    const inputRoot = join(process.cwd(), 'examples/app')
    const context = { filename: join(inputRoot, 'pages/index.vue') } as TransformContext
    const records = new Map([
      [context.filename, { config: { usingComponents: {} }, context, template: templateResult }]
    ])

    const entries = buildRuntimeInjectionEntries(records, inputRoot)

    expect(entries.get('pages/index')).toMatchObject({
      config: { usingComponents: {} },
      context
    })
    expect(entries.get('pages/index')?.template).toBe(templateResult)
  })

  it('按 app/page/component 类型收集编译记录并替换旧记录', () => {
    const inputRoot = join(process.cwd(), 'examples/app')
    const compiledPages = new Map<string, any>([
      [join(inputRoot, 'pages/index.vue'), { config: { stale: true } }]
    ])
    const compiledComponents = new Map<string, any>()
    let appConfig: any = {}

    appConfig = collectCompiledRuntimeRecord({
      filePath: join(inputRoot, 'app.vue'),
      context: { filename: join(inputRoot, 'app.vue'), isPage: false } as TransformContext,
      generateResult: { json: { app: true } },
      template: templateResult,
      currentAppConfig: appConfig,
      compiledPages,
      compiledComponents
    })

    collectCompiledRuntimeRecord({
      filePath: join(inputRoot, 'pages/index.vue'),
      context: { filename: join(inputRoot, 'pages/index.vue'), isPage: true } as TransformContext,
      generateResult: { json: { page: true } },
      template: templateResult,
      currentAppConfig: appConfig,
      compiledPages,
      compiledComponents
    })

    collectCompiledRuntimeRecord({
      filePath: join(inputRoot, 'components/Card.vue'),
      context: { filename: join(inputRoot, 'components/Card.vue'), isPage: false } as TransformContext,
      generateResult: { json: { component: true } },
      template: templateResult,
      currentAppConfig: appConfig,
      compiledPages,
      compiledComponents
    })

    expect(appConfig.config).toEqual({ app: true })
    expect(compiledPages.get(join(inputRoot, 'pages/index.vue'))?.config).toEqual({ page: true })
    expect(compiledComponents.get(join(inputRoot, 'components/Card.vue'))?.config).toEqual({ component: true })
  })
})
