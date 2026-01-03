import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { db } from '@/db';
import { sessions, users } from '@/db/schema';
import { eq, and, gt } from 'drizzle-orm';

export type ApiUser = {
  id: string;
  email: string;
  name: string | null;
  role: 'admin' | 'client';
};

/**
 * Standard JSON response helper
 */
export function jsonResponse<T>(data: T, status: number = 200) {
  return NextResponse.json(data, { status });
}

/**
 * Error response helper
 */
export function errorResponse(message: string, status: number = 400) {
  return NextResponse.json({ error: message }, { status });
}

/**
 * Get the current user from session cookie
 */
export async function getCurrentUser(): Promise<ApiUser | null> {
  try {
    const cookieStore = await cookies();
    const sessionToken = cookieStore.get('session')?.value;

    if (!sessionToken) {
      return null;
    }

    const result = await db
      .select({
        id: users.id,
        email: users.email,
        name: users.name,
        role: users.role,
      })
      .from(sessions)
      .innerJoin(users, eq(sessions.userId, users.id))
      .where(
        and(
          eq(sessions.token, sessionToken),
          gt(sessions.expiresAt, new Date())
        )
      )
      .limit(1);

    if (result.length === 0) {
      return null;
    }

    return result[0] as ApiUser;
  } catch (error) {
    console.error('Error getting current user:', error);
    return null;
  }
}

/**
 * Require authentication - returns user or throws 401
 */
export async function requireAuth(): Promise<ApiUser> {
  const user = await getCurrentUser();
  if (!user) {
    throw new AuthError('Unauthorized', 401);
  }
  return user;
}

/**
 * Require admin role - returns admin user or throws 403
 */
export async function requireAdmin(): Promise<ApiUser> {
  const user = await requireAuth();
  if (user.role !== 'admin') {
    throw new AuthError('Forbidden - Admin access required', 403);
  }
  return user;
}

/**
 * Custom error class for auth errors
 */
export class AuthError extends Error {
  status: number;

  constructor(message: string, status: number) {
    super(message);
    this.status = status;
    this.name = 'AuthError';
  }
}

/**
 * Wrap API handler with error handling
 */
export function withErrorHandler(
  handler: (request: NextRequest) => Promise<NextResponse>
) {
  return async (request: NextRequest) => {
    try {
      return await handler(request);
    } catch (error) {
      if (error instanceof AuthError) {
        return errorResponse(error.message, error.status);
      }
      console.error('API Error:', error);
      return errorResponse('Internal server error', 500);
    }
  };
}

/**
 * Parse JSON body with error handling
 */
export async function parseBody<T>(request: NextRequest): Promise<T> {
  try {
    return await request.json();
  } catch {
    throw new AuthError('Invalid JSON body', 400);
  }
}

/**
 * Parse query parameters
 */
export function parseQuery(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  return Object.fromEntries(searchParams.entries());
}

/**
 * Pagination helper
 */
export function parsePagination(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10));
  const limit = Math.min(100, Math.max(1, parseInt(searchParams.get('limit') || '20', 10)));
  const offset = (page - 1) * limit;

  return { page, limit, offset };
}

/**
 * Create paginated response
 */
export function paginatedResponse<T>(
  data: T[],
  total: number,
  page: number,
  limit: number
) {
  return jsonResponse({
    data,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
      hasMore: page * limit < total,
    },
  });
}
