import { readFile } from 'node:fs/promises'
import { join } from 'node:path'
import { runInNewContext } from 'node:vm'
import { parse } from 'node-html-parser'
import { vi } from 'vitest'

export async function loadWeChatRegistration(output: string, path: string, register: 'Component' | 'Page') {
  const [js, wxml, runtime] = await Promise.all([
    readFile(join(output, path + '.js'), 'utf8'),
    readFile(join(output, path + '.wxml'), 'utf8'),
    readFile(join(output, 'runtime-injection.js'), 'utf8')
  ])
  const module = { exports: {} }
  runInNewContext(runtime, { module })
  const registration = vi.fn()
  runInNewContext(js, {
    [register]: registration,
    require(id: string) {
      if (!/^\.\.?\/.*runtime-injection\.js$/.test(id)) throw new Error(`Unexpected dependency: ${id}`)
      return module.exports
    }
  })
  if (registration.mock.calls.length !== 1) throw new Error(`Expected one ${register} registration`)
  const options = registration.mock.calls[0]![0]
  return { options, wxml, js, runtime }
}

export function createWeChatInstance(options: any, props: Record<string, unknown> = {}) {
  const properties = {
    ...Object.fromEntries(Object.entries<{ value: unknown }>(options.properties ?? {}).map(([key, prop]) => [key, prop.value])),
    ...props
  }
  const instance = {
    ...options,
    ...options.methods,
    data: { ...structuredClone(typeof options.data === 'function' ? options.data() : options.data), ...properties },
    properties,
    triggerEvent: vi.fn(),
    setData: vi.fn((patch: Record<string, unknown>) => {
      for (const [key, value] of Object.entries(patch)) {
        const parts = key.replace(/\[(\d+)\]/g, '.$1').split('.')
        const parent = parts.slice(0, -1).reduce((data, part) => data[part], instance.data)
        parent[parts.at(-1)!] = value
      }
    })
  }
  return instance
}

export function runWeChatLifecycle(instance: any, name: string, ...args: unknown[]) {
  return (instance.lifetimes?.[name] ?? instance[name])?.apply(instance, args)
}

export function dispatchWeChatEvent(instance: any, wxml: string, selector: string, type: string, detail?: unknown) {
  const element = parse(wxml).querySelector(selector)
  if (!element) throw new Error(`Missing event target: ${selector}`)
  const handler = ['bind:', 'catch:', 'capture-bind:', 'capture-catch:']
    .map(prefix => element.getAttribute(prefix + type)).find(Boolean)
  if (!handler) throw new Error(`Missing ${type} binding: ${selector}`)
  const dataset = Object.fromEntries(Object.entries(element.attributes).flatMap(([key, value]) => {
    if (!key.startsWith('data-')) return []
    const expression = value.match(/^\{\{\s*([\w$.]+)\s*\}\}$/)
    const evaluated = expression ? expression[1]!.split('.').reduce((data, part) => data?.[part], instance.data) : value
    return [[key.slice(5).replace(/-([a-z])/g, (_, letter: string) => letter.toUpperCase()), evaluated]]
  }))
  return instance[handler]({ type, currentTarget: { dataset }, detail })
}
