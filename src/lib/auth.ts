import { db } from '@/db';
import { users, sessions, magicLinks, type User } from '@/db/schema';
import { eq, and, gt } from 'drizzle-orm';
import bcrypt from 'bcryptjs';
import { cookies } from 'next/headers';
import { NextRequest } from 'next/server';

const SESSION_COOKIE_NAME = 'session_token';
const SESSION_EXPIRY_DAYS = 7;
const MAGIC_LINK_EXPIRY_MINUTES = 15;
const SALT_ROUNDS = 12;

/**
 * Generate and store a magic link token
 * Token expires in 15 minutes
 */
export async function createMagicLink(email: string): Promise<string> {
  const token = crypto.randomUUID();
  const expiresAt = new Date(Date.now() + MAGIC_LINK_EXPIRY_MINUTES * 60 * 1000);

  await db.insert(magicLinks).values({
    email: email.toLowerCase(),
    token,
    expiresAt,
  });

  return token;
}

/**
 * Verify magic link token
 * Creates user if not exists, creates session
 * Returns the session token and user
 */
export async function verifyMagicLink(token: string): Promise<{
  sessionToken: string;
  user: User;
} | null> {
  // Find the magic link
  const [magicLink] = await db
    .select()
    .from(magicLinks)
    .where(
      and(
        eq(magicLinks.token, token),
        gt(magicLinks.expiresAt, new Date())
      )
    )
    .limit(1);

  if (!magicLink || magicLink.used) {
    return null;
  }

  // Mark magic link as used
  await db
    .update(magicLinks)
    .set({ used: true })
    .where(eq(magicLinks.id, magicLink.id));

  // Find or create user
  let [user] = await db
    .select()
    .from(users)
    .where(eq(users.email, magicLink.email))
    .limit(1);

  if (!user) {
    // Extract name from email (before @) as a default name for new users
    const defaultName = magicLink.email.split('@')[0];
    const [newUser] = await db
      .insert(users)
      .values({
        email: magicLink.email,
        name: defaultName,
        role: 'client',
      })
      .returning();
    user = newUser;
  }

  // Create session
  const sessionToken = await createSession(user.id);

  return { sessionToken, user };
}

/**
 * Create a new session for a user
 * Returns the session token
 */
export async function createSession(userId: string): Promise<string> {
  const token = crypto.randomUUID();
  const expiresAt = new Date(Date.now() + SESSION_EXPIRY_DAYS * 24 * 60 * 60 * 1000);

  await db.insert(sessions).values({
    userId,
    token,
    expiresAt,
  });

  return token;
}

/**
 * Validate a session token
 * Returns the user if valid, null otherwise
 */
export async function validateSession(token: string): Promise<User | null> {
  const [session] = await db
    .select()
    .from(sessions)
    .where(
      and(
        eq(sessions.token, token),
        gt(sessions.expiresAt, new Date())
      )
    )
    .limit(1);

  if (!session) {
    return null;
  }

  const [user] = await db
    .select()
    .from(users)
    .where(eq(users.id, session.userId))
    .limit(1);

  if (!user) {
    return null;
  }

  return user;
}

/**
 * Delete a session (logout)
 */
export async function deleteSession(token: string): Promise<void> {
  await db.delete(sessions).where(eq(sessions.token, token));
}

/**
 * Hash a password using bcrypt
 */
export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, SALT_ROUNDS);
}

/**
 * Verify a password against a hash
 */
export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

/**
 * Get the current user from the session cookie
 * For use in Server Components and API routes
 */
export async function getCurrentUser(request?: NextRequest): Promise<User | null> {
  let token: string | undefined;

  if (request) {
    // API route - get from request cookies
    token = request.cookies.get(SESSION_COOKIE_NAME)?.value;
  } else {
    // Server component - use next/headers
    const cookieStore = await cookies();
    token = cookieStore.get(SESSION_COOKIE_NAME)?.value;
  }

  if (!token) {
    return null;
  }

  return validateSession(token);
}

/**
 * Set the session cookie
 */
export async function setSessionCookie(token: string): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: SESSION_EXPIRY_DAYS * 24 * 60 * 60, // 7 days in seconds
  });
}

/**
 * Clear the session cookie
 */
export async function clearSessionCookie(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete(SESSION_COOKIE_NAME);
}

/**
 * Get session token from cookies (for middleware)
 */
export function getSessionTokenFromRequest(request: NextRequest): string | undefined {
  return request.cookies.get(SESSION_COOKIE_NAME)?.value;
}
