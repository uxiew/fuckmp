import { describe, expect, it, vi } from 'vitest'
import { CacheManager } from '@/optimization/performance-cache-manager.js'

describe('performance cache manager', () => {
  it('读取缓存时更新访问时间，过期后返回 null 并移除条目', () => {
    vi.useFakeTimers()
    vi.setSystemTime(1000)

    const cache = new CacheManager(10, 100)
    cache.set('answer', 42)

    vi.setSystemTime(1050)
    expect(cache.get('answer')).toBe(42)
    expect(cache.getStats().size).toBe(1)

    vi.setSystemTime(1201)
    expect(cache.get('answer')).toBeNull()
    expect(cache.getStats().size).toBe(0)

    vi.useRealTimers()
  })

  it('超过容量时驱逐最近最少访问的缓存项', () => {
    vi.useFakeTimers()
    vi.setSystemTime(1000)

    const cache = new CacheManager(2, 1000)
    cache.set('oldest', 'a')
    vi.setSystemTime(1010)
    cache.set('newer', 'b')
    vi.setSystemTime(1020)
    expect(cache.get('newer')).toBe('b')

    cache.set('latest', 'c')

    expect(cache.get('oldest')).toBeNull()
    expect(cache.get('newer')).toBe('b')
    expect(cache.get('latest')).toBe('c')

    vi.useRealTimers()
  })

  it('返回缓存统计并支持删除和清空', () => {
    const cache = new CacheManager(3)

    cache.set('one', { ok: true })
    cache.set('two', 'value')

    const stats = cache.getStats()
    expect(stats.size).toBe(2)
    expect(stats.maxSize).toBe(3)
    expect(stats.hitRate).toBe(0)
    expect(stats.memoryUsage).toBeGreaterThan(0)

    expect(cache.delete('one')).toBe(true)
    expect(cache.get('one')).toBeNull()

    cache.clear()
    expect(cache.getStats().size).toBe(0)
  })
})
