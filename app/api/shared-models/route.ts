import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { prisma } from '@/lib/db/prisma';
import { logger } from '@/lib/logger';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';
export const revalidate = 300; // Cache for 5 minutes (shared models are relatively static)

// GET - Fetch available shared models for PLUS users
export async function GET(req: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get user type
    const dbUser = await prisma.user.findUnique({
      where: { id: user.id },
      select: { userType: true },
    });

    // Only PLUS and ADMIN users can access shared models
    if (dbUser?.userType !== 'PLUS' && dbUser?.userType !== 'ADMIN') {
      return NextResponse.json({ models: [] });
    }

    // Get all active shared API keys
    const sharedKeys = await prisma.sharedApiKey.findMany({
      where: { isActive: true },
      select: {
        id: true,
        provider: true,
        models: true,
      },
    });

    // Flatten all models with their provider info
    const models = sharedKeys.flatMap(key =>
      key.models.map(model => ({
        model,
        provider: key.provider.toLowerCase(),
        isShared: true,
        keyId: key.id,
      }))
    );

    return NextResponse.json({ models });
  } catch (error) {
    logger.error('Get shared models error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch shared models' },
      { status: 500 }
    );
  }
}
