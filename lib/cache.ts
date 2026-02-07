/**
 * Enhanced in-memory cache with TTL, size limits, and automatic cleanup
 */

interface CacheEntry<T> {
  data: T;
  expiry: number;
  lastAccessed: number;
}

interface CacheOptions {
  defaultTTL?: number;
  maxSize?: number;
  cleanupInterval?: number;
}

class MemoryCache {
  private cache: Map<string, CacheEntry<any>> = new Map();
  private defaultTTL: number;
  private maxSize: number;
  private cleanupInterval: number;
  private cleanupTimer: NodeJS.Timeout | null = null;

  constructor(options: CacheOptions = {}) {
    this.defaultTTL = options.defaultTTL ?? 5 * 60 * 1000; // 5 minutes default
    this.maxSize = options.maxSize ?? 1000; // Max 1000 entries by default
    this.cleanupInterval = options.cleanupInterval ?? 60 * 1000; // Cleanup every 60 seconds

    // Start automatic cleanup if in Node.js environment
    if (typeof process !== 'undefined' && process.env.NODE_ENV !== 'test') {
      this.startAutoCleanup();
    }
  }

  get<T>(key: string): T | null {
    const entry = this.cache.get(key);
    if (!entry) return null;

    const now = Date.now();
    if (now > entry.expiry) {
      this.cache.delete(key);
      return null;
    }

    // Update last accessed time for LRU tracking
    entry.lastAccessed = now;
    return entry.data as T;
  }

  set<T>(key: string, data: T, ttlMs?: number): void {
    // Enforce size limit using LRU eviction
    if (this.cache.size >= this.maxSize && !this.cache.has(key)) {
      this.evictLRU();
    }

    const now = Date.now();
    const expiry = now + (ttlMs ?? this.defaultTTL);
    this.cache.set(key, { data, expiry, lastAccessed: now });
  }

  delete(key: string): void {
    this.cache.delete(key);
  }

  /**
   * Delete all keys matching a pattern (supports wildcards with *)
   */
  deletePattern(pattern: string): number {
    const regex = new RegExp('^' + pattern.replace(/\*/g, '.*') + '$');
    let count = 0;

    for (const key of this.cache.keys()) {
      if (regex.test(key)) {
        this.cache.delete(key);
        count++;
      }
    }

    return count;
  }

  clear(): void {
    this.cache.clear();
  }

  /**
   * Get cache statistics
   */
  stats(): { size: number; maxSize: number; utilization: number } {
    return {
      size: this.cache.size,
      maxSize: this.maxSize,
      utilization: Math.round((this.cache.size / this.maxSize) * 100),
    };
  }

  /**
   * Clear expired entries
   */
  cleanup(): number {
    const now = Date.now();
    let removed = 0;

    for (const [key, entry] of this.cache.entries()) {
      if (now > entry.expiry) {
        this.cache.delete(key);
        removed++;
      }
    }

    return removed;
  }

  /**
   * Evict least recently used entry
   */
  private evictLRU(): void {
    let oldestKey: string | null = null;
    let oldestTime = Infinity;

    for (const [key, entry] of this.cache.entries()) {
      if (entry.lastAccessed < oldestTime) {
        oldestTime = entry.lastAccessed;
        oldestKey = key;
      }
    }

    if (oldestKey) {
      this.cache.delete(oldestKey);
    }
  }

  /**
   * Start automatic cleanup interval
   */
  private startAutoCleanup(): void {
    this.cleanupTimer = setInterval(() => {
      this.cleanup();
    }, this.cleanupInterval);

    // Don't prevent Node.js from exiting
    if (this.cleanupTimer.unref) {
      this.cleanupTimer.unref();
    }
  }

  /**
   * Stop automatic cleanup
   */
  stopAutoCleanup(): void {
    if (this.cleanupTimer) {
      clearInterval(this.cleanupTimer);
      this.cleanupTimer = null;
    }
  }
}

// Model cache - 10 minute TTL, smaller size (models don't change often)
export const modelCache = new MemoryCache({
  defaultTTL: 10 * 60 * 1000,
  maxSize: 500,
  cleanupInterval: 2 * 60 * 1000, // Cleanup every 2 minutes
});

// Shared models cache - 5 minute TTL
export const sharedModelsCache = new MemoryCache({
  defaultTTL: 5 * 60 * 1000,
  maxSize: 100,
  cleanupInterval: 60 * 1000,
});

// Generic cache for other use cases
export const appCache = new MemoryCache({
  defaultTTL: 5 * 60 * 1000,
  maxSize: 1000,
  cleanupInterval: 60 * 1000,
});

// Usage limits cache - 5 minute TTL (limits rarely change)
export const usageLimitsCache = new MemoryCache({
  defaultTTL: 5 * 60 * 1000,
  maxSize: 200,
  cleanupInterval: 60 * 1000,
});

/**
 * Invalidate all caches related to shared models
 */
export function invalidateSharedModelsCache(): void {
  sharedModelsCache.clear();
  modelCache.deletePattern('models:*');
}

/**
 * Invalidate caches for a specific provider
 */
export function invalidateProviderCache(provider: string): void {
  modelCache.deletePattern(`models:${provider}:*`);
}
