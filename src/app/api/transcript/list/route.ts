import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'You must be logged in to view transcripts' },
        { status: 401 }
      );
    }

    const transcripts = await prisma.transcript.findMany({
      where: { userId: session.user.id },
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        url: true,
        platform: true,
        title: true,
        duration: true,
        status: true,
        error: true,
        createdAt: true,
      },
    });

    return NextResponse.json({ transcripts });
  } catch (error) {
    console.error('List transcripts error:', error);
    return NextResponse.json(
      { error: 'Failed to list transcripts' },
      { status: 500 }
    );
  }
}
