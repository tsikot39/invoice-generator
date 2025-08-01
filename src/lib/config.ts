// Environment-based configuration management
export const config = {
  // Environment
  NODE_ENV: process.env.NODE_ENV || 'development',
  PORT: parseInt(process.env.PORT || '3000'),

  // Database
  MONGODB_URI: process.env.MONGODB_URI!,

  // Redis Configuration
  redis: {
    url: process.env.REDIS_URL || 'redis://localhost:6379',
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT || '6379'),
    password: process.env.REDIS_PASSWORD,
    maxRetriesPerRequest: parseInt(process.env.REDIS_MAX_RETRIES || '3'),
    retryDelayMs: parseInt(process.env.REDIS_RETRY_DELAY || '1000'),
    keyPrefix: process.env.REDIS_KEY_PREFIX || 'inv:',
    connectionTimeout: parseInt(process.env.REDIS_CONNECTION_TIMEOUT || '10000'),
  },

  // Cache Configuration
  cache: {
    enabled: process.env.CACHE_ENABLED !== 'false',
    ttl: {
      short: parseInt(process.env.CACHE_TTL_SHORT || '60'),
      medium: parseInt(process.env.CACHE_TTL_MEDIUM || '300'),
      long: parseInt(process.env.CACHE_TTL_LONG || '900'),
      veryLong: parseInt(process.env.CACHE_TTL_VERY_LONG || '3600'),
      session: parseInt(process.env.CACHE_TTL_SESSION || '86400'),
    },
    maxMemoryMB: parseInt(process.env.CACHE_MAX_MEMORY_MB || '100'),
    compressionThreshold: parseInt(process.env.CACHE_COMPRESSION_THRESHOLD || '1024'),
  },

  // Authentication
  auth: {
    secret: process.env.NEXTAUTH_SECRET!,
    url: process.env.NEXTAUTH_URL!,
    sessionMaxAge: parseInt(process.env.SESSION_MAX_AGE || '86400'), // 24 hours
  },

  // Google OAuth
  google: {
    clientId: process.env.GOOGLE_CLIENT_ID!,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
  },

  // Email
  email: {
    apiKey: process.env.RESEND_API_KEY!,
    fromEmail: process.env.RESEND_FROM_EMAIL!,
  },

  // Rate Limiting
  rateLimit: {
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000'), // 15 minutes
    maxRequests: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '100'),
    skipSuccessfulRequests: process.env.RATE_LIMIT_SKIP_SUCCESS === 'true',
  },

  // Monitoring
  monitoring: {
    metricsEnabled: process.env.METRICS_ENABLED === 'true',
    healthCheckEnabled: process.env.HEALTH_CHECK_ENABLED !== 'false',
    alertingEnabled: process.env.ALERTING_ENABLED === 'true',
  },

  // Security
  security: {
    corsOrigins: process.env.CORS_ORIGINS?.split(',') || ['http://localhost:3000'],
    trustedProxies: process.env.TRUSTED_PROXIES?.split(',') || [],
    maxRequestSizeKB: parseInt(process.env.MAX_REQUEST_SIZE_KB || '1024'),
  },
};

// Validation function
export function validateConfig() {
  const required = [
    'MONGODB_URI',
    'NEXTAUTH_SECRET',
    'NEXTAUTH_URL',
    'GOOGLE_CLIENT_ID',
    'GOOGLE_CLIENT_SECRET',
    'RESEND_API_KEY',
    'RESEND_FROM_EMAIL',
  ];

  const missing = required.filter(key => !process.env[key]);

  if (missing.length > 0) {
    throw new Error(`Missing required environment variables: ${missing.join(', ')}`);
  }

  // Validate Redis configuration if enabled
  if (config.cache.enabled && !config.redis.url && !config.redis.host) {
    console.warn('⚠️ Redis configuration incomplete, falling back to memory cache');
  }
}

// Initialize configuration validation
validateConfig();
