import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { prisma } from '@/lib/db/prisma';
import { ApplicationStatus } from '@prisma/client';
import { logger } from '@/lib/logger';
import { handleApiError } from '@/lib/api/errors';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';
export const revalidate = 120; // Cache for 2 minutes (cover letter content is static)

// GET - Fetch a single cover letter
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

    // Fetch the cover letter
    const coverLetter = await prisma.coverLetter.findFirst({
      where: {
        id: params.id,
        userId: user.id,
      },
    });

    if (!coverLetter) {
      return NextResponse.json(
        { error: 'Cover letter not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ coverLetter });
  } catch (error) {
    return handleApiError(error, 'Fetch cover letter error');
  }
}

// PATCH - Update cover letter status
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
    const coverLetter = await prisma.coverLetter.findFirst({
      where: {
        id: params.id,
        userId: user.id,
      },
    });

    if (!coverLetter) {
      return NextResponse.json(
        { error: 'Cover letter not found' },
        { status: 404 }
      );
    }

    const updated = await prisma.coverLetter.update({
      where: { id: params.id },
      data: { status: status as ApplicationStatus },
    });

    return NextResponse.json({
      success: true,
      coverLetter: {
        id: updated.id,
        status: updated.status,
        updatedAt: updated.updatedAt,
      },
    });
  } catch (error) {
    return handleApiError(error, 'Update cover letter status error');
  }
}

// DELETE - Delete a cover letter
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
    const coverLetter = await prisma.coverLetter.findFirst({
      where: {
        id: params.id,
        userId: user.id,
      },
    });

    if (!coverLetter) {
      return NextResponse.json(
        { error: 'Cover letter not found' },
        { status: 404 }
      );
    }

    // Delete the cover letter
    await prisma.coverLetter.delete({
      where: { id: params.id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    return handleApiError(error, 'Delete cover letter error');
  }
}
