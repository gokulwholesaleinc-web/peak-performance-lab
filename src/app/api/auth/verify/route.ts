import { NextResponse } from 'next/server';
import { verifyMagicLink, setSessionCookie } from '@/lib/auth';

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const token = searchParams.get('token');

    if (!token) {
      return NextResponse.redirect(`${APP_URL}/verify?error=missing_token`);
    }

    // Verify the magic link
    const result = await verifyMagicLink(token);

    if (!result) {
      return NextResponse.redirect(`${APP_URL}/verify?error=invalid_or_expired_token`);
    }

    // Set session cookie
    await setSessionCookie(result.sessionToken);

    // Redirect based on user role
    const redirectPath = result.user.role === 'admin' ? '/admin' : '/dashboard';
    return NextResponse.redirect(`${APP_URL}${redirectPath}`);
  } catch (error) {
    console.error('Magic link verification error:', error);
    return NextResponse.redirect(`${APP_URL}/verify?error=verification_failed`);
  }
}
