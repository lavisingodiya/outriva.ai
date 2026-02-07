import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { prisma } from '@/lib/db/prisma';
import { logger } from '@/lib/logger';
import { trackActivityCount } from '@/lib/tracking';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

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
    const {
      content,
      resumeId,
      jobDescription,
      companyName,
      positionTitle,
      companyDescription,
      length,
      llmModel,
    } = body;

    if (!content || !jobDescription) {
      return NextResponse.json(
        { error: 'Content and job description are required' },
        { status: 400 }
      );
    }

    const coverLetter = await prisma.coverLetter.create({
      data: {
        userId: user.id,
        resumeId: resumeId || null,
        companyName: companyName || null,
        positionTitle: positionTitle || null,
        jobDescription,
        companyDescription: companyDescription || null,
        content,
        length: length || null,
        llmModel: llmModel || null,
      },
    });

    // Track activity count
    await trackActivityCount(user.id, false);

    return NextResponse.json({
      success: true,
      id: coverLetter.id,
    });
  } catch (error) {
    logger.error('Cover letter save error', error);
    return NextResponse.json(
      { error: 'Failed to save cover letter' },
      { status: 500 }
    );
  }
}
