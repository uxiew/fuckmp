/**
 * 运行时 Proxy 响应式系统验证测试
 * 验证编译后的运行时注入代码确实使用了 Proxy 实现
 */

import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest'
import fs from 'fs'
import os from 'os'
import path from 'path'
import { Vue3MiniprogramCompiler } from '@/compiler/compiler.js'

describe('运行时 Proxy 响应式系统验证', () => {
  let runtimeCode: string
  let outputDir: string

  beforeAll(async () => {
    outputDir = fs.mkdtempSync(path.join(os.tmpdir(), 'vue3-wx-runtime-proxy-'))

    const compiler = new Vue3MiniprogramCompiler({
      input: path.join(process.cwd(), 'test-project'),
      output: outputDir,
      appId: 'test-miniprogram',
      features: {
        scriptSetup: true,
        typescript: true,
        scss: true,
        compositionApi: true,
        emits: true,
        slots: true,
        provide: false
      },
      optimization: {
        minify: false,
        sourcemap: true,
        treeshaking: false,
        incremental: false
      }
    })

    const result = await compiler.compile()
    expect(result.errors).toHaveLength(0)
  })

  afterAll(() => {
    if (outputDir) {
      fs.rmSync(outputDir, { recursive: true, force: true })
    }
  })

  beforeEach(() => {
    // 读取编译后的运行时注入代码
    const runtimePath = path.join(outputDir, 'runtime-injection.js')
    if (fs.existsSync(runtimePath)) {
      runtimeCode = fs.readFileSync(runtimePath, 'utf-8')
    } else {
      throw new Error('运行时注入文件不存在，请先运行编译')
    }
  })

  it('应该在 ref 方法中使用 Proxy 实现', () => {
    // 验证 ref 方法使用了 Proxy
    expect(runtimeCode).toContain('// 创建 ref (基于 Proxy 的实现)')
    expect(runtimeCode).toContain('const refProxy = new Proxy(target, {')

    // 验证包含完整的 Proxy handlers
    expect(runtimeCode).toContain('get(target, prop) {')
    expect(runtimeCode).toContain('set(target, prop, newValue) {')
    expect(runtimeCode).toContain('has(target, prop) {')
    expect(runtimeCode).toContain('ownKeys(target) {')
    expect(runtimeCode).toContain('getOwnPropertyDescriptor(target, prop) {')

    // 验证核心响应式系统不再使用旧的 getter/setter 方式
    // 注意：Object.defineProperty 仍然用于与小程序 setData 的集成，这是正常的
    expect(runtimeCode).not.toContain('get value()')
    expect(runtimeCode).not.toContain('set value(newValue)')
  })

  it('应该在 reactive 方法中使用优化的 Proxy 实现', () => {
    // 验证 reactive 方法使用了优化的 Proxy
    expect(runtimeCode).toContain('// 创建 reactive (优化的 Proxy 实现)')
    expect(runtimeCode).toContain('const proxyCache = new WeakMap();')

    // 验证包含缓存机制
    expect(runtimeCode).toContain('if (proxyCache.has(target)) {')
    expect(runtimeCode).toContain('proxyCache.set(target, proxy);')

    // 验证包含完整的 Proxy handlers
    expect(runtimeCode).toContain('deleteProperty(target, prop) {')
    expect(runtimeCode).toContain('Reflect.ownKeys(target)')
    expect(runtimeCode).toContain('Reflect.getOwnPropertyDescriptor(target, prop)')
    expect(runtimeCode).toContain('Reflect.deleteProperty(target, prop)')
  })

  it('应该在 computed 方法中使用 Proxy 实现', () => {
    // 验证 computed 方法使用了 Proxy
    expect(runtimeCode).toContain('// 创建 computed (基于 Proxy 的实现)')
    expect(runtimeCode).toContain('const computedProxy = new Proxy(target, {')

    // 验证包含循环依赖检测
    expect(runtimeCode).toContain('let _computing = false; // 防止循环计算')
    expect(runtimeCode).toContain('if (target._computing) {')
    expect(runtimeCode).toContain('检测到计算属性')
    expect(runtimeCode).toContain('的循环依赖')

    // 验证包含错误处理
    expect(runtimeCode).toContain('try {')
    expect(runtimeCode).toContain('} catch (error) {')
    expect(runtimeCode).toContain('} finally {')

    // 验证 computed value 是只读的
    expect(runtimeCode).toContain('writable: false // computed value 是只读的')
  })

  it('应该包含完整的错误处理和警告机制', () => {
    // 验证包含适当的警告信息
    expect(runtimeCode).toContain('console.warn(`尝试修改 ref 的只读属性:')
    expect(runtimeCode).toContain('console.warn(`计算属性')
    expect(runtimeCode).toContain('的 value 是只读的`')
    expect(runtimeCode).toContain('console.warn(`尝试修改 computed 的只读属性:')

    // 验证包含错误处理
    expect(runtimeCode).toContain('console.error(`计算属性')
    expect(runtimeCode).toContain('计算失败:')
  })

  it('应该包含性能优化特性', () => {
    // 验证包含缓存机制
    expect(runtimeCode).toContain('WeakMap')

    // 验证包含智能的脏检查
    expect(runtimeCode).toContain('_dirty')

    // 验证包含条件更新（只在值真正改变时更新）
    expect(runtimeCode).toContain('if (newValue !== oldValue)')
    expect(runtimeCode).toContain('const oldValue = target._value;')

    // 验证包含 Reflect API 的使用（更好的性能）
    expect(runtimeCode).toContain('Reflect.ownKeys')
    expect(runtimeCode).toContain('Reflect.getOwnPropertyDescriptor')
    expect(runtimeCode).toContain('Reflect.deleteProperty')
  })

  it('应该正确处理 setData 集成', () => {
    // 验证所有响应式方法都正确集成了 setData
    expect(runtimeCode).toContain('target._context.setData({ [target._key]: newValue });')
    expect(runtimeCode).toContain('context.setData({ [fullPath]: newValue });')
    expect(runtimeCode).toContain('target._context.setData({ [target._key]: _value });')

    // 验证初始化时也调用 setData
    expect(runtimeCode).toContain('context.setData({ [key]: value });')
    expect(runtimeCode).toContain('context.setData({ [key]: obj });')

    // 验证删除属性时的 setData 处理
    expect(runtimeCode).toContain('context.setData({ [fullPath]: undefined });')
  })

  it('应该包含完整的元数据支持', () => {
    // 验证 ref 元数据
    expect(runtimeCode).toContain('_isRef: true')
    expect(runtimeCode).toContain('_key: key')
    expect(runtimeCode).toContain('_value: value')
    expect(runtimeCode).toContain('_context: context')

    // 验证 computed 元数据
    expect(runtimeCode).toContain('_isComputed: true')
    expect(runtimeCode).toContain('_getter: getter')
    expect(runtimeCode).toContain('let _dirty = true;')
    expect(runtimeCode).toContain('_dirty: _dirty')
    expect(runtimeCode).toContain('_computing: false')

    // 验证元数据保护
    expect(runtimeCode).toContain('if (prop === \'_isRef\' || prop === \'_key\')')
    expect(runtimeCode).toContain('if (prop === \'_isComputed\' || prop === \'_key\')')
  })

  it('应该包含正确的属性描述符配置', () => {
    // 验证 ref 的属性描述符
    expect(runtimeCode).toContain('enumerable: true')
    expect(runtimeCode).toContain('configurable: true')
    expect(runtimeCode).toContain('writable: prop === \'value\'')

    // 验证 computed 的属性描述符
    expect(runtimeCode).toContain('writable: false // computed value 是只读的')

    // 验证 ownKeys 返回正确的属性列表
    expect(runtimeCode).toContain('return [\'value\', \'_isRef\', \'_key\'];')
    expect(runtimeCode).toContain('return [\'value\', \'_isComputed\', \'_key\'];')
  })

  it('应该不包含任何旧的 getter/setter 实现', () => {
    // 确保核心响应式系统完全移除了旧的实现方式
    const oldPatterns = [
      /get\s+value\(\)\s*{/,
      /set\s+value\(.*?\)\s*{/
    ]

    oldPatterns.forEach(pattern => {
      expect(runtimeCode).not.toMatch(pattern)
    })

    // 验证核心响应式方法中不包含 Object.defineProperty 的 value 属性定义
    // 注意：Object.defineProperty 仍然用于小程序集成，但不应该用于定义 value 属性
    const refMethodMatch = runtimeCode.match(/\/\/ 创建 ref \(基于 Proxy 的实现\)([\s\S]*?)\/\/ 创建 reactive/)
    if (refMethodMatch) {
      const refMethodCode = refMethodMatch[1]
      expect(refMethodCode).not.toMatch(/Object\.defineProperty.*value/)
    }
  })

  it('应该包含正确的代码注释和文档', () => {
    // 验证包含清晰的注释说明
    expect(runtimeCode).toContain('基于 Proxy 的实现')
    expect(runtimeCode).toContain('优化的 Proxy 实现')
    expect(runtimeCode).toContain('防止循环计算')
    expect(runtimeCode).toContain('const proxyCache = new WeakMap();')
    expect(runtimeCode).toContain('context.setData')
    expect(runtimeCode).toContain('尝试修改 ref 的只读属性')
    expect(runtimeCode).toContain('computed value 是只读的')
  })

  it('不应该包含未接入调用链的占位 runtime 模块', () => {
    expect(runtimeCode).not.toContain('function isRef(value)')
    expect(runtimeCode).not.toContain('function unref(value)')
    expect(runtimeCode).not.toContain('const lifecycleHooks = new Map()')
    expect(runtimeCode).not.toContain('function onMounted(fn, context)')
    expect(runtimeCode).not.toContain('function processTemplate(template, data)')
    expect(runtimeCode).not.toContain('function bindEvent(context, eventName, handler)')
    expect(runtimeCode).not.toContain('defineApp')
    expect(runtimeCode).not.toContain('const runtime = new Vue3MiniRuntime()')
  })
})
