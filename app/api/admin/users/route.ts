import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { prisma } from '@/lib/db/prisma';
import { UserType } from '@prisma/client';
import { logger } from '@/lib/logger';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';
export const revalidate = 60; // Cache for 1 minute (user list changes moderately)

// GET - List all users (Admin only)
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

    // Get query parameters for filtering/pagination
    const { searchParams } = new URL(req.url);
    const userType = searchParams.get('userType');
    const search = searchParams.get('search');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '50');
    const skip = (page - 1) * limit;

    // Build filter
    const where: any = {};
    if (userType && userType !== 'ALL') {
      where.userType = userType;
    }
    if (search) {
      where.email = { contains: search, mode: 'insensitive' };
    }

    // Fetch users
    const [users, totalCount] = await Promise.all([
      prisma.user.findMany({
        where,
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
        skip,
        take: limit,
      }),
      prisma.user.count({ where }),
    ]);

    // Transform to safe format (don't expose actual API keys)
    const safeUsers = users.map(u => ({
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
      users: safeUsers,
      pagination: {
        page,
        limit,
        totalCount,
        totalPages: Math.ceil(totalCount / limit),
      },
    });
  } catch (error) {
    logger.error('Admin get users error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch users' },
      { status: 500 }
    );
  }
}

// PUT - Update user (change type or admin status)
export async function PUT(req: NextRequest) {
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

    const body = await req.json();
    const { userId, userType } = body;

    if (!userId) {
      return NextResponse.json({ error: 'Missing userId' }, { status: 400 });
    }

    // Validate userType if provided
    if (userType && !Object.values(UserType).includes(userType)) {
      return NextResponse.json(
        { error: 'Invalid userType. Must be one of: FREE, PLUS, ADMIN' },
        { status: 400 }
      );
    }

    // Build update data object with only whitelisted fields
    const updateData: { userType?: UserType } = {};
    if (userType) {
      updateData.userType = userType as UserType;
    }

    // Update user with explicitly whitelisted fields only
    const updated = await prisma.user.update({
      where: { id: userId },
      data: updateData,
      select: {
        id: true,
        email: true,
        userType: true,
      },
    });

    return NextResponse.json({ user: updated });
  } catch (error) {
    logger.error('Admin update user error:', error);
    return NextResponse.json(
      { error: 'Failed to update user' },
      { status: 500 }
    );
  }
}
