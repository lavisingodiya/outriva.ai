import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { authenticateRequest, handleApiError } from '@/lib/api';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';
export const revalidate = 60; // Cache for 1 minute

export async function GET(req: NextRequest) {
  try {
    const auth = await authenticateRequest();
    if (!auth.success) return auth.response;

    const count = await prisma.notification.count({
      where: {
        userId: auth.user.id,
        isRead: false,
      },
    });

    return NextResponse.json({ count });
  } catch (error) {
    return handleApiError(error, 'Get unread count error');
  }
}
