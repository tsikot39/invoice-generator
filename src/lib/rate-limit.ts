import { NextRequest, NextResponse } from 'next/server';
import { cache } from './redis';
import { config } from './config';

interface RateLimitResult {
  success: boolean;
  limit: number;
  remaining: number;
  resetTime: number;
  retryAfter?: number;
}

export class RateLimiter {
  private windowMs: number;
  private maxRequests: number;
  private keyGenerator: (req: NextRequest) => string;

  constructor(
    windowMs: number = config.rateLimit.windowMs,
    maxRequests: number = config.rateLimit.maxRequests,
    keyGenerator?: (req: NextRequest) => string
  ) {
    this.windowMs = windowMs;
    this.maxRequests = maxRequests;
    this.keyGenerator = keyGenerator || this.defaultKeyGenerator;
  }

  private defaultKeyGenerator(req: NextRequest): string {
    const ip = req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || 'unknown';
    return `rate_limit:${ip}`;
  }

  async isRateLimited(req: NextRequest): Promise<RateLimitResult> {
    const key = this.keyGenerator(req);
    const now = Date.now();
    const window = Math.floor(now / this.windowMs);
    const windowKey = `${key}:${window}`;

    try {
      // Get current request count for this window
      const currentCount = await cache.get(windowKey);
      const requestCount = currentCount ? parseInt(currentCount) : 0;

      if (requestCount >= this.maxRequests) {
        const resetTime = (window + 1) * this.windowMs;
        const retryAfter = Math.ceil((resetTime - now) / 1000);

        return {
          success: false,
          limit: this.maxRequests,
          remaining: 0,
          resetTime,
          retryAfter,
        };
      }

      // Increment request count
      const newCount = requestCount + 1;
      await cache.set(windowKey, newCount.toString(), Math.ceil(this.windowMs / 1000));

      const resetTime = (window + 1) * this.windowMs;

      return {
        success: true,
        limit: this.maxRequests,
        remaining: this.maxRequests - newCount,
        resetTime,
      };
    } catch (error) {
      console.error('Rate limiting error:', error);
      // Fail open - allow request if rate limiting fails
      return {
        success: true,
        limit: this.maxRequests,
        remaining: this.maxRequests - 1,
        resetTime: now + this.windowMs,
      };
    }
  }

  createMiddleware() {
    return async (req: NextRequest) => {
      const result = await this.isRateLimited(req);

      if (!result.success) {
        return NextResponse.json(
          {
            error: 'Too many requests',
            message: `Rate limit exceeded. Try again in ${result.retryAfter} seconds.`,
            retryAfter: result.retryAfter,
          },
          {
            status: 429,
            headers: {
              'X-RateLimit-Limit': result.limit.toString(),
              'X-RateLimit-Remaining': result.remaining.toString(),
              'X-RateLimit-Reset': result.resetTime.toString(),
              'Retry-After': result.retryAfter?.toString() || '60',
            },
          }
        );
      }

      // Add rate limit headers to successful responses
      return NextResponse.next({
        headers: {
          'X-RateLimit-Limit': result.limit.toString(),
          'X-RateLimit-Remaining': result.remaining.toString(),
          'X-RateLimit-Reset': result.resetTime.toString(),
        },
      });
    };
  }
}

// Pre-configured rate limiters
export const apiRateLimiter = new RateLimiter(
  config.rateLimit.windowMs,
  config.rateLimit.maxRequests
);

export const authRateLimiter = new RateLimiter(
  15 * 60 * 1000, // 15 minutes
  5, // 5 attempts
  req => {
    const ip = req.headers.get('x-forwarded-for') || 'unknown';
    return `auth_rate_limit:${ip}`;
  }
);

export const emailRateLimiter = new RateLimiter(
  60 * 60 * 1000, // 1 hour
  10, // 10 emails per hour
  req => {
    const userEmail = req.headers.get('x-user-email') || 'unknown';
    return `email_rate_limit:${userEmail}`;
  }
);
