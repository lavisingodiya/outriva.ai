import { prisma } from '@/lib/db/prisma';
import { decrypt, getAvailableModelsWithNames } from '@/lib/encryption';
import { logger } from '@/lib/logger';
import { sharedModelsCache } from '@/lib/cache';

export interface SharedModel {
  model: string;
  displayName: string;
  provider: 'openai' | 'anthropic' | 'gemini';
  isShared: true;
  keyId: string;
}

/**
 * Get shared API key for a specific model
 */
export async function getSharedApiKey(model: string): Promise<string | null> {
  try {
    const sharedKeys = await prisma.sharedApiKey.findMany({
      where: {
        isActive: true,
        models: {
          has: model,
        },
      },
    });

    if (sharedKeys.length === 0) return null;

    // Return decrypted API key from first matching key
    return decrypt(sharedKeys[0].apiKey);
  } catch (error) {
    logger.error('Get shared API key error:', error);
    return null;
  }
}

/**
 * Check if a model is available as shared
 */
export async function isSharedModel(model: string): Promise<boolean> {
  try {
    const count = await prisma.sharedApiKey.count({
      where: {
        isActive: true,
        models: {
          has: model,
        },
      },
    });

    return count > 0;
  } catch (error) {
    logger.error('Check shared model error:', error);
    return false;
  }
}

/**
 * Get all available shared models for PLUS users
 * Results are cached for 5 minutes
 */
export async function getAvailableSharedModels(): Promise<SharedModel[]> {
  const cacheKey = 'shared-models-all';

  // Check cache first
  const cached = sharedModelsCache.get<SharedModel[]>(cacheKey);
  if (cached) {
    return cached;
  }

  try {
    const sharedKeys = await prisma.sharedApiKey.findMany({
      where: { isActive: true },
      select: {
        id: true,
        provider: true,
        models: true,
        apiKey: true,
      },
    });

    const allSharedModels: SharedModel[] = [];

    // Fetch display names for each provider's models
    for (const key of sharedKeys) {
      try {
        const decryptedKey = decrypt(key.apiKey);
        const provider = key.provider.toLowerCase() as 'openai' | 'anthropic' | 'gemini';
        
        // Get models with display names from the API
        const modelsWithNames = await getAvailableModelsWithNames(decryptedKey, provider);
        
        // Filter to only include models that are in the shared key's model list
        const sharedModelsForKey = key.models
          .map(modelId => {
            const modelInfo = modelsWithNames.find(m => m.id === modelId);
            return modelInfo ? {
              model: modelId,
              displayName: modelInfo.displayName,
              provider,
              isShared: true as const,
              keyId: key.id,
            } : null;
          })
          .filter((m): m is SharedModel => m !== null);

        allSharedModels.push(...sharedModelsForKey);
      } catch (error) {
        logger.error(`Failed to fetch display names for shared ${key.provider} models:`, error);
        // Fallback: add models without display names
        const fallbackModels = key.models.map(model => ({
          model,
          displayName: model, // Use model ID as display name
          provider: key.provider.toLowerCase() as 'openai' | 'anthropic' | 'gemini',
          isShared: true as const,
          keyId: key.id,
        }));
        allSharedModels.push(...fallbackModels);
      }
    }

    // Cache the result
    sharedModelsCache.set(cacheKey, allSharedModels);
    return allSharedModels;
  } catch (error) {
    logger.error('Get available shared models error:', error);
    return [];
  }
}
