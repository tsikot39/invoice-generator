import { cache } from './redis';

// Cache key generators
export const CacheKeys = {
  user: (userId: string) => `user:${userId}`,
  clients: (userId: string, page = 1, limit = 10, search = '') =>
    `clients:${userId}:p${page}:l${limit}:s${search}`,
  client: (userId: string, clientId: string) => `client:${userId}:${clientId}`,
  products: (userId: string, page = 1, limit = 10, search = '', category = '') =>
    `products:${userId}:p${page}:l${limit}:s${search}:c${category}`,
  product: (userId: string, productId: string) => `product:${userId}:${productId}`,
  invoices: (userId: string, page = 1, limit = 10, search = '', status = '', clientId = '') =>
    `invoices:${userId}:p${page}:l${limit}:s${search}:st${status}:c${clientId}`,
  invoice: (userId: string, invoiceId: string) => `invoice:${userId}:${invoiceId}`,
  dashboard: (userId: string) => `dashboard:${userId}`,
  settings: (userId: string) => `settings:${userId}`,
  session: (sessionToken: string) => `session:${sessionToken}`,
};

// Cache TTL (Time To Live) in seconds
export const CacheTTL = {
  SHORT: 60, // 1 minute
  MEDIUM: 300, // 5 minutes
  LONG: 900, // 15 minutes
  VERY_LONG: 3600, // 1 hour
  SESSION: 86400, // 24 hours
};

// Caching wrapper for API responses
export async function withCache<T>(
  key: string,
  fetchFn: () => Promise<T>,
  ttlSeconds: number = CacheTTL.MEDIUM
): Promise<T> {
  try {
    // Try to get from cache first
    const cached = await cache.getJson<T>(key);
    if (cached) {
      console.log(`🎯 Cache HIT for key: ${key}`);
      return cached;
    }

    console.log(`💾 Cache MISS for key: ${key}`);

    // Fetch fresh data
    const result = await fetchFn();

    // Store in cache for next time
    await cache.setJson(key, result, ttlSeconds);

    return result;
  } catch (error) {
    console.error(`Cache error for key ${key}:`, error);
    // Fallback to direct fetch if cache fails
    return await fetchFn();
  }
}

// Cache invalidation utilities
export class CacheInvalidator {
  static async invalidateUser(userId: string) {
    await cache.clearPattern(`*:${userId}:*`);
    await cache.del(CacheKeys.user(userId));
    await cache.del(CacheKeys.dashboard(userId));
    await cache.del(CacheKeys.settings(userId));
  }

  static async invalidateClients(userId: string, clientId?: string) {
    await cache.clearPattern(`clients:${userId}:*`);
    if (clientId) {
      await cache.del(CacheKeys.client(userId, clientId));
    }
    // Also invalidate dashboard as it may show client counts
    await cache.del(CacheKeys.dashboard(userId));
  }

  static async invalidateProducts(userId: string, productId?: string) {
    await cache.clearPattern(`products:${userId}:*`);
    if (productId) {
      await cache.del(CacheKeys.product(userId, productId));
    }
    // Invalidate dashboard for product counts
    await cache.del(CacheKeys.dashboard(userId));
  }

  static async invalidateInvoices(userId: string, invoiceId?: string) {
    await cache.clearPattern(`invoices:${userId}:*`);
    if (invoiceId) {
      await cache.del(CacheKeys.invoice(userId, invoiceId));
    }
    // Invalidate dashboard as invoice data affects analytics
    await cache.del(CacheKeys.dashboard(userId));
  }

  static async invalidateDashboard(userId: string) {
    await cache.del(CacheKeys.dashboard(userId));
  }

  static async invalidateSettings(userId: string) {
    await cache.del(CacheKeys.settings(userId));
  }

  static async invalidateSession(sessionToken: string) {
    await cache.del(CacheKeys.session(sessionToken));
  }
}

// Session caching utilities
export class SessionCache {
  static async getSession(sessionToken: string) {
    return await cache.getJson(CacheKeys.session(sessionToken));
  }

  static async setSession(
    sessionToken: string,
    sessionData: Record<string, unknown>,
    ttlSeconds = CacheTTL.SESSION
  ) {
    await cache.setJson(CacheKeys.session(sessionToken), sessionData, ttlSeconds);
  }

  static async deleteSession(sessionToken: string) {
    await cache.del(CacheKeys.session(sessionToken));
  }
}

// Bulk cache operations
export class BulkCache {
  // Pre-warm cache with commonly accessed data
  static async preWarmUserCache(userId: string) {
    try {
      // Pre-load dashboard data
      await withCache(
        CacheKeys.dashboard(userId),
        async () => {
          const response = await fetch(`/api/dashboard`);
          return response.json();
        },
        CacheTTL.MEDIUM
      );

      // Pre-load settings
      await withCache(
        CacheKeys.settings(userId),
        async () => {
          const response = await fetch(`/api/settings`);
          return response.json();
        },
        CacheTTL.LONG
      );

      console.log(`🚀 Pre-warmed cache for user: ${userId}`);
    } catch (error) {
      console.error('Failed to pre-warm cache:', error);
    }
  }

  // Clear all user-related cache
  static async clearUserCache(userId: string) {
    await Promise.all([
      cache.clearPattern(`*:${userId}:*`),
      cache.del(CacheKeys.user(userId)),
      cache.del(CacheKeys.dashboard(userId)),
      cache.del(CacheKeys.settings(userId)),
    ]);
    console.log(`🧹 Cleared all cache for user: ${userId}`);
  }
}

// Cache statistics and monitoring
export class CacheStats {
  static async getStats() {
    try {
      const keys = await cache.keys('*');
      const keysByType = keys.reduce(
        (acc, key) => {
          const type = key.split(':')[0];
          acc[type] = (acc[type] || 0) + 1;
          return acc;
        },
        {} as Record<string, number>
      );

      return {
        totalKeys: keys.length,
        keysByType,
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      console.error('Failed to get cache stats:', error);
      return null;
    }
  }

  static async clearExpiredKeys() {
    try {
      // This is a basic implementation - Redis handles TTL automatically
      // But we can implement custom logic for memory cache fallback
      console.log('Cache cleanup completed');
    } catch (error) {
      console.error('Failed to clear expired keys:', error);
    }
  }
}

export { cache as default, cache };
