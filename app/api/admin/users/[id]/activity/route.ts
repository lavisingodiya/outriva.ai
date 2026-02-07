import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { prisma } from '@/lib/db/prisma';
import { logger } from '@/lib/logger';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';
export const revalidate = 120; // Cache for 2 minutes (admin viewing user activity, heavy query)

// GET - Get user activity history (Admin only)
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
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
      return NextResponse.json(
        { error: 'Forbidden - Admin access required' },
        { status: 403 }
      );
    }

    // Get target user info
    const targetUser = await prisma.user.findUnique({
      where: { id: params.id },
      select: {
        id: true,
        email: true,
        userType: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!targetUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Get all activity
    const [coverLetters, linkedInMessages, emailMessages, resumes] =
      await Promise.all([
        prisma.coverLetter.findMany({
          where: { userId: params.id },
          select: {
            id: true,
            companyName: true,
            positionTitle: true,
            status: true,
            createdAt: true,
            llmModel: true,
          },
          orderBy: { createdAt: 'desc' },
        }),
        prisma.linkedInMessage.findMany({
          where: { userId: params.id },
          select: {
            id: true,
            companyName: true,
            positionTitle: true,
            messageType: true,
            status: true,
            createdAt: true,
            llmModel: true,
          },
          orderBy: { createdAt: 'desc' },
        }),
        prisma.emailMessage.findMany({
          where: { userId: params.id },
          select: {
            id: true,
            companyName: true,
            positionTitle: true,
            messageType: true,
            status: true,
            subject: true,
            createdAt: true,
            llmModel: true,
          },
          orderBy: { createdAt: 'desc' },
        }),
        prisma.resume.findMany({
          where: { userId: params.id },
          select: {
            id: true,
            title: true,
            isDefault: true,
            createdAt: true,
          },
          orderBy: { createdAt: 'desc' },
        }),
      ]);

    // Combine all activities with type information
    const activities = [
      ...coverLetters.map((item) => ({
        ...item,
        type: 'Cover Letter',
        title: `${item.positionTitle || 'General'} at ${item.companyName}`,
      })),
      ...linkedInMessages.map((item) => ({
        ...item,
        type: 'LinkedIn',
        title: `${item.positionTitle || 'General'} at ${item.companyName}`,
      })),
      ...emailMessages.map((item) => ({
        ...item,
        type: 'Email',
        title: item.subject || `${item.positionTitle || 'General'} at ${item.companyName}`,
      })),
    ].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    return NextResponse.json({
      user: targetUser,
      activities,
      resumes,
      stats: {
        coverLetters: coverLetters.length,
        linkedInMessages: linkedInMessages.length,
        emailMessages: emailMessages.length,
        totalContent: coverLetters.length + linkedInMessages.length + emailMessages.length,
        resumes: resumes.length,
      },
    });
  } catch (error) {
    logger.error('Get user activity error', error);
    return NextResponse.json(
      { error: 'Failed to fetch user activity' },
      { status: 500 }
    );
  }
}
