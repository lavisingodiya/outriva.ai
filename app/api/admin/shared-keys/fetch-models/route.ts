import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { prisma } from '@/lib/db/prisma';
import { logger } from '@/lib/logger';
import { getAvailableModelsWithNames } from '@/lib/encryption';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

// POST - Fetch available models from a given API key (Admin only)
export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user is admin
    const dbUser = await prisma.user.findUnique({
      where: { id: user.id },
      select: { userType: true },
    });

    if (!dbUser || dbUser.userType !== 'ADMIN') {
      return NextResponse.json({ error: 'Forbidden - Admin access required' }, { status: 403 });
    }

    const body = await req.json();
    const { apiKey, provider } = body;

    if (!apiKey || !provider) {
      return NextResponse.json(
        { error: 'API key and provider are required' },
        { status: 400 }
      );
    }

    // Validate provider
    const validProviders = ['openai', 'anthropic', 'gemini'];
    const normalizedProvider = provider.toLowerCase();
    if (!validProviders.includes(normalizedProvider)) {
      return NextResponse.json(
        { error: 'Invalid provider. Must be one of: openai, anthropic, gemini' },
        { status: 400 }
      );
    }

    // Fetch models from the API
    try {
      const models = await getAvailableModelsWithNames(
        apiKey,
        normalizedProvider as 'openai' | 'anthropic' | 'gemini'
      );

      return NextResponse.json({
        models: models.map(m => ({
          value: m.id,
          label: m.displayName,
          provider: normalizedProvider,
        })),
      });
    } catch (error: any) {
      logger.error(`Failed to fetch models for ${provider}:`, error);
      return NextResponse.json(
        { error: `Failed to fetch models from ${provider}. Please check the API key.` },
        { status: 400 }
      );
    }
  } catch (error) {
    logger.error('Fetch models error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch models' },
      { status: 500 }
    );
  }
}
