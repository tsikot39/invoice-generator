import { cache } from '@/lib/redis';
import { CacheKeys, CacheTTL, withCache, CacheInvalidator } from '@/lib/cache-utils';

// Mock Redis for unit tests
jest.mock('@/lib/redis');
const mockCache = cache as jest.Mocked<typeof cache>;

describe('Cache Utils', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('CacheKeys', () => {
    it('should generate correct user cache key', () => {
      const userId = 'test@example.com';
      expect(CacheKeys.user(userId)).toBe('user:test@example.com');
    });

    it('should generate correct clients cache key with parameters', () => {
      const userId = 'test@example.com';
      const key = CacheKeys.clients(userId, 2, 20, 'search');
      expect(key).toBe('clients:test@example.com:p2:l20:ssearch');
    });

    it('should generate correct dashboard cache key', () => {
      const userId = 'test@example.com';
      expect(CacheKeys.dashboard(userId)).toBe('dashboard:test@example.com');
    });
  });

  describe('withCache', () => {
    it('should return cached value when cache hit', async () => {
      const cachedValue = { data: 'cached' };
      mockCache.getJson.mockResolvedValue(cachedValue);

      const fetchFn = jest.fn();
      const result = await withCache('test-key', fetchFn, CacheTTL.SHORT);

      expect(result).toEqual(cachedValue);
      expect(fetchFn).not.toHaveBeenCalled();
      expect(mockCache.getJson).toHaveBeenCalledWith('test-key');
    });

    it('should fetch and cache new value when cache miss', async () => {
      const fetchedValue = { data: 'fetched' };
      mockCache.getJson.mockResolvedValue(null);
      const fetchFn = jest.fn().mockResolvedValue(fetchedValue);

      const result = await withCache('test-key', fetchFn, CacheTTL.MEDIUM);

      expect(result).toEqual(fetchedValue);
      expect(fetchFn).toHaveBeenCalledTimes(1);
      expect(mockCache.setJson).toHaveBeenCalledWith('test-key', fetchedValue, CacheTTL.MEDIUM);
    });

    it('should fallback to fetch when cache fails', async () => {
      const fetchedValue = { data: 'fetched' };
      mockCache.getJson.mockRejectedValue(new Error('Cache error'));
      const fetchFn = jest.fn().mockResolvedValue(fetchedValue);

      const result = await withCache('test-key', fetchFn, CacheTTL.SHORT);

      expect(result).toEqual(fetchedValue);
      expect(fetchFn).toHaveBeenCalledTimes(1);
    });
  });

  describe('CacheInvalidator', () => {
    it('should invalidate user caches', async () => {
      mockCache.clearPattern.mockResolvedValue(5);
      mockCache.del.mockResolvedValue(1);

      await CacheInvalidator.invalidateUser('test@example.com');

      expect(mockCache.clearPattern).toHaveBeenCalledWith('*:test@example.com:*');
      expect(mockCache.del).toHaveBeenCalledWith('user:test@example.com');
      expect(mockCache.del).toHaveBeenCalledWith('dashboard:test@example.com');
      expect(mockCache.del).toHaveBeenCalledWith('settings:test@example.com');
    });

    it('should invalidate client caches with specific client ID', async () => {
      mockCache.clearPattern.mockResolvedValue(3);
      mockCache.del.mockResolvedValue(1);

      await CacheInvalidator.invalidateClients('test@example.com', 'client-123');

      expect(mockCache.clearPattern).toHaveBeenCalledWith('clients:test@example.com:*');
      expect(mockCache.del).toHaveBeenCalledWith('client:test@example.com:client-123');
      expect(mockCache.del).toHaveBeenCalledWith('dashboard:test@example.com');
    });

    it('should invalidate invoice caches', async () => {
      mockCache.clearPattern.mockResolvedValue(2);
      mockCache.del.mockResolvedValue(1);

      await CacheInvalidator.invalidateInvoices('test@example.com');

      expect(mockCache.clearPattern).toHaveBeenCalledWith('invoices:test@example.com:*');
      expect(mockCache.del).toHaveBeenCalledWith('dashboard:test@example.com');
    });
  });

  describe('CacheTTL', () => {
    it('should have correct TTL values', () => {
      expect(CacheTTL.SHORT).toBe(60);
      expect(CacheTTL.MEDIUM).toBe(300);
      expect(CacheTTL.LONG).toBe(900);
      expect(CacheTTL.VERY_LONG).toBe(3600);
      expect(CacheTTL.SESSION).toBe(86400);
    });
  });
});
