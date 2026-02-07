import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { prisma } from '@/lib/db/prisma';
import { ApplicationStatus } from '@prisma/client';
import { logger } from '@/lib/logger';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';
export const revalidate = 120; // Cache for 2 minutes

export async function GET(req: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get query parameters for filtering
    const { searchParams } = new URL(req.url);
    const type = searchParams.get('type');
    const status = searchParams.get('status');
    const search = searchParams.get('search');

    // Fetch all three types of content
    const [coverLetters, linkedInMessages, emailMessages] = await Promise.all([
      prisma.coverLetter.findMany({
        where: {
          userId: user.id,
          ...(search
            ? {
                OR: [
                  { companyName: { contains: search, mode: 'insensitive' } },
                  { positionTitle: { contains: search, mode: 'insensitive' } },
                ],
              }
            : {}),
        },
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          companyName: true,
          positionTitle: true,
          createdAt: true,
          content: true,
        },
      }),
      prisma.linkedInMessage.findMany({
        where: {
          userId: user.id,
          ...(status && status !== 'ALL' ? { status: status as ApplicationStatus } : {}),
          ...(search
            ? {
                OR: [
                  { companyName: { contains: search, mode: 'insensitive' } },
                  { positionTitle: { contains: search, mode: 'insensitive' } },
                  { areasOfInterest: { contains: search, mode: 'insensitive' } },
                ],
              }
            : {}),
        },
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          companyName: true,
          positionTitle: true,
          status: true,
          createdAt: true,
          content: true,
          messageType: true,
          followUpMessages: {
            select: { id: true },
          },
        },
      }),
      prisma.emailMessage.findMany({
        where: {
          userId: user.id,
          ...(status && status !== 'ALL' ? { status: status as ApplicationStatus } : {}),
          ...(search
            ? {
                OR: [
                  { companyName: { contains: search, mode: 'insensitive' } },
                  { positionTitle: { contains: search, mode: 'insensitive' } },
                  { areasOfInterest: { contains: search, mode: 'insensitive' } },
                ],
              }
            : {}),
        },
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          companyName: true,
          positionTitle: true,
          status: true,
          createdAt: true,
          subject: true,
          body: true,
          messageType: true,
          followUpMessages: {
            select: { id: true },
          },
        },
      }),
    ]);

    // Transform into unified history format
    let history = [
      ...coverLetters.map((item) => ({
        id: item.id,
        type: 'Cover Letter' as const,
        company: item.companyName || 'N/A',
        position: item.positionTitle || 'N/A',
        createdAt: item.createdAt.toISOString(),
        content: item.content,
      })),
      ...linkedInMessages.map((item) => ({
        id: item.id,
        type: 'LinkedIn' as const,
        company: item.companyName,
        position: item.positionTitle || item.companyName,
        status: item.status,
        createdAt: item.createdAt.toISOString(),
        content: item.content,
        messageType: item.messageType,
        hasFollowUp: item.followUpMessages.length > 0,
      })),
      ...emailMessages.map((item) => ({
        id: item.id,
        type: 'Email' as const,
        company: item.companyName,
        position: item.positionTitle || item.companyName,
        status: item.status,
        createdAt: item.createdAt.toISOString(),
        subject: item.subject,
        body: item.body,
        messageType: item.messageType,
        hasFollowUp: item.followUpMessages.length > 0,
      })),
    ];

    // Filter by type if specified
    if (type && type !== 'ALL') {
      history = history.filter((item) => item.type === type);
    }

    // Sort by date descending
    history.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    return NextResponse.json({ history });
  } catch (error) {
    logger.error('Get history error', error);
    return NextResponse.json(
      { error: 'Failed to get history' },
      { status: 500 }
    );
  }
}
