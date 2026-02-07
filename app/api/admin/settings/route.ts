import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { prisma } from '@/lib/db/prisma';
import { getMisuseMessage, setMisuseMessage } from '@/lib/ai/misuse-detection';
import { logger } from '@/lib/logger';
import { handleApiError } from '@/lib/api/errors';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';
export const revalidate = 120; // Cache for 2 minutes

// GET all settings (usage limits + misuse message)
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

    // Fetch both settings in parallel
    const [limits, misuseMessage] = await Promise.all([
      prisma.usageLimitSettings.findMany({
        orderBy: { userType: 'asc' },
      }),
      getMisuseMessage(),
    ]);

    return NextResponse.json({ limits, misuseMessage });
  } catch (error) {
    logger.error('Get admin settings error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch admin settings' },
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

// PATCH update misuse message
export async function PATCH(req: NextRequest) {
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
    const { message } = body;

    if (!message || typeof message !== 'string') {
      return NextResponse.json({ error: 'Message is required and must be a string' }, { status: 400 });
    }

    if (message.trim().length === 0) {
      return NextResponse.json({ error: 'Message cannot be empty' }, { status: 400 });
    }

    // Update misuse message
    await setMisuseMessage(message);

    return NextResponse.json({ success: true, message });
  } catch (error) {
    return handleApiError(error, 'Update misuse message error');
  }
}
