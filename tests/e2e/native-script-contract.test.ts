import { mkdtemp, mkdir, readFile, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { dirname, join } from 'node:path'
import { runInNewContext } from 'node:vm'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { Vue3MiniprogramCompiler } from '@/compiler/compiler.js'

describe('阶段一：脚本原生输出契约', () => {
  let root: string

  beforeEach(async () => {
    root = await mkdtemp(join(tmpdir(), 'fuckmp-native-script-'))
  })

  afterEach(async () => {
    await rm(root, { recursive: true, force: true })
  })

  async function compile(path: string, template: string, script: string) {
    const input = join(root, 'src')
    const output = join(root, 'out')
    const source = join(input, path + '.vue')
    await mkdir(dirname(source), { recursive: true })
    await writeFile(source, `<template>${template}</template>\n<script setup lang="ts">${script}</script>`)
    const compiler = new Vue3MiniprogramCompiler({ input, output, appId: 'touristappid' })
    const result = await compiler.compile()
    return { result, output }
  }

  async function readRegistration(output: string, path: string, register: 'Component' | 'Page') {
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
      require: (id: string) => {
        expect(id).toMatch(/^\.\.?\/.*runtime-injection\.js$/)
        return module.exports
      }
    })
    expect(registration).toHaveBeenCalledTimes(1)
    expect(js).not.toMatch(/\bdefine(?:Props|Model|Emits)\s*[(<]|from ['"]vue['"]|createApp\(|document\./)
    expect(runtime).not.toMatch(/createVNode|mountComponent|document\.|function (watch|provide|inject)\(/)
    return { options: registration.mock.calls[0]![0], wxml, js, runtime }
  }

  function createInstance(options: any, props: Record<string, unknown> = {}) {
    const instance = {
      ...options,
      ...options.methods,
      data: { ...(typeof options.data === 'function' ? options.data() : options.data), ...props },
      properties: props,
      triggerEvent: vi.fn(),
      setData(patch: Record<string, unknown>) {
        Object.assign(instance.data, patch)
      }
    }
    return instance
  }

  it('运行原生 Component 的 props 默认值、模型回写和重命名的 emit', async () => {
    const path = 'components/QuantityEditor'
    const { result, output } = await compile(path, '<view><button @tap="add">+</button>{{ quantity }}</view>', `
      const props = defineProps({
        step: Number,
        offsets: { type: Array, default: () => [-2, 1] },
        ready: Boolean
      })
      const quantity = defineModel('quantity', { type: Number, default: 2 })
      const notify = defineEmits<{ saved: [detail: { value: number }] }>()
      function add() {
        const step = props.step
        quantity.value += step
        quantity.value++
        const shadow = () => {
          const props = { step: 4 }
          const notify = (value) => value
          return notify(props.step)
        }
        notify('saved', { value: quantity.value, shadow: shadow() })
      }
    `)
    expect(result.errors).toEqual([])
    const { options, wxml, js, runtime } = await readRegistration(output, path, 'Component')
    expect(options.properties.step.type.name).toBe('Number')
    expect(options.properties.step.value).toBe(0)
    expect(options.properties.ready.type.name).toBe('Boolean')
    expect(options.properties.offsets.value).toEqual([-2, 1])
    expect(options.properties.quantity.type.name).toBe('Number')
    expect(options.properties.quantity.value).toBe(2)
    expect(wxml).toContain('bind:tap="add"')
    expect(wxml).toMatch(/{{\s*quantity\s*}}/)
    expect(js).not.toContain('quantity.value')
    expect(js).toContain('return notify(props.step)')
    expect(runtime).not.toContain('function ref(')
    expect(Object.keys(typeof options.data === 'function' ? options.data() : options.data)).toEqual([])

    const instance = createInstance(options, { step: 3, quantity: 2 })
    options.methods.add.call(instance)
    expect(instance.data.quantity).toBe(6)
    expect(instance.triggerEvent.mock.calls).toEqual([
      ['update:quantity', 5],
      ['update:quantity', 6],
      ['saved', { value: 6, shadow: 4 }]
    ])
  })

  it('把导入别名及两次同文件 composable 调用编译为隔离的原生 Page 状态', async () => {
    const path = 'pages/index/index'
    const { result, output } = await compile(path, `
      <view><button @tap="incrementFirst">+</button>{{ first }} / {{ firstDouble }} / {{ second }}</view>
    `, `
      import { ref as signal, computed as derive } from 'vue'
      function useCounter(seed: number) {
        const count = signal(seed)
        const step = signal(2)
        const double = derive(() => count.value * 2)
        const increment = () => { count.value += step.value }
        return { count, double, increment }
      }
      const { count: first, double: firstDouble, increment } = useCounter(3)
      const { count: second, increment: incrementSecond } = useCounter(9)
      function incrementFirst() { increment() }
    `)
    expect(result.errors).toEqual([])
    const { options, wxml, js, runtime } = await readRegistration(output, path, 'Page')
    expect(js).not.toMatch(/useCounter|\bsignal\(|\bderive\(/)
    expect(runtime).toContain('function ref(')
    expect(wxml).toContain('bind:tap="incrementFirst"')
    expect(wxml).toMatch(/{{\s*firstDouble\s*}}/)
    const firstPage = createInstance(options)
    const secondPage = createInstance(options)
    options.onLoad.call(firstPage)
    options.onLoad.call(secondPage)
    expect(firstPage.data).toMatchObject({ first: 3, firstDouble: 6, second: 9 })
    options.incrementFirst.call(firstPage)
    expect(firstPage.data).toMatchObject({ first: 5, firstDouble: 10, second: 9 })
    options.incrementSecond.call(firstPage)
    expect(firstPage.data).toMatchObject({ first: 5, firstDouble: 10, second: 11 })
    expect(secondPage.data).toMatchObject({ first: 3, firstDouble: 6, second: 9 })
  })

  it('对不可静态展开的 composable 给出文件位置，不生成伪原生页面', async () => {
    const { result, output } = await compile('pages/index/index', '<view>{{ count }}</view>', `
      import { ref } from 'vue'
      function useCounter() {
        const count = ref(Date.now())
        return { count }
      }
      const { count } = useCounter()
    `)
    expect(result.stats.failed).toBe(1)
    expect(JSON.stringify(result.errors)).toMatch(/index\.vue:\d+: 无法静态编译 composable/)
    await expect(readFile(join(output, 'pages/index/index.js'))).rejects.toMatchObject({ code: 'ENOENT' })
  })

  it('保留原生 data、响应式初始值和 props 默认值中的字符串类型', async () => {
    const path = 'components/LiteralData'
    const { result, output } = await compile(path, '<view>{{ text }} {{ flag }} {{ label }}</view>', `
      import { ref, reactive } from 'vue'
      const text = 'true'
      const flag = ref('false')
      const formatter = '() => 1'
      const nested = reactive({ 'dash-key': ['42', '[1]', 'new Date()', 'String'], '01': 'null' })
      const actual = [true, false, 42, null]
      defineProps({ label: { type: String, default: 'true' } })
    `)
    expect(result.errors).toEqual([])
    const { options } = await readRegistration(output, path, 'Component')
    expect(options.data).toEqual({
      text: 'true', flag: 'false', formatter: '() => 1',
      nested: { 'dash-key': ['42', '[1]', 'new Date()', 'String'], '01': 'null' },
      actual: [true, false, 42, null]
    })
    expect(options.properties.label.type.name).toBe('String')
    expect(options.properties.label.value).toBe('true')
    const instance = createInstance(options)
    options.attached.call(instance)
    expect(instance.flag.value).toBe('false')
    expect(instance.nested['dash-key'][0]).toBe('42')
  })
})
