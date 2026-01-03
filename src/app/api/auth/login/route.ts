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

    // Test admin login - only "admin/admin" works
    if (username === 'admin' && password === 'admin') {
      // Find or create admin user
      let [adminUser] = await db
        .select()
        .from(users)
        .where(eq(users.email, 'admin@peakperformancelab.com'))
        .limit(1);

      if (!adminUser) {
        // Create admin user
        const [newAdmin] = await db
          .insert(users)
          .values({
            email: 'admin@peakperformancelab.com',
            name: 'Admin',
            role: 'admin',
          })
          .returning();
        adminUser = newAdmin;
      }

      // Create session
      const sessionToken = await createSession(adminUser.id);
      await setSessionCookie(sessionToken);

      return NextResponse.json({
        success: true,
        user: {
          id: adminUser.id,
          email: adminUser.email,
          name: adminUser.name,
          role: adminUser.role,
        },
        redirectTo: '/admin',
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
