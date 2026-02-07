import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { prisma } from '@/lib/db/prisma';
import { encrypt, getAvailableModels } from '@/lib/encryption';
import { logger } from '@/lib/logger';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';
export const revalidate = 300; // Cache for 5 minutes (API keys rarely change)

interface ApiKeyStatusResponse {
  hasOpenaiKey: boolean;
  hasAnthropicKey: boolean;
  hasGeminiKey: boolean;
}

export async function GET(req: NextRequest): Promise<NextResponse<ApiKeyStatusResponse | { error: string }>> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Ensure user exists in database
    const dbUser = await prisma.user.upsert({
      where: { id: user.id },
      update: {},
      create: {
        id: user.id,
        email: user.email!,
      },
      select: {
        openaiApiKey: true,
        anthropicApiKey: true,
        geminiApiKey: true,
      },
    });

    return NextResponse.json({
      hasOpenaiKey: !!dbUser.openaiApiKey,
      hasAnthropicKey: !!dbUser.anthropicApiKey,
      hasGeminiKey: !!dbUser.geminiApiKey,
    });
  } catch (error) {
    logger.error('Get API keys error', error);
    return NextResponse.json(
      { error: 'Failed to get API keys' },
      { status: 500 }
    );
  }
}

interface ApiKeyUpdateRequest {
  openaiApiKey?: string;
  anthropicApiKey?: string;
  geminiApiKey?: string;
}

interface ApiKeyUpdateData {
  openaiApiKey?: string | null;
  anthropicApiKey?: string | null;
  geminiApiKey?: string | null;
  openaiModels?: string[];
  anthropicModels?: string[];
  geminiModels?: string[];
}

export async function POST(req: NextRequest): Promise<NextResponse> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    let body: ApiKeyUpdateRequest;
    try {
      body = await req.json();
    } catch (error) {
      return NextResponse.json(
        { error: 'Invalid JSON in request body' },
        { status: 400 }
      );
    }

    const { openaiApiKey, anthropicApiKey, geminiApiKey } = body;

    // Prepare update data (only encrypt if key is provided)
    const updateData: ApiKeyUpdateData = {};

    // OpenAI - encrypt key and fetch models
    if (openaiApiKey !== undefined) {
      if (openaiApiKey && openaiApiKey.trim() !== '') {
        updateData.openaiApiKey = encrypt(openaiApiKey);
        // Fetch available models
        try {
          const models = await getAvailableModels(openaiApiKey, 'openai');
          updateData.openaiModels = models;
        } catch (error) {
          logger.error('Failed to fetch OpenAI models', error);
          return NextResponse.json(
            { error: 'Invalid OpenAI API key or failed to fetch models' },
            { status: 400 }
          );
        }
      } else {
        // Remove key and models if empty string provided
        updateData.openaiApiKey = null;
        updateData.openaiModels = [];
      }
    }

    // Anthropic - encrypt key and fetch models
    if (anthropicApiKey !== undefined) {
      if (anthropicApiKey && anthropicApiKey.trim() !== '') {
        updateData.anthropicApiKey = encrypt(anthropicApiKey);
        // Fetch available models
        try {
          const models = await getAvailableModels(anthropicApiKey, 'anthropic');
          updateData.anthropicModels = models;
        } catch (error) {
          logger.error('Failed to fetch Anthropic models', error);
          return NextResponse.json(
            { error: 'Invalid Anthropic API key or failed to fetch models' },
            { status: 400 }
          );
        }
      } else {
        // Remove key and models if empty string provided
        updateData.anthropicApiKey = null;
        updateData.anthropicModels = [];
      }
    }

    // Gemini - encrypt key and fetch models
    if (geminiApiKey !== undefined) {
      if (geminiApiKey && geminiApiKey.trim() !== '') {
        updateData.geminiApiKey = encrypt(geminiApiKey);
        // Fetch available models
        try {
          const models = await getAvailableModels(geminiApiKey, 'gemini');
          updateData.geminiModels = models;
        } catch (error) {
          logger.error('Failed to fetch Gemini models', error);
          return NextResponse.json(
            { error: 'Invalid Gemini API key or failed to fetch models' },
            { status: 400 }
          );
        }
      } else {
        // Remove key and models if empty string provided
        updateData.geminiApiKey = null;
        updateData.geminiModels = [];
      }
    }

    // Create or update user
    const dbUser = await prisma.user.upsert({
      where: { id: user.id },
      update: updateData,
      create: {
        id: user.id,
        email: user.email!,
        ...updateData,
      },
    });

    return NextResponse.json({
      success: true,
      message: 'API keys saved successfully',
    });
  } catch (error) {
    logger.error('Save API keys error', error);
    return NextResponse.json(
      { error: 'Failed to save API keys' },
      { status: 500 }
    );
  }
}
