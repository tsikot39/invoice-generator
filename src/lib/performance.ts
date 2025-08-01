interface PerformanceMetrics {
  requestCount: number;
  averageResponseTime: number;
  errorCount: number;
  cacheHitRate: number;
  memoryUsage: NodeJS.MemoryUsage;
  timestamp: string;
}

interface RequestMetric {
  method: string;
  path: string;
  duration: number;
  status: number;
  timestamp: number;
  userId?: string;
  cacheHit?: boolean;
}

class MetricsCollector {
  private metrics: RequestMetric[] = [];
  private readonly maxMetrics = 1000; // Keep last 1000 requests
  private startTime = Date.now();

  recordRequest(metric: RequestMetric) {
    this.metrics.push(metric);

    // Trim old metrics
    if (this.metrics.length > this.maxMetrics) {
      this.metrics = this.metrics.slice(-this.maxMetrics);
    }
  }

  getMetrics(timeWindowMs = 300000): PerformanceMetrics {
    // Default 5 minutes
    const now = Date.now();
    const cutoff = now - timeWindowMs;

    const recentMetrics = this.metrics.filter(m => m.timestamp > cutoff);

    const requestCount = recentMetrics.length;
    const errorCount = recentMetrics.filter(m => m.status >= 400).length;
    const totalResponseTime = recentMetrics.reduce((sum, m) => sum + m.duration, 0);
    const averageResponseTime = requestCount > 0 ? totalResponseTime / requestCount : 0;

    const cacheRequests = recentMetrics.filter(m => m.cacheHit !== undefined);
    const cacheHits = cacheRequests.filter(m => m.cacheHit === true).length;
    const cacheHitRate = cacheRequests.length > 0 ? (cacheHits / cacheRequests.length) * 100 : 0;

    return {
      requestCount,
      averageResponseTime: Math.round(averageResponseTime * 100) / 100,
      errorCount,
      cacheHitRate: Math.round(cacheHitRate * 100) / 100,
      memoryUsage: process.memoryUsage(),
      timestamp: new Date().toISOString(),
    };
  }

  getTopEndpoints(limit = 10) {
    const endpointStats = new Map<string, { count: number; avgDuration: number; errors: number }>();

    this.metrics.forEach(metric => {
      const key = `${metric.method} ${metric.path}`;
      const existing = endpointStats.get(key) || { count: 0, avgDuration: 0, errors: 0 };

      existing.count++;
      existing.avgDuration =
        (existing.avgDuration * (existing.count - 1) + metric.duration) / existing.count;
      if (metric.status >= 400) existing.errors++;

      endpointStats.set(key, existing);
    });

    return Array.from(endpointStats.entries())
      .sort(([, a], [, b]) => b.count - a.count)
      .slice(0, limit)
      .map(([endpoint, stats]) => ({ endpoint, ...stats }));
  }

  getSlowestEndpoints(limit = 10) {
    const endpointStats = new Map<string, { count: number; avgDuration: number }>();

    this.metrics.forEach(metric => {
      const key = `${metric.method} ${metric.path}`;
      const existing = endpointStats.get(key) || { count: 0, avgDuration: 0 };

      existing.count++;
      existing.avgDuration =
        (existing.avgDuration * (existing.count - 1) + metric.duration) / existing.count;

      endpointStats.set(key, existing);
    });

    return Array.from(endpointStats.entries())
      .sort(([, a], [, b]) => b.avgDuration - a.avgDuration)
      .slice(0, limit)
      .map(([endpoint, stats]) => ({ endpoint, ...stats }));
  }

  reset() {
    this.metrics = [];
    this.startTime = Date.now();
  }

  getUptime() {
    return Date.now() - this.startTime;
  }
}

export const metricsCollector = new MetricsCollector();

// Performance monitoring middleware
export function createPerformanceMiddleware() {
  return async (req: Request, handler: () => Promise<Response>) => {
    const start = Date.now();
    const url = new URL(req.url);

    try {
      const response = await handler();
      const duration = Date.now() - start;

      metricsCollector.recordRequest({
        method: req.method,
        path: url.pathname,
        duration,
        status: response.status,
        timestamp: start,
        // Add cache hit information if available
        cacheHit: response.headers.get('x-cache-status') === 'HIT',
      });

      // Add performance headers
      response.headers.set('X-Response-Time', `${duration}ms`);
      response.headers.set('X-Request-ID', crypto.randomUUID());

      return response;
    } catch (error) {
      const duration = Date.now() - start;

      metricsCollector.recordRequest({
        method: req.method,
        path: url.pathname,
        duration,
        status: 500,
        timestamp: start,
      });

      throw error;
    }
  };
}

// Performance monitoring for cache operations
export function trackCacheOperation(
  operation: 'hit' | 'miss' | 'set' | 'delete',
  key: string,
  duration?: number
) {
  // This could be extended to track cache-specific metrics
  console.debug(`Cache ${operation}: ${key}${duration ? ` (${duration}ms)` : ''}`);
}

// Memory usage monitoring
export function getMemoryStats() {
  const usage = process.memoryUsage();
  return {
    rss: Math.round(usage.rss / 1024 / 1024), // MB
    heapTotal: Math.round(usage.heapTotal / 1024 / 1024), // MB
    heapUsed: Math.round(usage.heapUsed / 1024 / 1024), // MB
    external: Math.round(usage.external / 1024 / 1024), // MB
    heapUsedPercentage: Math.round((usage.heapUsed / usage.heapTotal) * 100),
  };
}

// Alert system for performance issues
export class PerformanceAlerter {
  private static readonly THRESHOLDS = {
    highResponseTime: 5000, // 5 seconds
    highErrorRate: 10, // 10%
    lowCacheHitRate: 50, // 50%
    highMemoryUsage: 80, // 80%
  };

  static checkAlerts(): string[] {
    const alerts: string[] = [];
    const metrics = metricsCollector.getMetrics();
    const memoryStats = getMemoryStats();

    // High response time
    if (metrics.averageResponseTime > this.THRESHOLDS.highResponseTime) {
      alerts.push(`High average response time: ${metrics.averageResponseTime}ms`);
    }

    // High error rate
    const errorRate = (metrics.errorCount / metrics.requestCount) * 100;
    if (errorRate > this.THRESHOLDS.highErrorRate) {
      alerts.push(`High error rate: ${errorRate.toFixed(1)}%`);
    }

    // Low cache hit rate
    if (metrics.cacheHitRate < this.THRESHOLDS.lowCacheHitRate) {
      alerts.push(`Low cache hit rate: ${metrics.cacheHitRate}%`);
    }

    // High memory usage
    if (memoryStats.heapUsedPercentage > this.THRESHOLDS.highMemoryUsage) {
      alerts.push(`High memory usage: ${memoryStats.heapUsedPercentage}%`);
    }

    return alerts;
  }
}
