/**
 * 性能优化缓存管理器。
 */

import {
  createCacheEntry,
  estimateCacheMemoryUsage,
  findOldestCacheKey
} from './performance-utils.js'

/**
 * 缓存管理器
 */
export class CacheManager {
  private cache: Map<string, CacheEntry> = new Map()
  private maxSize: number
  private maxAge: number

  constructor(maxSize: number = 1000, maxAge: number = 24 * 60 * 60 * 1000) {
    this.maxSize = maxSize
    this.maxAge = maxAge
  }

  /**
   * 获取缓存
   */
  get(key: string): any | null {
    const entry = this.cache.get(key)
    if (!entry) return null

    // 检查是否过期
    if (Date.now() - entry.timestamp > this.maxAge) {
      this.cache.delete(key)
      return null
    }

    // 更新访问时间
    entry.lastAccess = Date.now()
    return entry.value
  }

  /**
   * 设置缓存
   */
  set(key: string, value: any): void {
    // 检查缓存大小
    if (this.cache.size >= this.maxSize) {
      this.evictOldest()
    }

    this.cache.set(key, createCacheEntry(value))
  }

  /**
   * 删除缓存
   */
  delete(key: string): boolean {
    return this.cache.delete(key)
  }

  /**
   * 清空缓存
   */
  clear(): void {
    this.cache.clear()
  }

  /**
   * 获取缓存统计
   */
  getStats(): CacheStats {
    return {
      size: this.cache.size,
      maxSize: this.maxSize,
      hitRate: 0, // 需要实现命中率统计
      memoryUsage: this.estimateMemoryUsage()
    }
  }

  /**
   * 清理过期缓存
   */
  cleanup(): void {
    const now = Date.now()
    for (const [key, entry] of this.cache.entries()) {
      if (now - entry.timestamp > this.maxAge) {
        this.cache.delete(key)
      }
    }
  }

  /**
   * 驱逐最旧的缓存项
   */
  private evictOldest(): void {
    const oldestKey = findOldestCacheKey(this.cache)

    if (oldestKey) {
      this.cache.delete(oldestKey)
    }
  }

  /**
   * 估算内存使用量
   */
  private estimateMemoryUsage(): number {
    return estimateCacheMemoryUsage(this.cache)
  }
}

/**
 * 缓存条目接口
 */
export interface CacheEntry {
  value: any
  timestamp: number
  lastAccess: number
}

/**
 * 缓存统计接口
 */
export interface CacheStats {
  size: number
  maxSize: number
  hitRate: number
  memoryUsage: number
}
