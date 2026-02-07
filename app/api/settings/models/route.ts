import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { prisma } from '@/lib/db/prisma';
import { decrypt } from '@/lib/encryption';
import { getAvailableModels } from '@/lib/encryption';
import { logger } from '@/lib/logger';
import { handleApiError } from '@/lib/api/errors';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';
export const revalidate = 300; // Cache for 5 minutes (model lists rarely change, prevents expensive external API calls)

export async function GET(req: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get query parameter for provider
    const { searchParams } = new URL(req.url);
    const provider = searchParams.get('provider') as 'openai' | 'anthropic' | 'gemini' | null;

    if (!provider || !['openai', 'anthropic', 'gemini'].includes(provider)) {
      return NextResponse.json(
        { error: 'Valid provider is required (openai, anthropic, gemini)' },
        { status: 400 }
      );
    }

    // Get user's API keys
    const dbUser = await prisma.user.findUnique({
      where: { id: user.id },
      select: {
        openaiApiKey: true,
        anthropicApiKey: true,
        geminiApiKey: true,
      },
    });

    if (!dbUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Get the appropriate API key
    let apiKey: string | null = null;
    switch (provider) {
      case 'openai':
        apiKey = dbUser.openaiApiKey ? decrypt(dbUser.openaiApiKey) : null;
        break;
      case 'anthropic':
        apiKey = dbUser.anthropicApiKey ? decrypt(dbUser.anthropicApiKey) : null;
        break;
      case 'gemini':
        apiKey = dbUser.geminiApiKey ? decrypt(dbUser.geminiApiKey) : null;
        break;
    }

    if (!apiKey) {
      return NextResponse.json(
        { error: `No ${provider} API key configured` },
        { status: 400 }
      );
    }

    // Get available models
    const models = await getAvailableModels(apiKey, provider);

    return NextResponse.json({
      provider,
      models,
    });
  } catch (error) {
    return handleApiError(error, 'Get models error');
  }
}
