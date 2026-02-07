import { prisma } from '@/lib/db/prisma';
import { generateContent, getProviderFromModel } from '@/lib/ai/providers';
import { getCoverLetterPrompt } from '@/lib/ai/prompts';
import { detectMisuse, getMisuseMessage } from '@/lib/ai/misuse-detection';
import { Length } from '@prisma/client';
import {
  trackGeneration,
  trackGenerationHistory,
  trackActivityCount,
  trackActivity,
} from '@/lib/tracking';
import { resolveApiKey } from './api-key-service';

export interface CoverLetterInput {
  userId: string;
  userType: 'FREE' | 'PLUS' | 'ADMIN';
  resumeId?: string;
  resumeContent?: string;
  jobDescription: string;
  companyName?: string;
  positionTitle?: string;
  companyDescription?: string;
  length: Length;
  llmModel: string;
  saveToHistory: boolean;
}

export interface CoverLetterResult {
  success: boolean;
  content: string;
  id: string | null;
  saved: boolean;
}

export async function generateCoverLetter(
  input: CoverLetterInput
): Promise<CoverLetterResult> {
  const {
    userId,
    userType,
    resumeId,
    resumeContent: preloadedResumeContent,
    jobDescription,
    companyName,
    positionTitle,
    companyDescription,
    length,
    llmModel,
    saveToHistory,
  } = input;

  // Resolve API key (shared vs user key)
  const { apiKey, usingSharedKey, actualModel } = await resolveApiKey({
    userId,
    model: llmModel,
    userType,
  });

  const provider = getProviderFromModel(actualModel);

  // Use pre-fetched resume content or fetch if not provided
  let resumeContent = preloadedResumeContent || '';
  if (!resumeContent && resumeId) {
    const resume = await prisma.resume.findFirst({
      where: { id: resumeId, userId },
    });
    if (resume) {
      resumeContent = resume.content;
    }
  }

  // Build prompts
  const { system, user: userPrompt } = getCoverLetterPrompt({
    resumeContent,
    jobDescription,
    companyDescription,
    companyName,
    positionTitle,
    length,
  });

  // Generate cover letter
  const generatedContent = await generateContent({
    provider,
    apiKey,
    model: actualModel,
    systemPrompt: system,
    userPrompt,
    maxTokens: 2000,
    temperature: 0.7,
  });

  // Check for misuse
  if (detectMisuse(generatedContent)) {
    const misuseMessage = await getMisuseMessage();
    return {
      success: true,
      content: misuseMessage,
      id: null,
      saved: false,
    };
  }

  // Track generation (increment counter) - only if using shared key
  await trackGeneration(userId, false, usingSharedKey);

  // Track in generation history (not saved yet)
  await trackGenerationHistory(
    userId,
    'COVER_LETTER',
    companyName || 'Unknown Company',
    positionTitle || null,
    null,
    actualModel,
    false,
    false
  );

  // Save to database only if requested
  let coverLetterId = null;
  if (saveToHistory) {
    const coverLetter = await prisma.coverLetter.create({
      data: {
        userId,
        resumeId: resumeId || null,
        companyName: companyName || null,
        positionTitle: positionTitle || null,
        jobDescription,
        companyDescription: companyDescription || null,
        content: generatedContent,
        length,
        llmModel: actualModel,
      },
    });
    coverLetterId = coverLetter.id;

    // Track activity count (new system)
    await trackActivityCount(userId, false);

    // Track activity in history (old system, keeping for compatibility)
    await trackActivity({
      userId,
      activityType: 'COVER_LETTER',
      companyName: companyName || 'Unknown Company',
      positionTitle,
      llmModel: actualModel,
    });
  }

  return {
    success: true,
    content: generatedContent,
    id: coverLetterId,
    saved: saveToHistory,
  };
}
