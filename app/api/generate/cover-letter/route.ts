import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { Length } from '@prisma/client';
import { logger } from '@/lib/logger';
import { checkRateLimit, RATE_LIMITS } from '@/lib/csrf-protection';
import { sanitizeApiInputs } from '@/lib/input-sanitization';
import { canCreateActivity, getDaysUntilReset, checkUsageLimits } from '@/lib/tracking';
import { generateCoverLetter } from '@/lib/services/cover-letter-service';
import { getUserGenerationData } from '@/lib/services/user-data-service';
import { isEmailVerified, getVerificationError } from '@/lib/email-verification';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function POST(req: NextRequest) {
  try {
    // Get authenticated user
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check email verification
    if (!isEmailVerified(user)) {
      return NextResponse.json(getVerificationError(), { status: 403 });
    }

    // Rate limiting check
    const rateLimitResult = checkRateLimit(
      `cover-letter-gen:${user.id}`,
      RATE_LIMITS.generation
    );

    if (!rateLimitResult.allowed) {
      return NextResponse.json(
        {
          error: 'Rate limit exceeded. Please try again later.',
          resetAt: rateLimitResult.resetAt,
        },
        {
          status: 429,
          headers: {
            'X-RateLimit-Limit': RATE_LIMITS.generation.maxRequests.toString(),
            'X-RateLimit-Remaining': '0',
            'X-RateLimit-Reset': rateLimitResult.resetAt.toString(),
          },
        }
      );
    }

    // Parse and validate request body
    const body = await req.json();
    const { resumeId, length, llmModel, saveToHistory = true } = body;

    // Sanitize all user inputs
    const sanitized = sanitizeApiInputs({
      jobDescription: body.jobDescription,
      companyName: body.companyName,
      positionTitle: body.positionTitle,
      companyDescription: body.companyDescription,
    });

    const { jobDescription, companyName, positionTitle, companyDescription } = sanitized;

    // Validate required fields
    if (!jobDescription || !llmModel) {
      return NextResponse.json(
        { error: 'Job description and LLM model are required' },
        { status: 400 }
      );
    }

    // Fetch all user data in ONE optimized query (prevents N+1)
    const userData = await getUserGenerationData(user.id, { resumeId });

    if (!userData) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Check if using shared key (only for limit checking)
    const usingSharedKey = llmModel.startsWith('shared:');

    // Check generation limit ONLY if using shared key (use pre-fetched data)
    if (usingSharedKey) {
      const generationCheck = await checkUsageLimits(userData, false);
      if (!generationCheck.allowed) {
        return NextResponse.json(
          { error: generationCheck.reason, limitReached: true },
          { status: 429 }
        );
      }
    }

    // Check activity limit when saving (use pre-fetched data)
    const activityCheck = await canCreateActivity(userData);
    if (!activityCheck.allowed) {
      const daysLeft = getDaysUntilReset(activityCheck.resetDate);
      return NextResponse.json(
        {
          error: `Monthly activity limit reached (${activityCheck.currentCount}/${activityCheck.limit}). Resets in ${daysLeft} days.`,
          limitReached: true,
          currentCount: activityCheck.currentCount,
          limit: activityCheck.limit,
          daysUntilReset: daysLeft,
        },
        { status: 429 }
      );
    }

    // Generate cover letter using service (with pre-fetched data)
    const result = await generateCoverLetter({
      userId: user.id,
      userType: userData.userType,
      resumeId,
      resumeContent: userData.resume?.content,
      jobDescription,
      companyName,
      positionTitle,
      companyDescription,
      length: length as Length,
      llmModel,
      saveToHistory,
    });

    return NextResponse.json(result);
  } catch (error) {
    logger.error('Cover letter generation error', error);

    const errorMessage = error instanceof Error ? error.message : 'Failed to generate cover letter';
    const statusCode = errorMessage.includes('not configured') || errorMessage.includes('not available') ? 400 : 500;

    return NextResponse.json({ error: errorMessage }, { status: statusCode });
  }
}
