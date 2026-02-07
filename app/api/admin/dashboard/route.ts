import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { prisma } from '@/lib/db/prisma';
import { logger } from '@/lib/logger';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';
export const revalidate = 120; // Cache for 2 minutes

// GET - Get combined dashboard data (stats + recent users) for admin
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

    // Fetch all data in parallel
    const [
      totalUsers,
      freeUsers,
      plusUsers,
      adminUsers,
      totalResumes,
      totalCoverLetters,
      totalLinkedInMessages,
      totalEmailMessages,
      usersWithOpenAI,
      usersWithAnthropic,
      usersWithGemini,
      recentUsers,
    ] = await Promise.all([
      prisma.user.count(),
      prisma.user.count({ where: { userType: 'FREE' } }),
      prisma.user.count({ where: { userType: 'PLUS' } }),
      prisma.user.count({ where: { userType: 'ADMIN' } }),
      prisma.resume.count(),
      prisma.coverLetter.count(),
      prisma.linkedInMessage.count(),
      prisma.emailMessage.count(),
      prisma.user.count({ where: { openaiApiKey: { not: null } } }),
      prisma.user.count({ where: { anthropicApiKey: { not: null } } }),
      prisma.user.count({ where: { geminiApiKey: { not: null } } }),
      // Fetch recent 5 users
      prisma.user.findMany({
        select: {
          id: true,
          email: true,
          userType: true,
          createdAt: true,
          updatedAt: true,
          openaiApiKey: true,
          anthropicApiKey: true,
          geminiApiKey: true,
          _count: {
            select: {
              resumes: true,
              coverLetters: true,
              linkedinMessages: true,
              emailMessages: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        take: 5,
      }),
    ]);

    // Transform recent users to safe format
    const safeRecentUsers = recentUsers.map(u => ({
      id: u.id,
      email: u.email,
      userType: u.userType,
      createdAt: u.createdAt,
      updatedAt: u.updatedAt,
      hasOpenaiKey: !!u.openaiApiKey,
      hasAnthropicKey: !!u.anthropicApiKey,
      hasGeminiKey: !!u.geminiApiKey,
      stats: {
        resumes: u._count.resumes,
        coverLetters: u._count.coverLetters,
        linkedinMessages: u._count.linkedinMessages,
        emailMessages: u._count.emailMessages,
        totalMessages: u._count.coverLetters + u._count.linkedinMessages + u._count.emailMessages,
      },
    }));

    return NextResponse.json({
      stats: {
        users: {
          total: totalUsers,
          free: freeUsers,
          plus: plusUsers,
          admin: adminUsers,
        },
        content: {
          resumes: totalResumes,
          coverLetters: totalCoverLetters,
          linkedInMessages: totalLinkedInMessages,
          emailMessages: totalEmailMessages,
          totalGenerated: totalCoverLetters + totalLinkedInMessages + totalEmailMessages,
        },
        apiKeys: {
          openai: usersWithOpenAI,
          anthropic: usersWithAnthropic,
          gemini: usersWithGemini,
        },
      },
      recentUsers: safeRecentUsers,
    });
  } catch (error) {
    logger.error('Admin dashboard error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch dashboard data' },
      { status: 500 }
    );
  }
}
