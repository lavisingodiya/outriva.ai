/**
 * Unified tracking system for user activities, generations, and usage limits
 * Consolidates functionality from activity-tracker.ts and usage-tracking.ts
 */

import { prisma } from '@/lib/db/prisma';
import { logger } from '@/lib/logger';
import { usageLimitsCache } from '@/lib/cache';
import type { UserType, ApplicationStatus } from '@prisma/client';

export type ActivityType = 'COVER_LETTER' | 'LINKEDIN_MESSAGE' | 'EMAIL_MESSAGE';

interface UsageLimits {
  maxActivities: number;
  maxGenerations: number;
  maxFollowupGenerations: number;
  includeFollowups: boolean;
}

interface ActivityData {
  userId: string;
  activityType: ActivityType;
  companyName: string;
  positionTitle?: string;
  recipient?: string;
  status?: ApplicationStatus;
  llmModel?: string;
}

/**
 * Get usage limits for a user type (cached for 5 minutes)
 */
async function getCachedUsageLimits(userType: UserType): Promise<UsageLimits | null> {
  const cacheKey = `limits:${userType}`;
  const cached = usageLimitsCache.get<UsageLimits>(cacheKey);
  if (cached) return cached;

  const limits = await prisma.usageLimitSettings.findUnique({
    where: { userType },
    select: {
      maxActivities: true,
      maxGenerations: true,
      maxFollowupGenerations: true,
      includeFollowups: true,
    },
  });

  if (limits) {
    usageLimitsCache.set(cacheKey, limits);
  }
  return limits;
}

/**
 * Track a new activity in the history with full details
 */
export async function trackActivity(data: ActivityData) {
  try {
    await prisma.activityHistory.create({
      data: {
        userId: data.userId,
        activityType: data.activityType,
        companyName: data.companyName,
        positionTitle: data.positionTitle,
        recipient: data.recipient,
        status: data.status,
        llmModel: data.llmModel,
        isDeleted: false,
      },
    });
  } catch (error) {
    logger.error('Failed to track activity:', error);
  }
}

/**
 * Mark activity as deleted (soft delete in history)
 */
export async function markActivityDeleted(
  userId: string,
  activityType: ActivityType,
  companyName: string,
  createdAt: Date
) {
  try {
    await prisma.activityHistory.updateMany({
      where: {
        userId,
        activityType,
        companyName,
        createdAt: {
          gte: new Date(createdAt.getTime() - 1000),
          lte: new Date(createdAt.getTime() + 1000),
        },
        isDeleted: false,
      },
      data: {
        isDeleted: true,
      },
    });
  } catch (error) {
    logger.error('Failed to mark activity as deleted:', error);
  }
}

/**
 * Get monthly activity count for a user
 */
export async function getMonthlyActivityCount(
  userId: string,
  preloadedResetDate?: Date
): Promise<number> {
  try {
    let resetDate: Date;

    if (preloadedResetDate) {
      resetDate = preloadedResetDate;
    } else {
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { monthlyResetDate: true },
      });
      if (!user) return 0;
      resetDate = new Date(user.monthlyResetDate);
    }

    const now = new Date();
    const daysSinceReset = Math.floor((now.getTime() - resetDate.getTime()) / (1000 * 60 * 60 * 24));

    // Reset if 30+ days have passed
    if (daysSinceReset >= 30) {
      await prisma.user.update({
        where: { id: userId },
        data: { monthlyResetDate: now },
      });
      return 0;
    }

    // Count activities since last reset
    const count = await prisma.activityHistory.count({
      where: {
        userId,
        createdAt: {
          gte: resetDate,
        },
      },
    });

    return count;
  } catch (error) {
    logger.error('Failed to get monthly activity count:', error);
    return 0;
  }
}

interface UserLimitData {
  userType: UserType;
  monthlyResetDate: Date;
  activityCount: number;
}

/**
 * Check if user can create new activity based on their monthly limit
 * Optimized version that accepts pre-fetched user data to avoid N+1 queries
 */
export async function canCreateActivity(
  userIdOrData: string | UserLimitData
): Promise<{
  allowed: boolean;
  currentCount: number;
  limit: number;
  resetDate: Date;
}> {
  try {
    let user: UserLimitData;
    let userId: string;

    // If string ID provided, fetch user data (legacy behavior)
    if (typeof userIdOrData === 'string') {
      userId = userIdOrData;
      const dbUser = await prisma.user.findUnique({
        where: { id: userId },
        select: { userType: true, monthlyResetDate: true, activityCount: true },
      });

      if (!dbUser) {
        return { allowed: false, currentCount: 0, limit: 0, resetDate: new Date() };
      }
      user = dbUser;
    } else {
      // Use provided user data (optimized path)
      user = userIdOrData;
      userId = ''; // Not needed for this path
    }

    // Admin means unlimited
    if (user.userType === 'ADMIN') {
      return { allowed: true, currentCount: 0, limit: 0, resetDate: user.monthlyResetDate };
    }

    // Get cached usage limit settings
    const limitSettings = await getCachedUsageLimits(user.userType);
    const limit = limitSettings?.maxActivities || 100;

    // 0 limit means unlimited
    if (limit === 0) {
      return { allowed: true, currentCount: 0, limit: 0, resetDate: user.monthlyResetDate };
    }

    // Use activityCount from user object if available, otherwise fetch
    const currentCount = user.activityCount ?? (userId ? await getMonthlyActivityCount(userId, user.monthlyResetDate) : 0);

    return {
      allowed: currentCount < limit,
      currentCount,
      limit,
      resetDate: user.monthlyResetDate,
    };
  } catch (error) {
    logger.error('Failed to check activity limit:', error);
    return { allowed: true, currentCount: 0, limit: 100, resetDate: new Date() };
  }
}

/**
 * Get days until monthly reset
 */
export function getDaysUntilReset(resetDate: Date): number {
  const now = new Date();
  const nextReset = new Date(resetDate);
  nextReset.setDate(nextReset.getDate() + 30);

  const daysLeft = Math.ceil((nextReset.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
  return Math.max(0, daysLeft);
}

interface UserGenerationData {
  userType: UserType;
  generationCount: number;
  followupGenerationCount: number;
}

/**
 * Check if user has exceeded their generation limits
 * Optimized version that accepts pre-fetched user data to avoid N+1 queries
 */
export async function checkUsageLimits(
  userIdOrData: string | UserGenerationData,
  isFollowup: boolean = false
): Promise<{ allowed: boolean; reason?: string }> {
  try {
    let user: UserGenerationData;

    // If string ID provided, fetch user data (legacy behavior)
    if (typeof userIdOrData === 'string') {
      const dbUser = await prisma.user.findUnique({
        where: { id: userIdOrData },
        select: {
          userType: true,
          generationCount: true,
          followupGenerationCount: true,
        },
      });

      if (!dbUser) {
        return { allowed: false, reason: 'User not found' };
      }
      user = dbUser;
    } else {
      // Use provided user data (optimized path)
      user = userIdOrData;
    }

    // Admins have unlimited access
    if (user.userType === 'ADMIN') {
      return { allowed: true };
    }

    const limits = await getCachedUsageLimits(user.userType);

    if (!limits) {
      return { allowed: false, reason: 'Usage limits not configured' };
    }

    // Check followup generation limit
    if (isFollowup) {
      if (limits.maxFollowupGenerations > 0 && user.followupGenerationCount >= limits.maxFollowupGenerations) {
        return {
          allowed: false,
          reason: `You've reached your monthly limit of ${limits.maxFollowupGenerations} follow-up generations. Upgrade to PLUS for more.`,
        };
      }
    } else {
      // Check main generation limit
      if (limits.maxGenerations > 0 && user.generationCount >= limits.maxGenerations) {
        return {
          allowed: false,
          reason: `You've reached your monthly limit of ${limits.maxGenerations} generations. Upgrade to PLUS for more.`,
        };
      }
    }

    return { allowed: true };
  } catch (error) {
    logger.error('Check usage limits error:', error);
    return { allowed: false, reason: 'Failed to check usage limits' };
  }
}

/**
 * Increment generation count for a user
 */
export async function trackGeneration(
  userId: string,
  isFollowup: boolean = false,
  usingSharedKey: boolean = false
): Promise<void> {
  try {
    // Only count generations if using shared/sponsored keys
    if (!usingSharedKey) {
      logger.info(`User ${userId} used their own API key - generation not counted towards limits`);
      return;
    }

    if (isFollowup) {
      await prisma.user.update({
        where: { id: userId },
        data: {
          followupGenerationCount: { increment: 1 },
        },
      });
    } else {
      await prisma.user.update({
        where: { id: userId },
        data: {
          generationCount: { increment: 1 },
        },
      });
    }
  } catch (error) {
    logger.error('Track generation error:', error);
  }
}

/**
 * Increment activity count when user saves
 */
export async function trackActivityCount(
  userId: string,
  isFollowup: boolean = false
): Promise<void> {
  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        userType: true,
      },
    });

    if (!user || user.userType === 'ADMIN') {
      return; // Don't track for admins
    }

    const limits = await getCachedUsageLimits(user.userType);

    // Only increment if not a followup, or if followups are included in count
    if (!isFollowup || limits?.includeFollowups) {
      await prisma.user.update({
        where: { id: userId },
        data: {
          activityCount: { increment: 1 },
        },
      });
    }
  } catch (error) {
    logger.error('Track activity count error:', error);
  }
}

/**
 * Check if user can save (activity limit)
 */
export async function checkActivityLimit(
  userId: string,
  isFollowup: boolean = false
): Promise<{ allowed: boolean; reason?: string }> {
  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        userType: true,
        activityCount: true,
      },
    });

    if (!user) {
      return { allowed: false, reason: 'User not found' };
    }

    // Admins have unlimited access
    if (user.userType === 'ADMIN') {
      return { allowed: true };
    }

    const limits = await getCachedUsageLimits(user.userType);

    if (!limits) {
      return { allowed: false, reason: 'Usage limits not configured' };
    }

    // Check if this followup should count
    if (isFollowup && !limits.includeFollowups) {
      return { allowed: true };
    }

    // Check activity limit
    if (limits.maxActivities > 0 && user.activityCount >= limits.maxActivities) {
      return {
        allowed: false,
        reason: `You've reached your monthly limit of ${limits.maxActivities} saved activities. Upgrade to PLUS for more.`,
      };
    }

    return { allowed: true };
  } catch (error) {
    logger.error('Check activity limit error:', error);
    return { allowed: false, reason: 'Failed to check activity limit' };
  }
}

/**
 * Track generation in activity history
 */
export async function trackGenerationHistory(
  userId: string,
  activityType: 'COVER_LETTER' | 'LINKEDIN_MESSAGE' | 'EMAIL_MESSAGE',
  companyName: string,
  positionTitle: string | null,
  recipient: string | null,
  llmModel: string | null,
  isSaved: boolean,
  isFollowup: boolean
): Promise<void> {
  try {
    await prisma.activityHistory.create({
      data: {
        userId,
        activityType,
        companyName,
        positionTitle,
        recipient,
        llmModel,
        isSaved,
        isFollowup,
      },
    });
  } catch (error) {
    logger.error('Track generation history error:', error);
  }
}

/**
 * Reset monthly counters (should be called by cron job)
 */
export async function resetMonthlyCounters(): Promise<void> {
  try {
    const now = new Date();

    const usersToReset = await prisma.user.findMany({
      where: {
        monthlyResetDate: {
          lte: now,
        },
      },
      select: { id: true },
    });

    await prisma.user.updateMany({
      where: {
        id: { in: usersToReset.map(u => u.id) },
      },
      data: {
        generationCount: 0,
        activityCount: 0,
        followupGenerationCount: 0,
        monthlyResetDate: new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000),
      },
    });

    logger.info(`Reset monthly counters for ${usersToReset.length} users`);
  } catch (error) {
    logger.error('Reset monthly counters error:', error);
  }
}
