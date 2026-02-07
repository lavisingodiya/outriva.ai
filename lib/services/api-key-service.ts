import { prisma } from '@/lib/db/prisma';
import { decrypt } from '@/lib/encryption';
import { getSharedApiKey } from '@/lib/shared-keys';
import { getProviderFromModel } from '@/lib/ai/providers';

export interface ApiKeyResult {
  apiKey: string;
  usingSharedKey: boolean;
  actualModel: string;
}

export interface ApiKeyOptions {
  userId: string;
  model: string;
  userType: 'FREE' | 'PLUS' | 'ADMIN';
}

export async function resolveApiKey(options: ApiKeyOptions): Promise<ApiKeyResult> {
  const { userId, model, userType } = options;

  // Check if user selected a shared/sponsored model
  const isSharedModelSelected = model.startsWith('shared:');
  const actualModel = isSharedModelSelected ? model.replace('shared:', '') : model;
  const provider = getProviderFromModel(actualModel);

  let apiKey: string | null = null;
  let usingSharedKey = false;

  // If user explicitly selected shared model, use shared key
  if (isSharedModelSelected && (userType === 'PLUS' || userType === 'ADMIN')) {
    const sharedKey = await getSharedApiKey(actualModel);
    if (!sharedKey) {
      throw new Error('Selected shared model is not available');
    }
    apiKey = sharedKey;
    usingSharedKey = true;
  }

  // If not using shared key, use user's own key
  if (!apiKey) {
    const dbUser = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        openaiApiKey: true,
        anthropicApiKey: true,
        geminiApiKey: true,
      },
    });

    if (!dbUser) {
      throw new Error('User not found');
    }

    switch (provider) {
      case 'openai':
        if (!dbUser.openaiApiKey) {
          throw new Error('OpenAI API key not configured');
        }
        apiKey = decrypt(dbUser.openaiApiKey);
        break;
      case 'anthropic':
        if (!dbUser.anthropicApiKey) {
          throw new Error('Anthropic API key not configured');
        }
        apiKey = decrypt(dbUser.anthropicApiKey);
        break;
      case 'gemini':
        if (!dbUser.geminiApiKey) {
          throw new Error('Gemini API key not configured');
        }
        apiKey = decrypt(dbUser.geminiApiKey);
        break;
      default:
        throw new Error('Invalid model provider');
    }
  }

  return {
    apiKey,
    usingSharedKey,
    actualModel,
  };
}
