import { parse as parseScript } from '@babel/parser'
import glob from 'fast-glob'
import { valid as validMarkup } from 'node-html-parser'
import { mkdtemp, readFile, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { dirname, join, relative, resolve, sep } from 'node:path'
import { runInNewContext } from 'node:vm'
import { parse as parseStylesheet } from 'postcss'
import { expect, it, vi } from 'vitest'
import { Vue3MiniprogramCompiler } from '@/compiler/compiler.js'

it.each(['real-miniprogram', 'community-pickup'])('%s 项目输出符合原生静态契约', async (example) => {
  const output = await mkdtemp(join(tmpdir(), 'fuckmp-native-'))
  const read = (file: string) => readFile(join(output, file), 'utf8')
  try {
    const compiler = new Vue3MiniprogramCompiler({
      input: join(process.cwd(), 'examples', example),
      output,
      appId: 'touristappid',
    })
    const result = await compiler.compile()
    expect(result.errors).toEqual([])
    expect(result.stats.failed).toBe(0)

    const files = new Set(await glob('**/*', { cwd: output, onlyFiles: true }))
    const app = JSON.parse(await read('app.json'))
    expect(app.pages.length).toBeGreaterThan(0)
    expect(files.has(app.sitemapLocation)).toBe(true)
    expect(JSON.parse(await read('project.config.json'))).toMatchObject({
      appid: 'touristappid',
      compileType: 'miniprogram',
    })
    await expectRegistration('app.js', 'App')
    for (const page of app.pages) {
      expectNativeFiles(page)
      await expectRegistration(`${page}.js`, 'Page')
    }

    for (const file of files) {
      if (file.endsWith('.js')) {
        const source = await read(file)
        expect(() => parseScript(source, { sourceType: 'script' }), file).not.toThrow()
        expect(source, file).not.toMatch(/\b(?:document|window)\s*\.|\b(?:createVNode|createRenderer|createElementVNode|setDataContext)\b|\b(?:function\s+(?:watch|watchEffect|provide|inject)\s*\(|setInterval\(checkChanges)/)
        for (const match of source.matchAll(/\brequire\(['"]([^'"]+)['"]\)/g)) {
          expect(match[1], file).toMatch(/^\.{1,2}\//)
          expect(files.has(localPath(file, match[1]!)), file).toBe(true)
        }
      } else if (file.endsWith('.wxml')) {
        const source = await read(file)
        expect(validMarkup(source), file).toBe(true)
        for (const match of source.matchAll(/<wxs\b[^>]*\bsrc="([^"]+)"/g)) {
          expect(files.has(localPath(file, match[1]!)), file).toBe(true)
        }
      } else if (file.endsWith('.wxss')) {
        const source = await read(file)
        expect(() => parseStylesheet(source, { from: file }), file).not.toThrow()
      } else if (file.endsWith('.json')) {
        const config = JSON.parse(await read(file))
        for (const component of Object.values<string>(config.usingComponents ?? {})) {
          const target = localPath(file, component)
          expectNativeFiles(target)
          expect(JSON.parse(await read(`${target}.json`)).component).toBe(true)
          await expectRegistration(`${target}.js`, 'Component')
        }
      }
    }

    if (example === 'community-pickup') {
      expect(app.pages).toEqual(['pages/booking', 'pages/pickup-info'])
      expect(app.tabBar).toBeUndefined()
      const markup = await read('pages/booking.wxml')
      expect(markup).toContain('url="/pages/pickup-info"')
      expect(markup).toContain('wx:for="{{offers}}"')
      expect(markup).toContain('wx:key="id"')
      expect(markup).toContain('wx:if="{{reserved}}"')
      expect(markup).toContain('wx:else')
      expect(markup).toContain('bind:reserve="reserveOffer"')
      expect(await read('components/PickupOffer.wxml')).toContain('bind:tap="reserve"')
      const scope = markup.match(/<view class="pickup-page" (data-v-[\w-]+)/)?.[1]
      expect(scope).toBeTruthy()
      const styles = parseStylesheet(await read('pages/booking.wxss'))
      expect(styles.first).toMatchObject({ selector: `.pickup-page[${scope}]` })

      const component = vi.fn()
      const page = vi.fn()
      const runtime = { exports: {} }
      runInNewContext(await read('runtime-injection.js'), { module: runtime })
      runInNewContext(await read('components/PickupOffer.js'), {
        Component: component, require: () => runtime.exports,
      })
      runInNewContext(await read('pages/booking.js'), {
        Page: page, require: () => runtime.exports,
      })
      const options = page.mock.calls[0]![0]
      expect(JSON.parse(JSON.stringify(options.data))).toEqual({
        offers: [
          { id: 'vegetables', name: '时令蔬菜包' },
          { id: 'fruit', name: '当季水果包' },
        ],
        reserved: 0,
      })
      const instance = { ...options, setData: vi.fn() }
      instance.onLoad()
      component.mock.calls[0]![0].methods.reserve.call({
        triggerEvent: (name: string) => {
          expect(name).toBe('reserve')
          instance.reserveOffer()
        },
      })
      expect(instance.setData).toHaveBeenCalledWith({ reserved: 1 })
    }

    function expectNativeFiles(base: string) {
      for (const ext of ['js', 'json', 'wxml', 'wxss']) {
        expect(files.has(`${base}.${ext}`), base).toBe(true)
      }
    }

    async function expectRegistration(file: string, api: string) {
      expect(await read(file)).toMatch(new RegExp(`^\\s*${api}\\(`, 'm'))
    }

    function localPath(from: string, to: string) {
      return relative(output, to.startsWith('/')
        ? resolve(output, `.${to}`)
        : resolve(output, dirname(from), to)).split(sep).join('/')
    }
  } finally {
    await rm(output, { recursive: true, force: true })
  }
})
