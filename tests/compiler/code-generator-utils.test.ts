import { describe, expect, it } from 'vitest'
import {
  createComputedOptions,
  createLifecycleOptions,
  createPropertyOptions,
  createWatcherOptions,
  filterInvalidOptions,
  filterDataInitializationFields,
  generateCodeFileHeader,
  getRelativeRuntimePath,
  mapVueTypeToMiniProgram,
} from '@/compiler/codegen/code-generator-utils'

describe('code-generator utils', () => {
  it('生成包含运行时版本和目标平台的文件头', () => {
    const header = generateCodeFileHeader(
      { runtimeVersion: 'test-runtime' },
      { target: 'wechat', strict: true }
    )

    expect(header).toContain('运行时版本: test-runtime')
    expect(header).toContain('目标平台: wechat')
    expect(header).toContain("'use strict';")
  })

  it('根据输出路径深度生成 runtime-injection 相对路径', () => {
    expect(getRelativeRuntimePath('index')).toBe('./runtime-injection.js')
    expect(getRelativeRuntimePath('pages/home/index')).toBe('../../runtime-injection.js')
  })

  it('映射 Vue prop 类型到小程序构造函数名', () => {
    expect(mapVueTypeToMiniProgram('string')).toBe('String')
    expect(mapVueTypeToMiniProgram('Number')).toBe('Number')
    expect(mapVueTypeToMiniProgram(Boolean)).toBe('Boolean')
    expect(mapVueTypeToMiniProgram(Array)).toBe('Array')
    expect(mapVueTypeToMiniProgram(null)).toBe('Object')
    expect(mapVueTypeToMiniProgram('unknown')).toBe('Object')
  })

  it('过滤空 option 与无效生命周期占位但保留空数组', () => {
    expect(
      filterInvalidOptions({
        title: '首页',
        emptyText: '',
        nullable: null,
        missing: undefined,
        tabs: [],
        onShow: '无效的回调函数: onShow',
        onLoad: 'function(options) {}',
      })
    ).toEqual({
      title: '首页',
      tabs: [],
      onLoad: 'function(options) {}',
    })
  })

  it('过滤 data 初始化阶段不能安全写入的数据字段', () => {
    expect(filterDataInitializationFields({
      count: 1,
      props: 'defineProps({})',
      emit: 'defineEmits([])',
      message: 'this.message',
      now: 'Date.now()',
      attached: '无效的回调函数: attached'
    })).toEqual({
      count: 1
    })
  })

  it('生成计算属性 getter 方法名', () => {
    expect(createComputedOptions({
      total: { getter: 'function() { return this.count + 1 }' },
      ignored: {}
    })).toEqual({
      getTotal: 'function() { return this.count + 1 }'
    })
  })

  it('生成 watcher observers 包装', () => {
    expect(createWatcherOptions({ count: 'countChanged' })).toEqual({
      observers: { count: 'countChanged' }
    })
    expect(createWatcherOptions({})).toEqual({})
  })

  it('按页面、组件和页面生命周期生成生命周期选项', () => {
    expect(createLifecycleOptions({
      onLoad: 'this.ready = true',
      attached: 'this.init()',
      'pageLifetimes.show': 'this.trackShow()',
      onShow: 'this.show()'
    })).toEqual({
      onLoad: 'function(options) {\n    this.ready = true\n  }',
      lifetimes: {
        attached: 'function() {\n    this.init()\n  }'
      },
      pageLifetimes: {
        show: 'function() {\n    this.trackShow()\n  }'
      },
      onShow: 'function() {\n    this.show()\n  }'
    })
  })

  it('生成小程序组件 properties 定义', () => {
    expect(createPropertyOptions({
      title: { type: 'string', default: '默认标题' },
      visible: { type: Boolean, default: true }
    })).toEqual({
      title: {
        type: 'String',
        value: '默认标题'
      },
      visible: {
        type: 'Boolean',
        value: true
      }
    })
  })
})
