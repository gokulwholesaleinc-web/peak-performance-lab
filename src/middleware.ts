import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { validateSession } from '@/lib/auth';

const SESSION_COOKIE_NAME = 'session_token';

// Public routes that don't require authentication
const publicRoutes = [
  '/',
  '/login',
  '/api/auth/magic-link',
  '/api/auth/verify',
  '/api/health',
  '/api/payments/webhook',
];

// Routes that start with these prefixes are public
const publicPrefixes = [
  '/api/auth/',
  '/_next/',
  '/favicon.ico',
  '/public/',
];

// Admin-only routes
const adminPrefixes = [
  '/admin',
  '/api/admin/',
];

// Client/authenticated routes
const protectedPrefixes = [
  '/dashboard',
  '/api/clients',
  '/api/bookings',
  '/api/invoices',
  '/api/payments',
];

function isPublicRoute(pathname: string): boolean {
  // Check exact matches
  if (publicRoutes.includes(pathname)) {
    return true;
  }

  // Check prefixes
  return publicPrefixes.some(prefix => pathname.startsWith(prefix));
}

function isAdminRoute(pathname: string): boolean {
  return adminPrefixes.some(prefix => pathname.startsWith(prefix));
}

function isProtectedRoute(pathname: string): boolean {
  return protectedPrefixes.some(prefix => pathname.startsWith(prefix));
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Allow public routes
  if (isPublicRoute(pathname)) {
    return NextResponse.next();
  }

  // Get session token from cookie
  const sessionToken = request.cookies.get(SESSION_COOKIE_NAME)?.value;

  // If no session token, redirect to login
  if (!sessionToken) {
    if (pathname.startsWith('/api/')) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('callbackUrl', pathname);
    return NextResponse.redirect(loginUrl);
  }

  // Validate session and get user
  const user = await validateSession(sessionToken);

  // If invalid session, redirect to login
  if (!user) {
    // Clear the invalid cookie
    const response = pathname.startsWith('/api/')
      ? NextResponse.json({ error: 'Invalid session' }, { status: 401 })
      : NextResponse.redirect(new URL('/login', request.url));

    response.cookies.delete(SESSION_COOKIE_NAME);
    return response;
  }

  // Check admin routes - require admin role
  if (isAdminRoute(pathname)) {
    if (user.role !== 'admin') {
      if (pathname.startsWith('/api/')) {
        return NextResponse.json(
          { error: 'Admin access required' },
          { status: 403 }
        );
      }
      // Redirect non-admins to client dashboard
      return NextResponse.redirect(new URL('/dashboard', request.url));
    }
  }

  // Check protected routes - require any authenticated user
  if (isProtectedRoute(pathname) || isAdminRoute(pathname)) {
    // User is authenticated, allow access
    // Add user info to headers for downstream use
    const requestHeaders = new Headers(request.headers);
    requestHeaders.set('x-user-id', user.id);
    requestHeaders.set('x-user-role', user.role);
    requestHeaders.set('x-user-email', user.email);

    return NextResponse.next({
      request: {
        headers: requestHeaders,
      },
    });
  }

  // For any other route, allow if authenticated
  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    '/((?!_next/static|_next/image|favicon.ico|public/).*)',
  ],
};
