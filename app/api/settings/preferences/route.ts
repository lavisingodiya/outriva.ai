import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { prisma } from '@/lib/db/prisma';
import { logger } from '@/lib/logger';
import { handleApiError } from '@/lib/api/errors';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';
export const revalidate = 60; // Cache for 1 minute (preferences change infrequently)

// GET - Fetch user preferences
export async function GET(req: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const dbUser = await prisma.user.findUnique({
      where: { id: user.id },
      select: {
        defaultLlmModel: true,
        defaultLength: true,
        autoSave: true,
        defaultStatus: true,
        followupReminderDays: true,
        resumeLink: true,
      },
    });

    if (!dbUser) {
      // Return defaults if user not found
      return NextResponse.json({
        preferences: {
          defaultLlmModel: null,
          defaultLength: 'MEDIUM',
          autoSave: true,
          defaultStatus: 'SENT',
          followupReminderDays: 7,
          resumeLink: null,
        },
      });
    }

    return NextResponse.json({
      preferences: {
        defaultLlmModel: dbUser.defaultLlmModel || null,
        defaultLength: dbUser.defaultLength || 'MEDIUM',
        autoSave: dbUser.autoSave !== null ? dbUser.autoSave : true,
        defaultStatus: dbUser.defaultStatus || 'SENT',
        followupReminderDays: dbUser.followupReminderDays || 7,
        resumeLink: dbUser.resumeLink || null,
      },
    });
  } catch (error) {
    return handleApiError(error, 'Get preferences error');
  }
}

// POST - Save user preferences
export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { defaultLlmModel, defaultLength, autoSave, defaultStatus, followupReminderDays, resumeLink } = body;

    await prisma.user.upsert({
      where: { id: user.id },
      update: {
        defaultLlmModel,
        defaultLength,
        autoSave,
        defaultStatus,
        followupReminderDays,
        resumeLink,
      },
      create: {
        id: user.id,
        email: user.email!,
        defaultLlmModel,
        defaultLength,
        autoSave,
        defaultStatus,
        followupReminderDays,
        resumeLink,
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    return handleApiError(error, 'Save preferences error');
  }
}
