import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';

const FREE_MONTHLY_LIMIT = 5;

export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

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

    // Check if it's a new month and reset if needed
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

    return NextResponse.json({
      used: currentCount,
      limit: user.isAdmin ? null : FREE_MONTHLY_LIMIT,
      remaining: user.isAdmin ? null : Math.max(0, FREE_MONTHLY_LIMIT - currentCount),
      resetDate: isNewMonth ? now.toISOString() : user.usageResetDate,
      isAdmin: user.isAdmin,
    });
  } catch (error) {
    console.error('Usage fetch error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch usage' },
      { status: 500 }
    );
  }
}
