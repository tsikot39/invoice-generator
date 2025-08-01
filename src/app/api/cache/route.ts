import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth-helper';
import { CacheStats, BulkCache } from '@/lib/cache-utils';
import { createApiError, createApiResponse } from '@/lib/utils-invoice';

// GET /api/cache - Get cache statistics
export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.email) {
      return NextResponse.json(createApiError('Unauthorized', 401), {
        status: 401,
      });
    }

    const stats = await CacheStats.getStats();

    return NextResponse.json(
      createApiResponse({
        cacheStats: stats,
        message: 'Cache statistics retrieved successfully',
      })
    );
  } catch (error) {
    console.error('GET /api/cache error:', error);
    return NextResponse.json(createApiError('Internal server error', 500), {
      status: 500,
    });
  }
}

// POST /api/cache - Cache management operations
export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.email) {
      return NextResponse.json(createApiError('Unauthorized', 401), {
        status: 401,
      });
    }

    const body = await request.json();
    const { action, userId } = body;

    switch (action) {
      case 'clear-user':
        await BulkCache.clearUserCache(userId || session.user.email);
        return NextResponse.json(
          createApiResponse({
            message: `Cache cleared for user: ${userId || session.user.email}`,
          })
        );

      case 'prewarm':
        await BulkCache.preWarmUserCache(userId || session.user.email);
        return NextResponse.json(
          createApiResponse({
            message: `Cache pre-warmed for user: ${userId || session.user.email}`,
          })
        );

      case 'cleanup':
        await CacheStats.clearExpiredKeys();
        return NextResponse.json(
          createApiResponse({
            message: 'Expired cache keys cleaned up',
          })
        );

      default:
        return NextResponse.json(
          createApiError('Invalid action. Supported actions: clear-user, prewarm, cleanup', 400),
          { status: 400 }
        );
    }
  } catch (error) {
    console.error('POST /api/cache error:', error);
    return NextResponse.json(createApiError('Internal server error', 500), {
      status: 500,
    });
  }
}
