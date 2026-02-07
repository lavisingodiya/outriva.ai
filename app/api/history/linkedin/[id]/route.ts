import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { prisma } from '@/lib/db/prisma';
import { ApplicationStatus } from '@prisma/client';
import { logger } from '@/lib/logger';
import { handleApiError } from '@/lib/api/errors';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';
export const revalidate = 120; // Cache for 2 minutes (message content is static)

// GET - Fetch a single LinkedIn message
export async function GET(
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

    // Fetch the LinkedIn message
    const message = await prisma.linkedInMessage.findFirst({
      where: {
        id: params.id,
        userId: user.id,
      },
    });

    if (!message) {
      return NextResponse.json(
        { error: 'LinkedIn message not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ message });
  } catch (error) {
    return handleApiError(error, 'Fetch LinkedIn message error');
  }
}

// PATCH - Update LinkedIn message status
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

    const body = await req.json();
    const { status } = body;

    if (!status || !Object.values(ApplicationStatus).includes(status)) {
      return NextResponse.json(
        { error: 'Valid status is required (DRAFT, SENT, DONE, GHOST)' },
        { status: 400 }
      );
    }

    // Verify ownership and update
    const message = await prisma.linkedInMessage.findFirst({
      where: {
        id: params.id,
        userId: user.id,
      },
    });

    if (!message) {
      return NextResponse.json(
        { error: 'LinkedIn message not found' },
        { status: 404 }
      );
    }

    const updated = await prisma.linkedInMessage.update({
      where: { id: params.id },
      data: { status: status as ApplicationStatus },
    });

    return NextResponse.json({
      success: true,
      message: {
        id: updated.id,
        status: updated.status,
        updatedAt: updated.updatedAt,
      },
    });
  } catch (error) {
    return handleApiError(error, 'Update LinkedIn message status error');
  }
}

// DELETE - Delete a LinkedIn message
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

    // Verify ownership
    const message = await prisma.linkedInMessage.findFirst({
      where: {
        id: params.id,
        userId: user.id,
      },
    });

    if (!message) {
      return NextResponse.json(
        { error: 'LinkedIn message not found' },
        { status: 404 }
      );
    }

    // Delete the message
    await prisma.linkedInMessage.delete({
      where: { id: params.id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    return handleApiError(error, 'Delete LinkedIn message error');
  }
}
