import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { prisma } from '@/lib/db/prisma';
import { logger } from '@/lib/logger';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';
export const revalidate = 300; // Cache for 5 minutes (configuration data rarely changes)

// GET all usage limits
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

    // Get all usage limits
    const limits = await prisma.usageLimitSettings.findMany({
      orderBy: { userType: 'asc' },
    });

    return NextResponse.json({ limits });
  } catch (error) {
    logger.error('Get usage limits error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch usage limits' },
      { status: 500 }
    );
  }
}

// PUT update usage limit
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
    const { userType, maxActivities, maxGenerations, maxFollowupGenerations, includeFollowups } = body;

    if (!userType || maxActivities === undefined || maxGenerations === undefined || maxFollowupGenerations === undefined) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Update usage limit
    const updated = await prisma.usageLimitSettings.upsert({
      where: { userType },
      update: {
        maxActivities,
        maxGenerations,
        maxFollowupGenerations,
        includeFollowups: includeFollowups ?? false,
      },
      create: {
        userType,
        maxActivities,
        maxGenerations,
        maxFollowupGenerations,
        includeFollowups: includeFollowups ?? false,
      },
    });

    return NextResponse.json({ limit: updated });
  } catch (error) {
    logger.error('Update usage limit error:', error);
    return NextResponse.json(
      { error: 'Failed to update usage limit' },
      { status: 500 }
    );
  }
}
