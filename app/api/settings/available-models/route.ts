import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { prisma } from '@/lib/db/prisma';
import { getModelProvider } from '@/lib/utils/modelNames';
import { logger } from '@/lib/logger';
import { getAvailableSharedModels } from '@/lib/shared-keys';
import { getAvailableModelsWithNames, decrypt } from '@/lib/encryption';
import { handleApiError } from '@/lib/api/errors';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';
export const revalidate = 300; // Cache for 5 minutes (models rarely change, prevents expensive external API calls)

export async function GET(req: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get user's available models
    const dbUser = await prisma.user.findUnique({
      where: { id: user.id },
      select: {
        openaiModels: true,
        anthropicModels: true,
        geminiModels: true,
        openaiApiKey: true,
        anthropicApiKey: true,
        geminiApiKey: true,
        userType: true,
      },
    });

    if (!dbUser) {
      return NextResponse.json({
        hasAnyKey: false,
        models: [],
        modelsByProvider: {
          openai: [],
          anthropic: [],
          gemini: [],
        },
      });
    }

    // Get shared models for PLUS users
    let sharedModels: any[] = [];
    if (dbUser.userType === 'PLUS' || dbUser.userType === 'ADMIN') {
      const shared = await getAvailableSharedModels();
      sharedModels = shared.map(sm => ({
        value: `shared:${sm.model}`, // Prefix with 'shared:' to distinguish from user's own keys
        label: `${sm.displayName || sm.model}`,
        provider: sm.provider,
        isShared: true,
      }));
    }

    // Fetch models with display names from APIs for each provider the user has keys for
    const allModels: any[] = [];

    if (dbUser.openaiApiKey) {
      try {
        const openaiKey = decrypt(dbUser.openaiApiKey);
        const models = await getAvailableModelsWithNames(openaiKey, 'openai');
        allModels.push(...models.map(m => ({
          value: m.id,
          label: `${m.displayName} (OpenAI)`,
          provider: 'openai',
          isShared: false,
        })));
      } catch (error) {
        logger.error('Failed to fetch OpenAI models', error);
      }
    }

    if (dbUser.anthropicApiKey) {
      try {
        const anthropicKey = decrypt(dbUser.anthropicApiKey);
        const models = await getAvailableModelsWithNames(anthropicKey, 'anthropic');
        allModels.push(...models.map(m => ({
          value: m.id,
          label: `${m.displayName} (Anthropic)`,
          provider: 'anthropic',
          isShared: false,
        })));
      } catch (error) {
        logger.error('Failed to fetch Anthropic models', error);
      }
    }

    if (dbUser.geminiApiKey) {
      try {
        const geminiKey = decrypt(dbUser.geminiApiKey);
        const models = await getAvailableModelsWithNames(geminiKey, 'gemini');
        allModels.push(...models.map(m => ({
          value: m.id,
          label: `${m.displayName} (Google)`,
          provider: 'gemini',
          isShared: false,
        })));
      } catch (error) {
        logger.error('Failed to fetch Gemini models', error);
      }
    }

    // Add shared models
    allModels.push(...sharedModels);

    const hasAnyKey = !!(dbUser.openaiApiKey || dbUser.anthropicApiKey || dbUser.geminiApiKey);

    return NextResponse.json({
      hasAnyKey,
      models: allModels,
      modelsByProvider: {
        openai: dbUser.openaiModels,
        anthropic: dbUser.anthropicModels,
        gemini: dbUser.geminiModels,
      },
    });
  } catch (error) {
    return handleApiError(error, 'Get available models error');
  }
}
