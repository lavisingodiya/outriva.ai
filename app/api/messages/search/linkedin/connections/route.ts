import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { prisma } from '@/lib/db/prisma';
import { logger } from '@/lib/logger';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';
export const revalidate = 60;

export async function GET(req: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const searchParams = req.nextUrl.searchParams;
    const query = searchParams.get('q') || '';

    // Search for CONNECTION_NOTE messages with REQUESTED status
    const messages = await prisma.linkedInMessage.findMany({
      where: {
        userId: user.id,
        messageType: 'CONNECTION_NOTE',
        status: 'REQUESTED',
        OR: query ? [
          { recipientName: { contains: query, mode: 'insensitive' } },
          { companyName: { contains: query, mode: 'insensitive' } },
          { positionTitle: { contains: query, mode: 'insensitive' } },
          { linkedinUrl: { contains: query, mode: 'insensitive' } },
        ] : undefined,
      },
      select: {
        id: true,
        companyName: true,
        positionTitle: true,
        recipientName: true,
        recipientPosition: true,
        linkedinUrl: true,
        content: true,
        jobDescription: true,
        companyDescription: true,
        areasOfInterest: true,
        resumeId: true,
        length: true,
        llmModel: true,
        status: true,
        createdAt: true,
        messageType: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
      take: 20,
    });

    return NextResponse.json({ messages });
  } catch (error) {
    logger.error('Connection request search error', error);
    return NextResponse.json(
      { error: 'Failed to search connection requests' },
      { status: 500 }
    );
  }
}
