import Redis, { RedisOptions } from 'ioredis';
import { config } from './config';

interface CacheStats {
  totalKeys: number;
  keysByType: Record<string, number>;
  memoryUsage?: string;
  hitRate?: number;
  uptime?: number;
}

declare global {
  var redisCache: {
    client: Redis | null;
    promise: Promise<Redis> | null;
    stats: {
      hits: number;
      misses: number;
      errors: number;
    };
  };
}

const REDIS_URL = config.redis.url;
const REDIS_HOST = config.redis.host;
const REDIS_PORT = config.redis.port;
const REDIS_PASSWORD = config.redis.password;

let cached = global.redisCache;

if (!cached) {
  cached = global.redisCache = {
    client: null,
    promise: null,
    stats: { hits: 0, misses: 0, errors: 0 },
  };
}

async function connectRedis(): Promise<Redis> {
  if (cached.client) {
    return cached.client;
  }

  if (!cached.promise) {
    const options: RedisOptions = {
      host: REDIS_HOST,
      port: REDIS_PORT,
      maxRetriesPerRequest: 3,
      lazyConnect: true,
      ...(REDIS_PASSWORD && { password: REDIS_PASSWORD }),
    };

    // Use URL if provided, otherwise use individual options
    cached.promise = REDIS_URL.startsWith('redis://')
      ? Promise.resolve(new Redis(REDIS_URL, options))
      : Promise.resolve(new Redis(options));
  }

  try {
    cached.client = await cached.promise;

    // Test the connection
    await cached.client.ping();
    console.log('✅ Redis connected successfully');

    return cached.client;
  } catch (error) {
    cached.promise = null;
    console.warn('⚠️ Redis connection failed, falling back to memory cache:', error);
    throw error;
  }
}

// Memory fallback cache for when Redis is not available
class MemoryCache {
  private cache = new Map<string, { value: unknown; expiry?: number }>();

  async get(key: string): Promise<string | null> {
    const item = this.cache.get(key);
    if (!item) return null;

    if (item.expiry && Date.now() > item.expiry) {
      this.cache.delete(key);
      return null;
    }

    return typeof item.value === 'string' ? item.value : JSON.stringify(item.value);
  }

  async set(key: string, value: string, ttlSeconds?: number): Promise<void> {
    const expiry = ttlSeconds ? Date.now() + ttlSeconds * 1000 : undefined;
    this.cache.set(key, { value, expiry });
  }

  async del(key: string): Promise<void> {
    this.cache.delete(key);
  }

  async exists(key: string): Promise<boolean> {
    const item = this.cache.get(key);
    if (!item) return false;

    if (item.expiry && Date.now() > item.expiry) {
      this.cache.delete(key);
      return false;
    }

    return true;
  }

  async keys(pattern: string): Promise<string[]> {
    const regex = new RegExp(pattern.replace('*', '.*'));
    return Array.from(this.cache.keys()).filter(key => regex.test(key));
  }
}

const memoryCache = new MemoryCache();

// Cache interface that handles both Redis and memory fallback
export class CacheService {
  private redis: Redis | null = null;
  private useMemoryFallback = false;

  async initialize() {
    try {
      this.redis = await connectRedis();
      this.useMemoryFallback = false;
    } catch {
      console.warn('Using memory cache fallback');
      this.useMemoryFallback = true;
    }
  }

  async get(key: string): Promise<string | null> {
    try {
      if (this.useMemoryFallback || !this.redis) {
        return await memoryCache.get(key);
      }
      return await this.redis.get(key);
    } catch (error) {
      console.warn('Cache get error, falling back to memory:', error);
      return await memoryCache.get(key);
    }
  }

  async set(key: string, value: string, ttlSeconds?: number): Promise<void> {
    try {
      if (this.useMemoryFallback || !this.redis) {
        return await memoryCache.set(key, value, ttlSeconds);
      }

      if (ttlSeconds) {
        await this.redis.setex(key, ttlSeconds, value);
      } else {
        await this.redis.set(key, value);
      }
    } catch (error) {
      console.warn('Cache set error, falling back to memory:', error);
      await memoryCache.set(key, value, ttlSeconds);
    }
  }

  async del(key: string): Promise<void> {
    try {
      if (this.useMemoryFallback || !this.redis) {
        return await memoryCache.del(key);
      }
      await this.redis.del(key);
    } catch (error) {
      console.warn('Cache delete error, falling back to memory:', error);
      await memoryCache.del(key);
    }
  }

  async exists(key: string): Promise<boolean> {
    try {
      if (this.useMemoryFallback || !this.redis) {
        return await memoryCache.exists(key);
      }
      const result = await this.redis.exists(key);
      return result === 1;
    } catch (error) {
      console.warn('Cache exists error, falling back to memory:', error);
      return await memoryCache.exists(key);
    }
  }

  async keys(pattern: string): Promise<string[]> {
    try {
      if (this.useMemoryFallback || !this.redis) {
        return await memoryCache.keys(pattern);
      }
      return await this.redis.keys(pattern);
    } catch (error) {
      console.warn('Cache keys error, falling back to memory:', error);
      return await memoryCache.keys(pattern);
    }
  }

  // Convenience methods for JSON data
  async getJson<T>(key: string): Promise<T | null> {
    const value = await this.get(key);
    if (!value) return null;
    try {
      return JSON.parse(value);
    } catch {
      return null;
    }
  }

  async setJson<T>(key: string, value: T, ttlSeconds?: number): Promise<void> {
    await this.set(key, JSON.stringify(value), ttlSeconds);
  }

  // Clear cache by pattern
  async clearPattern(pattern: string): Promise<void> {
    const keys = await this.keys(pattern);
    if (keys.length > 0) {
      await Promise.all(keys.map(key => this.del(key)));
    }
  }
}

// Create singleton instance
export const cache = new CacheService();

// Initialize cache on module load
cache.initialize().catch(console.error);

export default cache;
