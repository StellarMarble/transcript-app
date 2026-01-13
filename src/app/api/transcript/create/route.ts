import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { processURL } from '@/services/transcriptProcessor';
import { parseURL } from '@/services/urlParser';
import { checkRateLimit, getClientIp, RATE_LIMITS } from '@/lib/rateLimit';

const FREE_MONTHLY_LIMIT = 5;

export async function POST(req: NextRequest) {
  try {
    // Check rate limit
    const clientIp = getClientIp(req);
    const rateLimitResult = await checkRateLimit(`transcript:${clientIp}`, RATE_LIMITS.transcriptCreate);

    if (!rateLimitResult.success) {
      return NextResponse.json(
        { error: `Rate limit exceeded. Try again in ${rateLimitResult.resetIn} seconds.` },
        { status: 429 }
      );
    }

    // Check authentication
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'You must be logged in to create transcripts' },
        { status: 401 }
      );
    }

    // Check usage limits
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { monthlyTranscriptCount: true, usageResetDate: true, isAdmin: true },
    });

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // Reset count if it's a new month
    const now = new Date();
    const resetDate = new Date(user.usageResetDate);
    const isNewMonth = now.getMonth() !== resetDate.getMonth() ||
                       now.getFullYear() !== resetDate.getFullYear();

    let currentCount = user.monthlyTranscriptCount;
    if (isNewMonth) {
      await prisma.user.update({
        where: { id: session.user.id },
        data: { monthlyTranscriptCount: 0, usageResetDate: now },
      });
      currentCount = 0;
    }

    // Check if user has exceeded their limit (admins bypass)
    if (!user.isAdmin && currentCount >= FREE_MONTHLY_LIMIT) {
      return NextResponse.json(
        {
          error: `You've reached your free limit of ${FREE_MONTHLY_LIMIT} transcripts this month. Upgrade to continue.`,
          limitReached: true,
          used: currentCount,
          limit: FREE_MONTHLY_LIMIT,
        },
        { status: 403 }
      );
    }

    const { url } = await req.json();

    if (!url) {
      return NextResponse.json(
        { error: 'URL is required' },
        { status: 400 }
      );
    }

    // Validate URL
    const parsed = parseURL(url);

    if (parsed.platform === 'unknown') {
      return NextResponse.json(
        { error: 'Unsupported URL. Please provide a YouTube, podcast, Instagram, TikTok, or Facebook URL.' },
        { status: 400 }
      );
    }

    // Create pending transcript record
    const transcript = await prisma.transcript.create({
      data: {
        userId: session.user.id,
        url,
        platform: parsed.platform,
        content: '',
        status: 'processing',
      },
    });

    // Process the URL (this may take a while)
    const result = await processURL(url);

    if (result.success && result.transcript) {
      // Update transcript with results and increment usage count
      const [updated] = await Promise.all([
        prisma.transcript.update({
          where: { id: transcript.id },
          data: {
            content: result.transcript,
            title: result.title,
            duration: result.duration,
            status: 'completed',
          },
        }),
        prisma.user.update({
          where: { id: session.user.id },
          data: { monthlyTranscriptCount: { increment: 1 } },
        }),
      ]);

      return NextResponse.json({
        success: true,
        transcript: {
          id: updated.id,
          url: updated.url,
          platform: updated.platform,
          title: updated.title,
          content: updated.content,
          duration: updated.duration,
          status: updated.status,
          method: result.method,
          createdAt: updated.createdAt,
        },
      });
    } else {
      // Update transcript with error
      await prisma.transcript.update({
        where: { id: transcript.id },
        data: {
          status: 'failed',
          error: result.error,
        },
      });

      return NextResponse.json(
        {
          success: false,
          error: result.error || 'Failed to process transcript',
          transcriptId: transcript.id,
        },
        { status: 422 }
      );
    }
  } catch (error) {
    console.error('Transcript creation error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json(
      { error: `Failed to create transcript: ${errorMessage}` },
      { status: 500 }
    );
  }
}
