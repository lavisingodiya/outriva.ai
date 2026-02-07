import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { prisma } from '@/lib/db/prisma';
import { logger } from '@/lib/logger';

export const dynamic = 'force-dynamic';

/**
 * Admin endpoint to backfill ActivityHistory with existing cover letters, LinkedIn messages, and email messages
 * This should be run once to populate activity history with historical data
 */
export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user is admin
    const dbUser = await prisma.user.findUnique({
      where: { id: user.id },
      select: { userType: true },
    });

    if (!dbUser || dbUser.userType !== 'ADMIN') {
      return NextResponse.json({ error: 'Forbidden - Admin access required' }, { status: 403 });
    }

    let backfilledCount = 0;

    // Backfill Cover Letters
    const coverLetters = await prisma.coverLetter.findMany({
      select: {
        userId: true,
        companyName: true,
        positionTitle: true,
        llmModel: true,
        status: true,
        createdAt: true,
      },
      orderBy: { createdAt: 'asc' },
    });

    for (const cl of coverLetters) {
      // Check if this activity already exists
      const exists = await prisma.activityHistory.findFirst({
        where: {
          userId: cl.userId,
          activityType: 'COVER_LETTER',
          companyName: cl.companyName || 'Unknown Company',
          createdAt: cl.createdAt,
        },
      });

      if (!exists) {
        await prisma.activityHistory.create({
          data: {
            userId: cl.userId,
            activityType: 'COVER_LETTER',
            companyName: cl.companyName || 'Unknown Company',
            positionTitle: cl.positionTitle,
            llmModel: cl.llmModel,
            status: cl.status,
            isDeleted: false,
            createdAt: cl.createdAt,
          },
        });
        backfilledCount++;
      }
    }

    // Backfill LinkedIn Messages
    const linkedInMessages = await prisma.linkedInMessage.findMany({
      select: {
        userId: true,
        companyName: true,
        positionTitle: true,
        linkedinUrl: true,
        llmModel: true,
        createdAt: true,
      },
      orderBy: { createdAt: 'asc' },
    });

    for (const msg of linkedInMessages) {
      const exists = await prisma.activityHistory.findFirst({
        where: {
          userId: msg.userId,
          activityType: 'LINKEDIN_MESSAGE',
          companyName: msg.companyName || 'Unknown Company',
          createdAt: msg.createdAt,
        },
      });

      if (!exists) {
        await prisma.activityHistory.create({
          data: {
            userId: msg.userId,
            activityType: 'LINKEDIN_MESSAGE',
            companyName: msg.companyName || 'Unknown Company',
            positionTitle: msg.positionTitle,
            recipient: msg.linkedinUrl,
            llmModel: msg.llmModel,
            isDeleted: false,
            createdAt: msg.createdAt,
          },
        });
        backfilledCount++;
      }
    }

    // Backfill Email Messages
    const emailMessages = await prisma.emailMessage.findMany({
      select: {
        userId: true,
        companyName: true,
        positionTitle: true,
        recipientEmail: true,
        llmModel: true,
        createdAt: true,
      },
      orderBy: { createdAt: 'asc' },
    });

    for (const email of emailMessages) {
      const exists = await prisma.activityHistory.findFirst({
        where: {
          userId: email.userId,
          activityType: 'EMAIL_MESSAGE',
          companyName: email.companyName || 'Unknown Company',
          createdAt: email.createdAt,
        },
      });

      if (!exists) {
        await prisma.activityHistory.create({
          data: {
            userId: email.userId,
            activityType: 'EMAIL_MESSAGE',
            companyName: email.companyName || 'Unknown Company',
            positionTitle: email.positionTitle,
            recipient: email.recipientEmail,
            llmModel: email.llmModel,
            isDeleted: false,
            createdAt: email.createdAt,
          },
        });
        backfilledCount++;
      }
    }

    logger.info(`Backfilled ${backfilledCount} activity history records`);

    return NextResponse.json({
      success: true,
      backfilledCount,
      message: `Successfully backfilled ${backfilledCount} activity history records`,
    });
  } catch (error) {
    logger.error('Backfill activity history error:', error);
    return NextResponse.json(
      { error: 'Failed to backfill activity history' },
      { status: 500 }
    );
  }
}
