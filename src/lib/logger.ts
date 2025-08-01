import winston from 'winston';

// Create structured logger
export const logger = winston.createLogger({
  level: process.env.NODE_ENV === 'production' ? 'warn' : 'debug',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  defaultMeta: { service: 'invoice-generator' },
  transports: [
    new winston.transports.File({ filename: 'error.log', level: 'error' }),
    new winston.transports.File({ filename: 'combined.log' }),
  ],
});

// Add console transport for development
if (process.env.NODE_ENV !== 'production') {
  logger.add(
    new winston.transports.Console({
      format: winston.format.combine(winston.format.colorize(), winston.format.simple()),
    })
  );
}

// Cache-specific logger
export const cacheLogger = {
  hit: (key: string, ttl?: number) => {
    logger.debug('Cache hit', { key, ttl, type: 'cache_hit' });
  },
  miss: (key: string) => {
    logger.debug('Cache miss', { key, type: 'cache_miss' });
  },
  error: (key: string, error: Error) => {
    logger.error('Cache error', {
      key,
      error: error.message,
      stack: error.stack,
      type: 'cache_error',
    });
  },
  invalidate: (pattern: string, count: number) => {
    logger.info('Cache invalidated', { pattern, count, type: 'cache_invalidate' });
  },
  stats: (stats: Record<string, unknown>) => {
    logger.info('Cache stats', { ...stats, type: 'cache_stats' });
  },
};

// API logger
export const apiLogger = {
  request: (method: string, url: string, userId?: string) => {
    logger.info('API request', { method, url, userId, type: 'api_request' });
  },
  response: (method: string, url: string, status: number, duration: number) => {
    logger.info('API response', { method, url, status, duration, type: 'api_response' });
  },
  error: (method: string, url: string, error: Error, userId?: string) => {
    logger.error('API error', {
      method,
      url,
      userId,
      error: error.message,
      stack: error.stack,
      type: 'api_error',
    });
  },
};
