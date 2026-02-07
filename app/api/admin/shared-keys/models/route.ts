import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { prisma } from '@/lib/db/prisma';
import { logger } from '@/lib/logger';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

// PATCH - Update models for a shared API key (Admin only)
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
    const { id, models } = body;

    if (!id || !models || !Array.isArray(models) || models.length === 0) {
      return NextResponse.json(
        { error: 'Key ID and models array (with at least one model) are required' },
        { status: 400 }
      );
    }

    // Update the shared API key's models
    const updated = await prisma.sharedApiKey.update({
      where: { id },
      data: { models },
    });

    return NextResponse.json({ 
      success: true,
      key: updated 
    });
  } catch (error) {
    logger.error('Update shared key models error:', error);
    return NextResponse.json(
      { error: 'Failed to update shared API key models' },
      { status: 500 }
    );
  }
}
