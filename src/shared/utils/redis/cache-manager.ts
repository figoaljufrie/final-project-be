import { redisClient } from "./redis";
import { cacheConfig } from "./redis-config";

export class CacheManager {
  /**
   * Get cached data
   */
  async get<T>(key: string): Promise<T | null> {
    if (!cacheConfig.enabled) return null;

    try {
      const client = redisClient.getClient();
      const data = await client.get(key);

      if (!data) return null;

      return JSON.parse(data) as T;
    } catch (error) {
      console.error(`Cache get error for key ${key}:`, error);
      return null;
    }
  }

  async set(key: string, value: any, ttl?: number): Promise<void> {
    if (!cacheConfig.enabled) return;

    try {
      const client = redisClient.getClient();
      const serialized = JSON.stringify(value);
      const expiresIn = ttl || cacheConfig.defaultTTL;

      await client.setEx(key, expiresIn, serialized);
    } catch (error) {
      console.error(`Cache set error for key ${key}:`, error);
    }
  }

  /**
   * Delete specific cache key
   */
  async delete(key: string): Promise<void> {
    if (!cacheConfig.enabled) return;

    try {
      const client = redisClient.getClient();
      await client.del(key);
    } catch (error) {
      console.error(`Cache delete error for key ${key}:`, error);
    }
  }

  /**
   * Delete multiple keys matching a pattern
   */
  async deletePattern(pattern: string): Promise<void> {
    if (!cacheConfig.enabled) return;

    try {
      const client = redisClient.getClient();
      const keys = await client.keys(pattern);

      if (keys.length > 0) {
        await client.del(keys);
        console.log(
          `🗑️ Deleted ${keys.length} cache keys matching: ${pattern}`
        );
      }
    } catch (error) {
      console.error(`Cache delete pattern error for ${pattern}:`, error);
    }
  }

  /**
   * Check if key exists
   */
  async exists(key: string): Promise<boolean> {
    if (!cacheConfig.enabled) return false;

    try {
      const client = redisClient.getClient();
      const result = await client.exists(key);
      return result === 1;
    } catch (error) {
      console.error(`Cache exists error for key ${key}:`, error);
      return false;
    }
  }

  /**
   * Get remaining TTL for a key
   */
  async ttl(key: string): Promise<number> {
    if (!cacheConfig.enabled) return -1;

    try {
      const client = redisClient.getClient();
      return await client.ttl(key);
    } catch (error) {
      console.error(`Cache TTL error for key ${key}:`, error);
      return -1;
    }
  }

  /**
   * Clear all cache
   */
  async flushAll(): Promise<void> {
    if (!cacheConfig.enabled) return;

    try {
      const client = redisClient.getClient();
      await client.flushDb();
      console.log("🗑️ All cache cleared");
    } catch (error) {
      console.error("Cache flush error:", error);
    }
  }

  /**
   * Get or set pattern (cache-aside pattern)
   */
  async getOrSet<T>(
    key: string,
    factory: () => Promise<T>,
    ttl?: number
  ): Promise<T> {
    // Try to get from cache first
    const cached = await this.get<T>(key);
    if (cached !== null) {
      console.log(`✅ Cache HIT: ${key}`);
      return cached;
    }

    console.log(`❌ Cache MISS: ${key}`);

    // Cache miss - fetch fresh data
    const freshData = await factory();

    // Store in cache for next time
    await this.set(key, freshData, ttl);

    return freshData;
  }

  /**
   * Increment counter (useful for rate limiting)
   */
  async increment(key: string, expireSeconds?: number): Promise<number> {
    try {
      const client = redisClient.getClient();
      const value = await client.incr(key);

      if (expireSeconds && value === 1) {
        await client.expire(key, expireSeconds);
      }

      return value;
    } catch (error) {
      console.error(`Cache increment error for key ${key}:`, error);
      return 0;
    }
  }

  /**
   * Get cache statistics
   */
  async getStats(): Promise<{
    isConnected: boolean;
    keysCount: number;
    memoryUsed: string;
  }> {
    try {
      const client = redisClient.getClient();
      const keys = await client.dbSize();
      const info = await client.info("memory");

      const memoryMatch = info.match(/used_memory_human:(.+)/);
      const memoryUsed = memoryMatch?.[1]?.trim() ?? "unknown";

      return {
        isConnected: redisClient.isHealthy(),
        keysCount: keys,
        memoryUsed,
      };
    } catch (error) {
      console.error("Failed to get cache stats:", error);
      return {
        isConnected: false,
        keysCount: 0,
        memoryUsed: "unknown",
      };
    }
  }
}

// Singleton instance
export const cacheManager = new CacheManager();
