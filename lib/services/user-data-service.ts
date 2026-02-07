import { prisma } from '@/lib/db/prisma';
import type { UserType } from '@prisma/client';

export interface UserGenerationData {
  id: string;
  openaiApiKey: string | null;
  anthropicApiKey: string | null;
  geminiApiKey: string | null;
  userType: UserType;
  generationCount: number;
  followupGenerationCount: number;
  activityCount: number;
  monthlyResetDate: Date;
  resume?: {
    id: string;
    content: string;
  } | null;
  parentEmailMessage?: {
    id: string;
    subject: string;
    body: string;
  } | null;
  parentLinkedInMessage?: {
    id: string;
    content: string;
  } | null;
}

interface FetchOptions {
  resumeId?: string;
  parentEmailMessageId?: string;
  parentLinkedInMessageId?: string;
}

/**
 * Fetch all user data needed for generation in a single optimized query
 * This prevents N+1 queries by including all related data upfront
 */
export async function getUserGenerationData(
  userId: string,
  options: FetchOptions = {}
): Promise<UserGenerationData | null> {
  const { resumeId, parentEmailMessageId, parentLinkedInMessageId } = options;

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      openaiApiKey: true,
      anthropicApiKey: true,
      geminiApiKey: true,
      userType: true,
      generationCount: true,
      followupGenerationCount: true,
      activityCount: true,
      monthlyResetDate: true,
      // Include resume if resumeId is provided
      ...(resumeId && {
        resumes: {
          where: { id: resumeId },
          select: {
            id: true,
            content: true,
          },
          take: 1,
        },
      }),
      // Include parent email message if provided
      ...(parentEmailMessageId && {
        emailMessages: {
          where: { id: parentEmailMessageId },
          select: {
            id: true,
            subject: true,
            body: true,
          },
          take: 1,
        },
      }),
      // Include parent LinkedIn message if provided
      ...(parentLinkedInMessageId && {
        linkedinMessages: {
          where: { id: parentLinkedInMessageId },
          select: {
            id: true,
            content: true,
          },
          take: 1,
        },
      }),
    },
  });

  if (!user) return null;

  return {
    id: user.id,
    openaiApiKey: user.openaiApiKey,
    anthropicApiKey: user.anthropicApiKey,
    geminiApiKey: user.geminiApiKey,
    userType: user.userType,
    generationCount: user.generationCount,
    followupGenerationCount: user.followupGenerationCount,
    activityCount: user.activityCount,
    monthlyResetDate: user.monthlyResetDate,
    resume: resumeId && 'resumes' in user ? user.resumes[0] : undefined,
    parentEmailMessage: parentEmailMessageId && 'emailMessages' in user ? user.emailMessages[0] : undefined,
    parentLinkedInMessage: parentLinkedInMessageId && 'linkedinMessages' in user ? user.linkedinMessages[0] : undefined,
  };
}

/**
 * Fetch user data for API key resolution only (lighter query)
 */
export async function getUserApiKeys(userId: string) {
  return prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      openaiApiKey: true,
      anthropicApiKey: true,
      geminiApiKey: true,
      userType: true,
    },
  });
}
