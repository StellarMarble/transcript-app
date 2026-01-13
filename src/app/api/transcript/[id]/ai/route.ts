import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { generateSummary, generateContent, generateCustomContent } from '@/services/ai';
import { checkRateLimit, getClientIp, RATE_LIMITS } from '@/lib/rateLimit';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Check rate limit
    const clientIp = getClientIp(request);
    const rateLimitResult = checkRateLimit(`ai:${clientIp}`, RATE_LIMITS.aiOperations);

    if (!rateLimitResult.success) {
      return NextResponse.json(
        { error: `Rate limit exceeded. Try again in ${rateLimitResult.resetIn} seconds.` },
        { status: 429 }
      );
    }

    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const { action, prompt } = await request.json();

    const transcript = await prisma.transcript.findFirst({
      where: {
        id,
        userId: session.user.id,
      },
    });

    if (!transcript) {
      return NextResponse.json({ error: 'Transcript not found' }, { status: 404 });
    }

    if (transcript.status !== 'completed' || !transcript.content) {
      return NextResponse.json(
        { error: 'Transcript is not ready' },
        { status: 400 }
      );
    }

    let result;

    switch (action) {
      case 'summary':
        result = await generateSummary(transcript.content);
        break;
      case 'content':
        result = await generateContent(transcript.content, transcript.title || undefined);
        break;
      case 'custom':
        if (!prompt) {
          return NextResponse.json({ error: 'Prompt is required' }, { status: 400 });
        }
        result = await generateCustomContent(transcript.content, prompt);
        break;
      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }

    return NextResponse.json({ success: true, result });
  } catch (error) {
    console.error('AI generation error:', error);
    return NextResponse.json(
      { error: 'Failed to generate AI content' },
      { status: 500 }
    );
  }
}
