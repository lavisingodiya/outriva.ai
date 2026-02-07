import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { prisma } from '@/lib/db/prisma';
import { logger } from '@/lib/logger';
import { decrypt } from '@/lib/encryption';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

// GET - Decrypt a shared API key for editing (Admin only)
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

    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'Key ID is required' }, { status: 400 });
    }

    const sharedKey = await prisma.sharedApiKey.findUnique({
      where: { id },
      select: {
        id: true,
        provider: true,
        apiKey: true,
      },
    });

    if (!sharedKey) {
      return NextResponse.json({ error: 'Key not found' }, { status: 404 });
    }

    return NextResponse.json({
      id: sharedKey.id,
      provider: sharedKey.provider,
      apiKey: decrypt(sharedKey.apiKey),
    });
  } catch (error) {
    logger.error('Decrypt shared key error:', error);
    return NextResponse.json(
      { error: 'Failed to decrypt shared API key' },
      { status: 500 }
    );
  }
}
