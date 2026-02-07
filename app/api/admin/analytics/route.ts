import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { prisma } from '@/lib/db/prisma';
import { logger } from '@/lib/logger';

// Mark this route as dynamic to prevent static generation
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';
export const revalidate = 120; // Cache for 2 minutes (analytics don't change frequently)

// GET - Get platform analytics (Admin only)
export async function GET(req: NextRequest) {
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

    // Get date ranges
    const now = new Date();
    const last30Days = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    const last7Days = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    // User growth statistics
    const [
      totalUsers,
      newUsersLast30Days,
      newUsersLast7Days,
      newUsersToday,
    ] = await Promise.all([
      prisma.user.count(),
      prisma.user.count({ where: { createdAt: { gte: last30Days } } }),
      prisma.user.count({ where: { createdAt: { gte: last7Days } } }),
      prisma.user.count({ where: { createdAt: { gte: today } } }),
    ]);

    // Content generation statistics
    const [
      totalCoverLetters,
      coverLettersLast30Days,
      totalLinkedInMessages,
      linkedInMessagesLast30Days,
      totalEmailMessages,
      emailMessagesLast30Days,
    ] = await Promise.all([
      prisma.coverLetter.count(),
      prisma.coverLetter.count({ where: { createdAt: { gte: last30Days } } }),
      prisma.linkedInMessage.count(),
      prisma.linkedInMessage.count({ where: { createdAt: { gte: last30Days } } }),
      prisma.emailMessage.count(),
      prisma.emailMessage.count({ where: { createdAt: { gte: last30Days } } }),
    ]);

    // Get daily content generation for the last 30 days
    const dailyStats = await prisma.$queryRaw<Array<{ date: Date; count: bigint }>>`
      SELECT DATE("createdAt") as date, COUNT(*) as count
      FROM (
        SELECT "createdAt" FROM cover_letters WHERE "createdAt" >= ${last30Days}
        UNION ALL
        SELECT "createdAt" FROM linkedin_messages WHERE "createdAt" >= ${last30Days}
        UNION ALL
        SELECT "createdAt" FROM email_messages WHERE "createdAt" >= ${last30Days}
      ) as combined
      GROUP BY DATE("createdAt")
      ORDER BY date ASC
    `;

    // Get user type distribution
    const userTypeDistribution = await prisma.user.groupBy({
      by: ['userType'],
      _count: true,
    });

    // Get most active users (top 10)
    const mostActiveUsers = await prisma.user.findMany({
      select: {
        id: true,
        email: true,
        userType: true,
        _count: {
          select: {
            coverLetters: true,
            linkedinMessages: true,
            emailMessages: true,
          },
        },
      },
      take: 10,
      orderBy: [
        {
          coverLetters: {
            _count: 'desc',
          },
        },
      ],
    });

    // Get API key adoption
    const apiKeyStats = {
      openai: await prisma.user.count({ where: { openaiApiKey: { not: null } } }),
      anthropic: await prisma.user.count({ where: { anthropicApiKey: { not: null } } }),
      gemini: await prisma.user.count({ where: { geminiApiKey: { not: null } } }),
    };

    // Get status distribution for messages
    const [emailStatusDist, linkedInStatusDist] = await Promise.all([
      prisma.emailMessage.groupBy({
        by: ['status'],
        _count: true,
      }),
      prisma.linkedInMessage.groupBy({
        by: ['status'],
        _count: true,
      }),
    ]);

    return NextResponse.json({
      userGrowth: {
        total: totalUsers,
        last30Days: newUsersLast30Days,
        last7Days: newUsersLast7Days,
        today: newUsersToday,
      },
      contentGeneration: {
        total: {
          coverLetters: totalCoverLetters,
          linkedInMessages: totalLinkedInMessages,
          emailMessages: totalEmailMessages,
          all: totalCoverLetters + totalLinkedInMessages + totalEmailMessages,
        },
        last30Days: {
          coverLetters: coverLettersLast30Days,
          linkedInMessages: linkedInMessagesLast30Days,
          emailMessages: emailMessagesLast30Days,
          all: coverLettersLast30Days + linkedInMessagesLast30Days + emailMessagesLast30Days,
        },
      },
      dailyStats: dailyStats.map(stat => ({
        date: stat.date,
        count: Number(stat.count),
      })),
      userTypeDistribution: userTypeDistribution.map(item => ({
        userType: item.userType,
        count: item._count,
      })),
      mostActiveUsers: mostActiveUsers.map(user => ({
        id: user.id,
        email: user.email,
        userType: user.userType,
        totalContent: user._count.coverLetters + user._count.linkedinMessages + user._count.emailMessages,
      })),
      apiKeyAdoption: apiKeyStats,
      statusDistribution: {
        email: emailStatusDist.map(item => ({
          status: item.status,
          count: item._count,
        })),
        linkedIn: linkedInStatusDist.map(item => ({
          status: item.status,
          count: item._count,
        })),
      },
    });
  } catch (error) {
    logger.error('Admin get analytics error', error);
    return NextResponse.json(
      { error: 'Failed to fetch analytics' },
      { status: 500 }
    );
  }
}
