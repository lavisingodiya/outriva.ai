import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { prisma } from '@/lib/db/prisma';
import { logger } from '@/lib/logger';
import { handleApiError } from '@/lib/api/errors';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

// POST - Set default resume
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
    const { resumeId } = body;

    if (!resumeId) {
      return NextResponse.json(
        { error: 'Resume ID is required' },
        { status: 400 }
      );
    }

    // Verify ownership
    const resume = await prisma.resume.findFirst({
      where: {
        id: resumeId,
        userId: user.id,
      },
    });

    if (!resume) {
      return NextResponse.json(
        { error: 'Resume not found' },
        { status: 404 }
      );
    }

    // Unset all other resumes as default
    await prisma.resume.updateMany({
      where: { userId: user.id },
      data: { isDefault: false },
    });

    // Set this resume as default
    await prisma.resume.update({
      where: { id: resumeId },
      data: { isDefault: true },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    return handleApiError(error, 'Set default resume error');
  }
}
