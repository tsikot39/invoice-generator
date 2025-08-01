import { NextResponse } from 'next/server';
import { cache } from '@/lib/redis';
import dbConnect from '@/lib/mongodb';
import { config } from '@/lib/config';

interface HealthStatus {
  status: 'healthy' | 'degraded' | 'unhealthy';
  timestamp: string;
  uptime: number;
  version: string;
  services: {
    database: ServiceHealth;
    cache: ServiceHealth;
    email: ServiceHealth;
  };
  metrics?: {
    memoryUsage: NodeJS.MemoryUsage;
    cacheStats: Record<string, unknown>;
    requestCount?: number;
  };
}

interface ServiceHealth {
  status: 'up' | 'down' | 'degraded';
  responseTime?: number;
  error?: string;
  lastCheck: string;
}

class HealthChecker {
  private startTime = Date.now();

  async checkDatabase(): Promise<ServiceHealth> {
    const start = Date.now();
    try {
      await dbConnect();
      // Simple ping to verify connection
      const mongoose = (await import('mongoose')).default;
      if (mongoose.connection.db) {
        await mongoose.connection.db.admin().ping();
      }

      return {
        status: 'up',
        responseTime: Date.now() - start,
        lastCheck: new Date().toISOString(),
      };
    } catch (error) {
      return {
        status: 'down',
        responseTime: Date.now() - start,
        error: error instanceof Error ? error.message : 'Unknown error',
        lastCheck: new Date().toISOString(),
      };
    }
  }

  async checkCache(): Promise<ServiceHealth> {
    const start = Date.now();
    try {
      // Test cache operations
      const testKey = 'health_check_test';
      const testValue = 'ok';

      await cache.set(testKey, testValue, 10);
      const result = await cache.get(testKey);
      await cache.del(testKey);

      if (result !== testValue) {
        throw new Error('Cache test failed: value mismatch');
      }

      return {
        status: 'up',
        responseTime: Date.now() - start,
        lastCheck: new Date().toISOString(),
      };
    } catch (error) {
      return {
        status: 'down',
        responseTime: Date.now() - start,
        error: error instanceof Error ? error.message : 'Unknown error',
        lastCheck: new Date().toISOString(),
      };
    }
  }

  async checkEmail(): Promise<ServiceHealth> {
    const start = Date.now();
    try {
      // For now, just check if the API key is configured
      if (!config.email.apiKey || !config.email.fromEmail) {
        throw new Error('Email service not configured');
      }

      return {
        status: 'up',
        responseTime: Date.now() - start,
        lastCheck: new Date().toISOString(),
      };
    } catch (error) {
      return {
        status: 'down',
        responseTime: Date.now() - start,
        error: error instanceof Error ? error.message : 'Unknown error',
        lastCheck: new Date().toISOString(),
      };
    }
  }

  async getMetrics() {
    try {
      return {
        memoryUsage: process.memoryUsage(),
        cacheStats: {} as Record<string, unknown>,
      };
    } catch (error) {
      return {
        memoryUsage: process.memoryUsage(),
        cacheStats: {} as Record<string, unknown>,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  async getFullHealth(includeMetrics = false): Promise<HealthStatus> {
    const [database, cacheService, email] = await Promise.all([
      this.checkDatabase(),
      this.checkCache(),
      this.checkEmail(),
    ]);

    const services = { database, cache: cacheService, email };

    // Determine overall status
    const servicesDown = Object.values(services).filter(s => s.status === 'down').length;
    const servicesDegraded = Object.values(services).filter(s => s.status === 'degraded').length;

    let status: HealthStatus['status'];
    if (servicesDown > 0) {
      status = servicesDown > 1 ? 'unhealthy' : 'degraded';
    } else if (servicesDegraded > 0) {
      status = 'degraded';
    } else {
      status = 'healthy';
    }

    const health: HealthStatus = {
      status,
      timestamp: new Date().toISOString(),
      uptime: Date.now() - this.startTime,
      version: process.env.npm_package_version || '1.0.0',
      services,
    };

    if (includeMetrics) {
      health.metrics = await this.getMetrics();
    }

    return health;
  }

  async getLivenessCheck(): Promise<{ status: 'ok' | 'error'; timestamp: string }> {
    // Simple liveness check - just verify the process is running
    return {
      status: 'ok',
      timestamp: new Date().toISOString(),
    };
  }

  async getReadinessCheck(): Promise<{
    status: 'ready' | 'not-ready';
    timestamp: string;
    services: string[];
  }> {
    const health = await this.getFullHealth();
    const notReadyServices = Object.entries(health.services)
      .filter(([, service]) => service.status === 'down')
      .map(([name]) => name);

    return {
      status: notReadyServices.length === 0 ? 'ready' : 'not-ready',
      timestamp: new Date().toISOString(),
      services: notReadyServices,
    };
  }
}

// Create health checker instance
const healthCheckerInstance = new HealthChecker();

// Health check API routes
export async function GET(request: Request) {
  const url = new URL(request.url);
  const check = url.searchParams.get('check');
  const includeMetrics = url.searchParams.get('metrics') === 'true';

  try {
    switch (check) {
      case 'liveness':
        const liveness = await healthCheckerInstance.getLivenessCheck();
        return NextResponse.json(liveness);

      case 'readiness':
        const readiness = await healthCheckerInstance.getReadinessCheck();
        const readinessStatus = readiness.status === 'ready' ? 200 : 503;
        return NextResponse.json(readiness, { status: readinessStatus });

      default:
        const health = await healthCheckerInstance.getFullHealth(includeMetrics);
        const healthStatus =
          health.status === 'healthy' ? 200 : health.status === 'degraded' ? 200 : 503;
        return NextResponse.json(health, { status: healthStatus });
    }
  } catch (error) {
    return NextResponse.json(
      {
        status: 'error',
        timestamp: new Date().toISOString(),
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
