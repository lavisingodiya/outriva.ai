import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { prisma } from '@/lib/db/prisma';
import { ApplicationStatus } from '@prisma/client';
import { logger } from '@/lib/logger';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';
export const revalidate = 120; // Cache for 2 minutes (message content is static)

// GET - Fetch a single email message
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

    // Fetch the email message
    const message = await prisma.emailMessage.findFirst({
      where: {
        id: params.id,
        userId: user.id,
      },
    });

    if (!message) {
      return NextResponse.json(
        { error: 'Email message not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ message });
  } catch (error) {
    logger.error('Fetch email message error', error);
    return NextResponse.json(
      { error: 'Failed to fetch email message' },
      { status: 500 }
    );
  }
}

// PATCH - Update email message status
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
    const message = await prisma.emailMessage.findFirst({
      where: {
        id: params.id,
        userId: user.id,
      },
    });

    if (!message) {
      return NextResponse.json(
        { error: 'Email message not found' },
        { status: 404 }
      );
    }

    const updated = await prisma.emailMessage.update({
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
    logger.error('Update email message status error', error);
    return NextResponse.json(
      { error: 'Failed to update email message status' },
      { status: 500 }
    );
  }
}

// DELETE - Delete an email message
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
    const message = await prisma.emailMessage.findFirst({
      where: {
        id: params.id,
        userId: user.id,
      },
    });

    if (!message) {
      return NextResponse.json(
        { error: 'Email message not found' },
        { status: 404 }
      );
    }

    // Delete the message
    await prisma.emailMessage.delete({
      where: { id: params.id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    logger.error('Delete email message error', error);
    return NextResponse.json(
      { error: 'Failed to delete email message' },
      { status: 500 }
    );
  }
}
