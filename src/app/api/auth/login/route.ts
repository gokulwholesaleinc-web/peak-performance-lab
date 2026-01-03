import { NextResponse } from 'next/server';
import { db } from '@/db';
import { users } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { createSession, setSessionCookie } from '@/lib/auth';
import { z } from 'zod';

const loginSchema = z.object({
  username: z.string().min(1),
  password: z.string().min(1),
});

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const result = loginSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        { error: 'Username and password required' },
        { status: 400 }
      );
    }

    const { username, password } = result.data;

    // Test user credentials configuration
    const testUsers = {
      admin: {
        email: 'admin@peakperformancelab.com',
        name: 'Admin',
        role: 'admin' as const,
        redirectTo: '/admin',
      },
      test: {
        email: 'test@example.com',
        name: 'Test Customer',
        role: 'client' as const,
        redirectTo: '/dashboard',
      },
    };

    // Check for test credentials (admin/admin or test/test)
    const testUserConfig = username in testUsers && username === password
      ? testUsers[username as keyof typeof testUsers]
      : null;

    if (testUserConfig) {
      // Find or create test user
      let [testUser] = await db
        .select()
        .from(users)
        .where(eq(users.email, testUserConfig.email))
        .limit(1);

      if (!testUser) {
        // Create test user
        const [newUser] = await db
          .insert(users)
          .values({
            email: testUserConfig.email,
            name: testUserConfig.name,
            role: testUserConfig.role,
          })
          .returning();
        testUser = newUser;
      }

      // Create session
      const sessionToken = await createSession(testUser.id);
      await setSessionCookie(sessionToken);

      return NextResponse.json({
        success: true,
        user: {
          id: testUser.id,
          email: testUser.email,
          name: testUser.name,
          role: testUser.role,
        },
        redirectTo: testUserConfig.redirectTo,
      });
    }

    return NextResponse.json(
      { error: 'Invalid credentials' },
      { status: 401 }
    );
  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json(
      { error: 'Login failed' },
      { status: 500 }
    );
  }
}
