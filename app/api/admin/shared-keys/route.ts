import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { prisma } from '@/lib/db/prisma';
import { logger } from '@/lib/logger';
import { encrypt, decrypt } from '@/lib/encryption';
import { invalidateSharedModelsCache } from '@/lib/cache';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

// GET - Fetch all shared API keys (Admin only)
export async function GET(req: NextRequest) {
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

    // Get all shared API keys
    const keys = await prisma.sharedApiKey.findMany({
      orderBy: { createdAt: 'desc' },
    });

    // Decrypt API keys for display (masked)
    const keysWithMasked = keys.map(key => ({
      ...key,
      apiKeyMasked: `${decrypt(key.apiKey).substring(0, 8)}...${decrypt(key.apiKey).slice(-4)}`,
      apiKey: undefined, // Don't send encrypted key to client
    }));

    return NextResponse.json({ keys: keysWithMasked });
  } catch (error) {
    logger.error('Get shared keys error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch shared API keys' },
      { status: 500 }
    );
  }
}

// POST - Add new shared API key (Admin only)
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
    const { provider, apiKey, models } = body;

    if (!provider || !apiKey || !models || !Array.isArray(models)) {
      return NextResponse.json(
        { error: 'Provider, API key, and models are required' },
        { status: 400 }
      );
    }

    // Encrypt the API key
    const encryptedKey = encrypt(apiKey);

    // Create shared API key
    const sharedKey = await prisma.sharedApiKey.create({
      data: {
        provider,
        apiKey: encryptedKey,
        models,
        isActive: true,
      },
    });

    // Invalidate caches to reflect new shared models
    invalidateSharedModelsCache();

    return NextResponse.json({
      key: {
        ...sharedKey,
        apiKeyMasked: `${apiKey.substring(0, 8)}...${apiKey.slice(-4)}`,
        apiKey: undefined,
      },
    });
  } catch (error) {
    logger.error('Create shared key error:', error);
    return NextResponse.json(
      { error: 'Failed to create shared API key' },
      { status: 500 }
    );
  }
}

// DELETE - Remove shared API key (Admin only)
export async function DELETE(req: NextRequest) {
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

    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'Key ID is required' }, { status: 400 });
    }

    await prisma.sharedApiKey.delete({
      where: { id },
    });

    // Invalidate caches since shared models changed
    invalidateSharedModelsCache();

    return NextResponse.json({ success: true });
  } catch (error) {
    logger.error('Delete shared key error:', error);
    return NextResponse.json(
      { error: 'Failed to delete shared API key' },
      { status: 500 }
    );
  }
}

// PATCH - Toggle shared API key status (Admin only)
export async function PATCH(req: NextRequest) {
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
    const { id, isActive } = body;

    if (!id || typeof isActive !== 'boolean') {
      return NextResponse.json(
        { error: 'Key ID and status are required' },
        { status: 400 }
      );
    }

    const updated = await prisma.sharedApiKey.update({
      where: { id },
      data: { isActive },
    });

    // Invalidate caches since key status changed
    invalidateSharedModelsCache();

    return NextResponse.json({ key: updated });
  } catch (error) {
    logger.error('Update shared key error:', error);
    return NextResponse.json(
      { error: 'Failed to update shared API key' },
      { status: 500 }
    );
  }
}
