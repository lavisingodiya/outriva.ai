import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { prisma } from '@/lib/db/prisma';
import { UserType } from '@prisma/client';
import { logger } from '@/lib/logger';
import { handleApiError } from '@/lib/api/errors';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

// PATCH - Update user type (Admin only)
export async function PATCH(
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
      return NextResponse.json({ error: 'Forbidden - Admin access required' }, { status: 403 });
    }

    const body = await req.json();
    const { userType } = body;

    // Validate user type
    if (!userType || !Object.values(UserType).includes(userType)) {
      return NextResponse.json(
        { error: 'Valid userType is required (FREE, PLUS, ADMIN)' },
        { status: 400 }
      );
    }

    // Prevent admin from demoting themselves
    if (params.id === user.id && userType !== 'ADMIN') {
      return NextResponse.json(
        { error: 'You cannot change your own admin status' },
        { status: 400 }
      );
    }

    // Update user type
    const updatedUser = await prisma.user.update({
      where: { id: params.id },
      data: { userType: userType as UserType },
      select: {
        id: true,
        email: true,
        userType: true,
        updatedAt: true,
      },
    });

    return NextResponse.json({
      success: true,
      user: updatedUser,
    });
  } catch (error) {
    return handleApiError(error, 'Admin update user error');
  }
}

// DELETE - Delete user (Admin only)
export async function DELETE(
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
      return NextResponse.json({ error: 'Forbidden - Admin access required' }, { status: 403 });
    }

    // Prevent admin from deleting themselves
    if (params.id === user.id) {
      return NextResponse.json(
        { error: 'You cannot delete your own account' },
        { status: 400 }
      );
    }

    // Delete user (cascade will handle related records)
    await prisma.user.delete({
      where: { id: params.id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    return handleApiError(error, 'Admin delete user error');
  }
}
