import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { prisma } from '@/lib/db/prisma';
import { logger } from '@/lib/logger';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';
export const revalidate = 120; // Cache for 2 minutes (stats don't need real-time updates, expensive query)

// GET - Get platform statistics (Admin only)
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

    // Get statistics
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
    ]);

    return NextResponse.json({
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
    });
  } catch (error) {
    logger.error('Admin get stats error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch statistics' },
      { status: 500 }
    );
  }
}
