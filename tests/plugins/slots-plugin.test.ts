import { describe, expect, it } from 'vitest'
import { SlotsPlugin } from '@/plugins/composition/slots-plugin.js'

describe('SlotsPlugin', () => {
  it('保持 unsupported 节点返回 unhandled 的 public 行为', async () => {
    const plugin = new SlotsPlugin()
    const result = await plugin.transform({ type: 'Element', tagName: 'view' } as any, { template: {} } as any)

    expect(result).toEqual({
      handled: false,
      errors: [],
      warnings: []
    })
  })
})
