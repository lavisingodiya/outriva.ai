import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { prisma } from '@/lib/db/prisma';
import { decrypt } from '@/lib/encryption';
import { generateContent, getProviderFromModel } from '@/lib/ai/providers';
import { getEmailPrompt } from '@/lib/ai/prompts';
import { detectMisuse, getMisuseMessage } from '@/lib/ai/misuse-detection';
import { Length, EmailMessageType } from '@prisma/client';
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
      `email-gen:${user.id}`,
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
      parentMessageId,
      length,
      llmModel,
      requestReferral,
      resumeAttachment,
      status,
      saveToHistory = true, // Default to true for backward compatibility
    } = body;

    // Sanitize all user inputs to prevent prompt injection and XSS
    const sanitized = sanitizeApiInputs({
      recipientEmail: body.recipientEmail,
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
      recipientEmail,
      recipientName,
      recipientPosition,
      positionTitle,
      areasOfInterest,
      companyName,
      jobDescription,
      companyDescription,
      extraContent,
    } = sanitized;

    // Validate required fields
    if (!recipientEmail || !companyName || !llmModel || !messageType) {
      return NextResponse.json(
        { error: 'Recipient email, company name, message type, and LLM model are required' },
        { status: 400 }
      );
    }

    // Note: Generation limits check moved below after determining if using shared key
    // Users with their own API keys are NOT subject to generation limits
    const isFollowup = messageType === 'FOLLOW_UP';

    // Get user's API keys and userType
    const dbUser = await prisma.user.findUnique({
      where: { id: user.id },
      select: {
        openaiApiKey: true,
        anthropicApiKey: true,
        geminiApiKey: true,
        userType: true,
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
      const parent = await prisma.emailMessage.findFirst({
        where: {
          id: parentMessageId,
          userId: user.id,
        },
      });
      if (parent) {
        previousMessage = `Subject: ${parent.subject}\n\n${parent.body}`;
      }
    }

    // Build prompts
    const { system, user: userPrompt } = getEmailPrompt({
      messageType: messageType as EmailMessageType,
      resumeContent,
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
    });

    // Generate email
    const generatedContent = await generateContent({
      provider,
      apiKey,
      model: actualModel, // Use actual model name without prefix
      systemPrompt: system,
      userPrompt,
      maxTokens: 1000,
      temperature: 0.7,
    });

    // Check for misuse
    if (detectMisuse(generatedContent)) {
      const misuseMessage = await getMisuseMessage();
      return NextResponse.json({
        success: true,
        subject: 'Nice try!',
        body: misuseMessage,
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
      'EMAIL_MESSAGE',
      companyName || 'Unknown Company',
      positionTitle || null,
      recipientEmail || null,
      actualModel,
      false, // Not saved yet
      isFollowup
    );

    // Parse subject and body from generated content
    // Expected format: "Subject: ...\n\nBody: ..." or just "Subject: ...\n\n<email content>"
    const lines = generatedContent.split('\n');
    let subject = '';
    let emailBody = '';

    const subjectLineIndex = lines.findIndex(line => line.toLowerCase().startsWith('subject:'));
    
    if (subjectLineIndex !== -1) {
      // Extract subject
      subject = lines[subjectLineIndex].replace(/^subject:\s*/i, '').trim();

      // Extract body - everything after subject line, skipping "Body:" label if present
      emailBody = lines.slice(subjectLineIndex + 1)
        .filter((line, index) => {
          // Skip the first line if it says "Body:" or is empty
          if (index === 0 && (line.toLowerCase().startsWith('body:') || line.trim() === '')) {
            return false;
          }
          return true;
        })
        .join('\n')
        .trim();
    }

    // Fallback: if no subject found or body is empty, use entire content as body
    if (!subject || !emailBody) {
      emailBody = generatedContent.replace(/^subject:\s*.+\n*/i, '').trim() || generatedContent;
      if (!subject) {
        subject = positionTitle
          ? `Application for ${positionTitle} at ${companyName}`
          : `Inquiry about opportunities at ${companyName}`;
      }
    }

    // Save to database only if requested
    let emailMessageId = null;
    let messageId = null;
    if (saveToHistory) {
      try {
        messageId = generateMessageId('email');
      } catch (e) {
        // If message ID generation fails, continue without it
        messageId = null;
      }

      const emailMessage = await prisma.emailMessage.create({
        data: {
          userId: user.id,
          resumeId: resumeId || null,
          messageType: messageType as EmailMessageType,
          recipientEmail,
          recipientName: recipientName || null,
          recipientPosition: recipientPosition || null,
          positionTitle: positionTitle || null,
          areasOfInterest: areasOfInterest || null,
          companyName,
          jobDescription: jobDescription || null,
          companyDescription: companyDescription || null,
          subject,
          body: emailBody,
          length: length as Length,
          llmModel: actualModel, // Store actual model name
          status: status || 'SENT',
          requestReferral: requestReferral || false,
          parentMessageId: parentMessageId || null,
          messageId: messageId || null,
        },
      });
      emailMessageId = emailMessage.id;

      // Track activity count (new system)
      await trackActivityCount(user.id, isFollowup);

      // Track activity in history (only for NEW messages)
      if (messageType === 'NEW') {
        await trackActivity({
          userId: user.id,
          activityType: 'EMAIL_MESSAGE',
          companyName: companyName || 'Unknown Company',
          positionTitle,
          recipient: recipientEmail,
          llmModel: actualModel, // Store actual model name
        });
      }
    }

    return NextResponse.json({
      success: true,
      subject,
      body: emailBody,
      id: emailMessageId,
      messageId: messageId,
      saved: saveToHistory,
    });
  } catch (error) {
    logger.error('Email generation error', error);
    return NextResponse.json(
      { error: 'Failed to generate email' },
      { status: 500 }
    );
  }
}
