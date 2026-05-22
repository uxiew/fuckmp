import { describe, expect, it } from 'vitest'
import {
  createCacheEntry,
  estimateCacheMemoryUsage,
  findOldestCacheKey,
  formatBytes,
  shouldTriggerGC
} from '@/optimization/performance-utils.js'

describe('performance utils', () => {
  it('格式化字节数并保留负数符号', () => {
    expect(formatBytes(512)).toBe('512.0 B')
    expect(formatBytes(1536)).toBe('1.5 KB')
    expect(formatBytes(-1048576)).toBe('-1.0 MB')
  })

  it('创建缓存条目并估算缓存内存占用', () => {
    const entry = createCacheEntry({ ok: true }, 1000)
    const cache = new Map([
      ['answer', entry]
    ])

    expect(entry).toEqual({
      value: { ok: true },
      timestamp: 1000,
      lastAccess: 1000
    })
    expect(estimateCacheMemoryUsage(cache)).toBe(
      'answer'.length * 2 + JSON.stringify({ ok: true }).length * 2 + 64
    )
  })

  it('查找最久未访问的缓存 key', () => {
    const cache = new Map([
      ['newer', createCacheEntry('a', 100)],
      ['oldest', { ...createCacheEntry('b', 50), lastAccess: 20 }],
      ['middle', { ...createCacheEntry('c', 70), lastAccess: 40 }]
    ])

    expect(findOldestCacheKey(cache, 100)).toBe('oldest')
    expect(findOldestCacheKey(new Map(), 100)).toBe('')
  })

  it('判断是否应该触发 GC', () => {
    expect(shouldTriggerGC(101, 100, 6001, 1000)).toBe(true)
    expect(shouldTriggerGC(99, 100, 6000, 1000)).toBe(false)
    expect(shouldTriggerGC(101, 100, 4000, 1000)).toBe(false)
  })
})
