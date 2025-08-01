import { config, validateConfig } from '@/lib/config';

describe('Configuration Management', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    jest.resetModules();
    process.env = { ...originalEnv };
  });

  afterAll(() => {
    process.env = originalEnv;
  });

  describe('config object', () => {
    it('should have default Redis configuration', () => {
      expect(config.redis.host).toBe('localhost');
      expect(config.redis.port).toBe(6379);
      expect(config.redis.maxRetriesPerRequest).toBe(3);
    });

    it('should have default cache TTL settings', () => {
      expect(config.cache.ttl.short).toBe(60);
      expect(config.cache.ttl.medium).toBe(300);
      expect(config.cache.ttl.long).toBe(900);
    });

    it('should have security defaults', () => {
      expect(config.security.maxRequestSizeKB).toBe(1024);
      expect(config.security.corsOrigins).toContain('http://localhost:3000');
    });
  });

  describe('validateConfig', () => {
    it('should pass validation with all required env vars', () => {
      process.env.MONGODB_URI = 'mongodb://localhost:27017/test';
      process.env.NEXTAUTH_SECRET = 'test-secret';
      process.env.NEXTAUTH_URL = 'http://localhost:3000';
      process.env.GOOGLE_CLIENT_ID = 'test-client-id';
      process.env.GOOGLE_CLIENT_SECRET = 'test-client-secret';
      process.env.RESEND_API_KEY = 'test-api-key';
      process.env.RESEND_FROM_EMAIL = 'test@example.com';

      expect(() => validateConfig()).not.toThrow();
    });

    it('should throw error when required env vars are missing', () => {
      delete process.env.MONGODB_URI;
      delete process.env.NEXTAUTH_SECRET;

      expect(() => validateConfig()).toThrow('Missing required environment variables');
    });
  });
});
