import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { prisma } from '@/lib/db/prisma';
import { decrypt } from '@/lib/encryption';
import { generateContent, getProviderFromModel } from '@/lib/ai/providers';
import { getLinkedInPrompt } from '@/lib/ai/prompts';
import { detectMisuse, getMisuseMessage } from '@/lib/ai/misuse-detection';
import { Length, LinkedInMessageType } from '@prisma/client';
import { generateMessageId } from '@/lib/utils/message-id';
import { logger } from '@/lib/logger';
import { checkRateLimit, RATE_LIMITS } from '@/lib/csrf-protection';
import { getSharedApiKey, isSharedModel } from '@/lib/shared-keys';
import { sanitizeApiInputs } from '@/lib/input-sanitization';
import {
  canCreateActivity,
  trackActivity,
  getDaysUntilReset,
  checkUsageLimits,
  trackGeneration,
  trackGenerationHistory,
  trackActivityCount,
} from '@/lib/tracking';
import { isEmailVerified, getVerificationError } from '@/lib/email-verification';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function POST(req: NextRequest) {
  try {
    // Get authenticated user
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check email verification
    if (!isEmailVerified(user)) {
      return NextResponse.json(getVerificationError(), { status: 403 });
    }

    // Rate limiting check
    const rateLimitResult = checkRateLimit(
      `linkedin-gen:${user.id}`,
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

    // Parse request body
    const body = await req.json();
    const {
      resumeId,
      messageType,
      length,
      llmModel,
      requestReferral,
      resumeAttachment,
      simpleFormat,
      status,
      saveToHistory = true, // Default to true for backward compatibility
    } = body;

    // Use let for parentMessageId since it may be reassigned later
    let parentMessageId = body.parentMessageId;

    // Sanitize all user inputs to prevent prompt injection and XSS
    const sanitized = sanitizeApiInputs({
      linkedinUrl: body.linkedinUrl,
      recipientName: body.recipientName,
      recipientPosition: body.recipientPosition,
      positionTitle: body.positionTitle,
      areasOfInterest: body.areasOfInterest,
      companyName: body.companyName,
      jobDescription: body.jobDescription,
      companyDescription: body.companyDescription,
      extraContent: body.extraContent,
    });

    const {
      linkedinUrl,
      recipientName,
      recipientPosition,
      positionTitle,
      areasOfInterest,
      companyName,
      jobDescription,
      companyDescription,
      extraContent,
    } = sanitized;

    // Validate required fields based on message type
    if (!llmModel || !messageType) {
      return NextResponse.json(
        { error: 'Message type and LLM model are required' },
        { status: 400 }
      );
    }

    // For CONNECTION_NOTE, validate linkedin URL and recipient name
    if (messageType === 'CONNECTION_NOTE') {
      if (!linkedinUrl || !recipientName) {
        return NextResponse.json(
          { error: 'LinkedIn URL and recipient name are required for connection notes' },
          { status: 400 }
        );
      }
    } else if (!companyName) {
      // For other message types, company name is required
      return NextResponse.json(
        { error: 'Company name is required' },
        { status: 400 }
      );
    }

    // Note: Generation limits check moved below after determining if using shared key
    // Users with their own API keys are NOT subject to generation limits
    const isFollowup = messageType === 'FOLLOW_UP';

    // Check 2-message limit per recipient
    if (linkedinUrl && messageType === 'FOLLOW_UP') {
      // For follow-ups, verify an initial message exists and we haven't exceeded limit
      const existingMessages = await prisma.linkedInMessage.findMany({
        where: {
          userId: user.id,
          linkedinUrl,
        },
        orderBy: {
          createdAt: 'asc',
        },
      });

      if (existingMessages.length === 0) {
        return NextResponse.json(
          { error: 'No initial message found. Send a NEW message first.' },
          { status: 400 }
        );
      }

      if (existingMessages.length >= 2) {
        return NextResponse.json(
          { error: 'Already sent 2 messages to this recipient (1 initial + 1 follow-up)' },
          { status: 400 }
        );
      }

      // For follow-ups without explicit parentMessageId, use the most recent message
      if (!parentMessageId) {
        parentMessageId = existingMessages[existingMessages.length - 1].id;
      }
    }

    // Get user's API keys, userType, and resumeLink
    const dbUser = await prisma.user.findUnique({
      where: { id: user.id },
      select: {
        openaiApiKey: true,
        anthropicApiKey: true,
        geminiApiKey: true,
        userType: true,
        resumeLink: true,
      },
    });

    if (!dbUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Check if user selected a shared/sponsored model (prefixed with 'shared:')
    const isSharedModelSelected = llmModel.startsWith('shared:');
    const actualModel = isSharedModelSelected ? llmModel.replace('shared:', '') : llmModel;
    
    // Determine provider from the actual model name
    const provider = getProviderFromModel(actualModel);
    let apiKey: string | undefined;
    let usingSharedKey = false;

    // If user explicitly selected shared model, use shared key
    if (isSharedModelSelected && (dbUser.userType === 'PLUS' || dbUser.userType === 'ADMIN')) {
      const sharedKey = await getSharedApiKey(actualModel);
      if (sharedKey) {
        apiKey = sharedKey;
        usingSharedKey = true;
      } else {
        return NextResponse.json(
          { error: 'Selected shared model is not available' },
          { status: 400 }
        );
      }
    }

    // If no shared key was used, fall back to user's own key
    if (!usingSharedKey) {
      switch (provider) {
        case 'openai':
          if (!dbUser.openaiApiKey) {
            return NextResponse.json(
              { error: 'OpenAI API key not configured' },
              { status: 400 }
            );
          }
          apiKey = decrypt(dbUser.openaiApiKey);
          break;
        case 'anthropic':
          if (!dbUser.anthropicApiKey) {
            return NextResponse.json(
              { error: 'Anthropic API key not configured' },
              { status: 400 }
            );
          }
          apiKey = decrypt(dbUser.anthropicApiKey);
          break;
        case 'gemini':
          if (!dbUser.geminiApiKey) {
            return NextResponse.json(
              { error: 'Gemini API key not configured' },
              { status: 400 }
            );
          }
          apiKey = decrypt(dbUser.geminiApiKey);
          break;
        default:
          return NextResponse.json({ error: 'Invalid model' }, { status: 400 });
      }
    }

    // Ensure we have an API key
    if (!apiKey) {
      return NextResponse.json(
        { error: 'API key not available for this model' },
        { status: 400 }
      );
    }

    // Check generation limits ONLY if using shared/sponsored key
    // Users with their own API keys are NOT subject to generation limits
    if (usingSharedKey) {
      const generationCheck = await checkUsageLimits(user.id, isFollowup);
      if (!generationCheck.allowed) {
        return NextResponse.json(
          {
            error: generationCheck.reason,
            limitReached: true,
          },
          { status: 429 }
        );
      }
    }

    // Get resume content if provided
    let resumeContent = '';
    if (resumeId) {
      const resume = await prisma.resume.findFirst({
        where: {
          id: resumeId,
          userId: user.id,
        },
      });
      if (resume) {
        resumeContent = resume.content;
      }
    }

    // Get previous message content if follow-up
    let previousMessage = '';
    if (messageType === 'FOLLOW_UP' && parentMessageId) {
      const parent = await prisma.linkedInMessage.findFirst({
        where: {
          id: parentMessageId,
          userId: user.id,
        },
      });
      if (parent) {
        previousMessage = parent.content;
      }
    }

    // Build prompts
    const { system, user: userPrompt } = getLinkedInPrompt({
      messageType: messageType as LinkedInMessageType,
      resumeContent,
      resumeLink: dbUser.resumeLink || undefined,
      recipientName,
      recipientPosition,
      positionTitle,
      areasOfInterest,
      companyName,
      jobDescription,
      companyDescription,
      previousMessage,
      extraContent,
      length: length as Length,
      requestReferral,
      resumeAttachment,
      simpleFormat,
    });

    // Generate message
    const generatedContent = await generateContent({
      provider,
      apiKey,
      model: actualModel, // Use actual model name without prefix
      systemPrompt: system,
      userPrompt,
      maxTokens: 500,
      temperature: 0.7,
    });

    // Check for misuse
    if (detectMisuse(generatedContent)) {
      const misuseMessage = await getMisuseMessage();
      return NextResponse.json({
        success: true,
        content: misuseMessage,
        id: null,
        messageId: null,
        saved: false,
      });
    }

    // Track generation (increment counter) - only if using shared key
    await trackGeneration(user.id, isFollowup, usingSharedKey);

    // Track in generation history (not saved yet)
    await trackGenerationHistory(
      user.id,
      'LINKEDIN_MESSAGE',
      companyName || 'Unknown Company',
      positionTitle || null,
      recipientName || null,
      actualModel,
      false, // Not saved yet
      isFollowup
    );

    // Save to database only if requested
    let linkedInMessageId = null;
    let messageId = null;
    if (saveToHistory) {
      try {
        messageId = generateMessageId('linkedin');
      } catch (e) {
        // If message ID generation fails, continue without it
        messageId = null;
      }

      const linkedInMessage = await prisma.linkedInMessage.create({
        data: {
          userId: user.id,
          resumeId: resumeId || null,
          messageType: messageType as LinkedInMessageType,
          linkedinUrl: linkedinUrl || null,
          recipientName: recipientName || null,
          recipientPosition: recipientPosition || null,
          positionTitle: positionTitle || null,
          areasOfInterest: areasOfInterest || null,
          companyName: companyName || 'Unknown',
          jobDescription: jobDescription || null,
          companyDescription: companyDescription || null,
          content: generatedContent,
          length: length as Length,
          llmModel: actualModel, // Store actual model name
          status: status || 'SENT',
          requestReferral: requestReferral || false,
          parentMessageId: parentMessageId || null,
          messageId: messageId || null,
        },
      });
      linkedInMessageId = linkedInMessage.id;

      // Track activity count (new system)
      await trackActivityCount(user.id, isFollowup);

      // Track activity in history (only for NEW messages)
      if (messageType === 'NEW') {
        await trackActivity({
          userId: user.id,
          activityType: 'LINKEDIN_MESSAGE',
          companyName: companyName || 'Unknown Company',
          positionTitle,
          recipient: recipientName,
          llmModel: actualModel, // Store actual model name
        });
      }
    }

    return NextResponse.json({
      success: true,
      content: generatedContent,
      id: linkedInMessageId,
      messageId: messageId,
      saved: saveToHistory,
    });
  } catch (error) {
    logger.error('LinkedIn message generation error', error);
    return NextResponse.json(
      { error: 'Failed to generate LinkedIn message' },
      { status: 500 }
    );
  }
}
