import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { prisma } from '@/lib/db/prisma';
import { ensureUserExists } from '@/lib/auth-helpers';
import { logger } from '@/lib/logger';
import { handleApiError } from '@/lib/api/errors';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';
export const revalidate = 300; // Cache for 5 minutes (user profile rarely changes)

export async function GET(req: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Ensure user exists in database
    await ensureUserExists(user);

    // Get user data including userType
    const dbUser = await prisma.user.findUnique({
      where: { id: user.id },
      select: {
        userType: true,
        email: true,
      },
    });

    if (!dbUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    return NextResponse.json({
      userType: dbUser.userType,
      email: dbUser.email,
    });
  } catch (error) {
    return handleApiError(error, 'User profile error');
  }
}
