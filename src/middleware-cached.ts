import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { SessionCache } from './lib/cache-utils';

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Check for session token in cookies
  const sessionToken =
    request.cookies.get('next-auth.session-token')?.value ||
    request.cookies.get('__Secure-next-auth.session-token')?.value;

  // Protected routes
  const protectedRoutes = ['/dashboard', '/clients', '/products', '/invoices', '/settings'];
  const protectedApiRoutes = [
    '/api/clients',
    '/api/products',
    '/api/invoices',
    '/api/dashboard',
    '/api/email-invoice',
    '/api/settings',
  ];

  const isProtectedRoute = protectedRoutes.some(route => pathname.startsWith(route));

  const isProtectedApiRoute = protectedApiRoutes.some(route => pathname.startsWith(route));

  // If trying to access protected routes without session
  if (!sessionToken && (isProtectedRoute || isProtectedApiRoute)) {
    if (isProtectedApiRoute) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    return NextResponse.redirect(new URL('/auth/signin', request.url));
  }

  // If authenticated and trying to access auth pages, redirect to dashboard
  if (sessionToken && pathname.startsWith('/auth/signin')) {
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }

  // Redirect root to dashboard if authenticated, otherwise to signin
  if (pathname === '/') {
    if (sessionToken) {
      return NextResponse.redirect(new URL('/dashboard', request.url));
    } else {
      return NextResponse.redirect(new URL('/auth/signin', request.url));
    }
  }

  // For protected routes, try to get session from cache first
  if (sessionToken && (isProtectedRoute || isProtectedApiRoute)) {
    try {
      const cachedSession = await SessionCache.getSession(sessionToken);
      if (cachedSession) {
        // Session found in cache, add it to request headers for easy access
        const response = NextResponse.next();
        const session = cachedSession as { user?: { email?: string } };
        response.headers.set('x-user-email', session.user?.email || '');
        return response;
      }
    } catch (error) {
      console.warn('Session cache error:', error);
      // Continue without cache - auth helper will handle the fallback
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api/auth (NextAuth API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!api/auth|_next/static|_next/image|favicon.ico).*)',
  ],
};
