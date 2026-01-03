import { NextRequest, NextResponse } from 'next/server';
import { deleteSession, clearSessionCookie, getSessionTokenFromRequest } from '@/lib/auth';

export async function POST(request: NextRequest) {
  try {
    const token = getSessionTokenFromRequest(request);

    if (token) {
      // Delete session from database
      await deleteSession(token);
    }

    // Clear session cookie
    await clearSessionCookie();

    return NextResponse.json({
      success: true,
      message: 'Logged out successfully',
    });
  } catch (error) {
    console.error('Logout error:', error);
    // Still clear the cookie even if there's an error
    await clearSessionCookie();

    return NextResponse.json({
      success: true,
      message: 'Logged out',
    });
  }
}
