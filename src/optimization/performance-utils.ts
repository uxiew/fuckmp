/**
 * 性能优化纯工具函数。
 */

/**
 * 缓存条目最小结构。
 */
export interface CacheEntryLike<T = any> {
  /** 缓存值。 */
  value: T
  /** 创建时间。 */
  timestamp: number
  /** 最近访问时间。 */
  lastAccess: number
}

/**
 * 格式化字节数。
 */
export function formatBytes(bytes: number): string {
  const units = ['B', 'KB', 'MB', 'GB']
  let size = Math.abs(bytes)
  let unitIndex = 0

  while (size >= 1024 && unitIndex < units.length - 1) {
    size /= 1024
    unitIndex++
  }

  const sign = bytes < 0 ? '-' : ''
  return `${sign}${size.toFixed(1)} ${units[unitIndex]}`
}

/**
 * 创建缓存条目。
 */
export function createCacheEntry<T>(value: T, now: number = Date.now()): CacheEntryLike<T> {
  return {
    value,
    timestamp: now,
    lastAccess: now
  }
}

/**
 * 查找最近最少访问的缓存 key。
 */
export function findOldestCacheKey<T>(
  cache: Map<string, CacheEntryLike<T>>,
  now: number = Date.now()
): string {
  let oldestKey = ''
  let oldestTime = now

  for (const [key, entry] of cache.entries()) {
    if (entry.lastAccess < oldestTime) {
      oldestTime = entry.lastAccess
      oldestKey = key
    }
  }

  return oldestKey
}

/**
 * 估算缓存内存使用量。
 */
export function estimateCacheMemoryUsage<T>(cache: Map<string, CacheEntryLike<T>>): number {
  let size = 0

  for (const [key, entry] of cache.entries()) {
    size += key.length * 2
    size += JSON.stringify(entry.value).length * 2
    size += 64
  }

  return size
}

/**
 * 判断当前内存状态是否应该触发 GC。
 */
export function shouldTriggerGC(
  heapUsed: number,
  gcThreshold: number,
  now: number,
  lastGC: number,
  minInterval: number = 5000
): boolean {
  return heapUsed > gcThreshold && now - lastGC > minInterval
}
