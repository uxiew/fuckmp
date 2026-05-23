import { describe, expect, it } from 'vitest'
import type { ComponentConfig } from '@/runtime/core/component.js'
import {
  mergeComponentConfigs,
  processComponentConfig
} from '@/runtime/core/component-config-utils.js'

describe('component config utils', () => {
  it('按现有浅合并语义合并对象字段和 mixin 数组', () => {
    const baseMethod = () => 'base'
    const overrideMethod = () => 'override'
    const baseMixin = { data: { fromBaseMixin: true } }
    const overrideMixin = { data: { fromOverrideMixin: true } }

    const merged = mergeComponentConfigs(
      {
        data: { keep: 'base', shared: 'base' },
        computed: { baseOnly: () => 1 },
        methods: { baseMethod },
        lifecycle: { onLoad: baseMethod },
        mixins: [baseMixin]
      },
      {
        data: { shared: 'override', added: 'override' },
        methods: { overrideMethod },
        lifecycle: { onShow: overrideMethod },
        mixins: [overrideMixin]
      }
    )

    expect(merged.data).toEqual({
      keep: 'base',
      shared: 'override',
      added: 'override'
    })
    expect(merged.computed).toEqual({ baseOnly: expect.any(Function) })
    expect(merged.methods).toEqual({ baseMethod, overrideMethod })
    expect(merged.lifecycle).toEqual({ onLoad: baseMethod, onShow: overrideMethod })
    expect(merged.mixins).toEqual([baseMixin, overrideMixin])
  })

  it('按当前管理器顺序先应用 mixins 再应用 extends', () => {
    const config: ComponentConfig = {
      data: { current: true, shared: 'current' },
      methods: { currentMethod: () => 'current' },
      mixins: [
        {
          data: { mixin: true, shared: 'mixin' },
          methods: { mixinMethod: () => 'mixin' }
        }
      ],
      extends: {
        data: { parent: true, shared: 'parent' },
        methods: { parentMethod: () => 'parent' }
      }
    }

    const processed = processComponentConfig(config, {
      enableMixins: true,
      enableInheritance: true
    })

    expect(processed.data).toEqual({
      parent: true,
      current: true,
      mixin: true,
      shared: 'mixin'
    })
    expect(Object.keys(processed.methods ?? {})).toEqual([
      'parentMethod',
      'currentMethod',
      'mixinMethod'
    ])
    expect(processed.extends).toBe(config.extends)
  })

  it('关闭 mixins 或 inheritance 时保留对应未处理配置', () => {
    const config: ComponentConfig = {
      data: { current: true },
      mixins: [{ data: { mixin: true } }],
      extends: { data: { parent: true } }
    }

    expect(processComponentConfig(config, {
      enableMixins: false,
      enableInheritance: true
    }).data).toEqual({ parent: true, current: true })

    expect(processComponentConfig(config, {
      enableMixins: true,
      enableInheritance: false
    }).data).toEqual({ current: true, mixin: true })
  })
})
