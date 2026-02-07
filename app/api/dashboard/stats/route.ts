import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { prisma } from '@/lib/db/prisma';
import { ensureUserExists } from '@/lib/auth-helpers';
import { logger } from '@/lib/logger';
import { getMonthlyActivityCount, getDaysUntilReset } from '@/lib/tracking';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';
export const revalidate = 60; // Cache for 1 minute (dashboard stats change frequently)

export async function GET(req: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Ensure user exists in database
    await ensureUserExists(user);

    // Get user data including userType and reset date
    const dbUser = await prisma.user.findUnique({
      where: { id: user.id },
      select: { 
        userType: true,
        monthlyResetDate: true,
      },
    });

    if (!dbUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Get usage limit settings for user's type
    const usageLimitSettings = await prisma.usageLimitSettings.findUnique({
      where: { userType: dbUser.userType },
    });

    const maxActivities = usageLimitSettings?.maxActivities || 100;
    const includeFollowups = usageLimitSettings?.includeFollowups || false;

    // Get monthly activity count from history
    const monthlyCount = await getMonthlyActivityCount(user.id);
    const daysUntilReset = getDaysUntilReset(dbUser.monthlyResetDate);

    // Get usage counts - calculate from actual database records for accuracy
    const [generationCountDb, followupGenerationCountDb, activityCountDb] = await Promise.all([
      prisma.user.findUnique({
        where: { id: user.id },
        select: { generationCount: true },
      }),
      prisma.user.findUnique({
        where: { id: user.id },
        select: { followupGenerationCount: true },
      }),
      // Calculate actual activity count from database records
      prisma.$queryRaw<[{ count: bigint }]>`
        SELECT CAST(COUNT(*) as BIGINT) as count FROM (
          SELECT id FROM "cover_letters" WHERE "userId" = ${user.id}
          UNION ALL
          SELECT id FROM "linkedin_messages" WHERE "userId" = ${user.id} AND "messageType" = 'NEW'
          UNION ALL
          SELECT id FROM "email_messages" WHERE "userId" = ${user.id} AND "messageType" = 'NEW'
        ) as activities
      `,
    ]);

    // Get counts for each type (excluding followups if configured)
    const [coverLetterCount, linkedInCount, emailCount, recentActivity] = await Promise.all([
      prisma.coverLetter.count({
        where: { userId: user.id },
      }),
      prisma.linkedInMessage.count({
        where: {
          userId: user.id,
          ...(includeFollowups ? {} : { messageType: 'NEW' })
        },
      }),
      prisma.emailMessage.count({
        where: {
          userId: user.id,
          ...(includeFollowups ? {} : { messageType: 'NEW' })
        },
      }),
      // Get recent 5 items for activity feed
      Promise.all([
        prisma.coverLetter.findMany({
          where: { userId: user.id },
          orderBy: { createdAt: 'desc' },
          take: 5,
          select: {
            id: true,
            companyName: true,
            positionTitle: true,
            createdAt: true,
            content: true,
          },
        }),
        prisma.linkedInMessage.findMany({
          where: { userId: user.id },
          orderBy: { createdAt: 'desc' },
          take: 5,
          select: {
            id: true,
            companyName: true,
            positionTitle: true,
            createdAt: true,
            content: true,
            status: true,
            messageType: true,
            linkedinUrl: true,
            recipientName: true,
            jobDescription: true,
            companyDescription: true,
            resumeId: true,
            length: true,
            llmModel: true,
            followUpMessages: {
              select: { id: true },
            },
          },
        }),
        prisma.emailMessage.findMany({
          where: { userId: user.id },
          orderBy: { createdAt: 'desc' },
          take: 5,
          select: {
            id: true,
            companyName: true,
            positionTitle: true,
            createdAt: true,
            body: true,
            status: true,
            messageType: true,
            recipientEmail: true,
            recipientName: true,
            subject: true,
            jobDescription: true,
            companyDescription: true,
            resumeId: true,
            length: true,
            llmModel: true,
            followUpMessages: {
              select: { id: true },
            },
          },
        }),
      ]),
    ]);

    // Combine and sort recent activity
    const allActivity = [
      ...recentActivity[0].map(item => ({
        id: item.id,
        type: 'Cover Letter' as const,
        company: item.companyName || 'N/A',
        position: item.positionTitle || 'N/A',
        createdAt: item.createdAt.toISOString(),
        wordCount: item.content.split(/\s+/).length,
        status: null,
        messageType: null,
        hasFollowUp: false,
        data: null,
      })),
      ...recentActivity[1].map(item => ({
        id: item.id,
        type: 'LinkedIn' as const,
        company: item.companyName,
        position: item.positionTitle,
        createdAt: item.createdAt.toISOString(),
        wordCount: item.content.split(/\s+/).length,
        status: item.status,
        messageType: item.messageType,
        hasFollowUp: item.followUpMessages.length > 0,
        data: {
          linkedinUrl: item.linkedinUrl,
          recipientName: item.recipientName,
          jobDescription: item.jobDescription,
          companyDescription: item.companyDescription,
          resumeId: item.resumeId,
          length: item.length,
          llmModel: item.llmModel,
        },
      })),
      ...recentActivity[2].map(item => ({
        id: item.id,
        type: 'Email' as const,
        company: item.companyName,
        position: item.positionTitle,
        createdAt: item.createdAt.toISOString(),
        wordCount: item.body.split(/\s+/).length,
        status: item.status,
        messageType: item.messageType,
        hasFollowUp: item.followUpMessages.length > 0,
        data: {
          recipientEmail: item.recipientEmail,
          recipientName: item.recipientName,
          subject: item.subject,
          jobDescription: item.jobDescription,
          companyDescription: item.companyDescription,
          resumeId: item.resumeId,
          length: item.length,
          llmModel: item.llmModel,
        },
      })),
    ]
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, 5);

    // Calculate total generated
    const totalGenerated = coverLetterCount + linkedInCount + emailCount;

    // Calculate hours saved (20 min per activity)
    const hoursSaved = Math.round(
      (totalGenerated * 0.33) * 10
    ) / 10;

    // Usage percentage based on monthly activity count and user's limit
    const usagePercentage = maxActivities > 0 
      ? Math.min(Math.round((monthlyCount / maxActivities) * 100), 100)
      : 0;

    return NextResponse.json({
      totalCoverLetters: coverLetterCount,
      totalLinkedInMessages: linkedInCount,
      totalEmails: emailCount,
      totalGenerated: coverLetterCount + linkedInCount + emailCount,
      monthlyCount,
      monthlyLimit: maxActivities,
      daysUntilReset,
      hoursSaved,
      usagePercentage,
      maxActivities,
      userType: dbUser.userType,
      recentActivity: allActivity,
      generationCount: generationCountDb?.generationCount || 0,
      followupGenerationCount: followupGenerationCountDb?.followupGenerationCount || 0,
      activityCount: Number(activityCountDb[0]?.count || 0),
    });
  } catch (error) {
    logger.error('Dashboard stats error', error);
    return NextResponse.json(
      { error: 'Failed to fetch dashboard stats' },
      { status: 500 }
    );
  }
}
