import { NextRequest, NextResponse } from 'next/server';
import NextAuth from 'next-auth';
import { authOptions } from '@/lib/auth';
import { checkRateLimit, getClientIp, RATE_LIMITS } from '@/lib/rateLimit';

const handler = NextAuth(authOptions);

// Wrap POST handler with rate limiting for login attempts
async function rateLimitedPost(req: NextRequest) {
  const url = new URL(req.url);

  // Only rate limit signin attempts (callback/credentials)
  if (url.pathname.includes('callback') || url.searchParams.get('callbackUrl')) {
    const clientIp = getClientIp(req);
    const rateLimitResult = await checkRateLimit(`auth:${clientIp}`, RATE_LIMITS.authAttempts);

    if (!rateLimitResult.success) {
      return NextResponse.json(
        { error: `Too many login attempts. Try again in ${rateLimitResult.resetIn} seconds.` },
        { status: 429 }
      );
    }
  }

  return handler(req);
}

export { handler as GET, rateLimitedPost as POST };
