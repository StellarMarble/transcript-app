import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'You must be logged in to view transcripts' },
        { status: 401 }
      );
    }

    const { id } = await params;

    const transcript = await prisma.transcript.findUnique({
      where: { id },
    });

    if (!transcript) {
      return NextResponse.json(
        { error: 'Transcript not found' },
        { status: 404 }
      );
    }

    // Check ownership
    if (transcript.userId !== session.user.id) {
      return NextResponse.json(
        { error: 'You do not have permission to view this transcript' },
        { status: 403 }
      );
    }

    return NextResponse.json({
      transcript: {
        id: transcript.id,
        url: transcript.url,
        platform: transcript.platform,
        title: transcript.title,
        content: transcript.content,
        duration: transcript.duration,
        status: transcript.status,
        error: transcript.error,
        createdAt: transcript.createdAt,
      },
    });
  } catch (error) {
    console.error('Get transcript error:', error);
    return NextResponse.json(
      { error: 'Failed to get transcript' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'You must be logged in to delete transcripts' },
        { status: 401 }
      );
    }

    const { id } = await params;

    const transcript = await prisma.transcript.findUnique({
      where: { id },
    });

    if (!transcript) {
      return NextResponse.json(
        { error: 'Transcript not found' },
        { status: 404 }
      );
    }

    // Check ownership
    if (transcript.userId !== session.user.id) {
      return NextResponse.json(
        { error: 'You do not have permission to delete this transcript' },
        { status: 403 }
      );
    }

    await prisma.transcript.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Delete transcript error:', error);
    return NextResponse.json(
      { error: 'Failed to delete transcript' },
      { status: 500 }
    );
  }
}
