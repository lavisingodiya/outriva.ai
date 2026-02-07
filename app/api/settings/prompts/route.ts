import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/db/prisma';
import { authenticateRequest, validateRequest, handleApiError } from '@/lib/api';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';
export const revalidate = 300; // Cache for 5 minutes (prompts rarely change)

// Validation schema for POST body
const savePromptsSchema = z.object({
  coverLetter: z.string().optional(),
  linkedIn: z.string().optional(),
  email: z.string().optional(),
});

// GET - Fetch custom prompts
export async function GET(req: NextRequest) {
  try {
    const auth = await authenticateRequest();
    if (!auth.success) return auth.response;

    const prompts = await prisma.customPrompt.findMany({
      where: { userId: auth.user.id },
    });

    const promptsMap = prompts.reduce((acc, prompt) => {
      acc[prompt.tabType] = prompt.content;
      return acc;
    }, {} as Record<string, string>);

    return NextResponse.json({
      coverLetter: promptsMap['COVER_LETTER'] || '',
      linkedIn: promptsMap['LINKEDIN'] || '',
      email: promptsMap['EMAIL'] || '',
    });
  } catch (error) {
    return handleApiError(error, 'Get prompts error');
  }
}

// POST - Save custom prompts
export async function POST(req: NextRequest) {
  try {
    const result = await validateRequest(req, savePromptsSchema);
    if (!result.success) return result.response;

    const { userId, body } = result.context;
    const { coverLetter, linkedIn, email } = body;

    const operations: ReturnType<typeof prisma.customPrompt.deleteMany | typeof prisma.customPrompt.upsert>[] = [];

    // Helper to handle prompt upsert/delete
    const handlePrompt = (
      content: string | undefined,
      tabType: 'COVER_LETTER' | 'LINKEDIN' | 'EMAIL',
      name: string
    ) => {
      if (content === undefined) return;

      if (content.trim() === '') {
        operations.push(
          prisma.customPrompt.deleteMany({
            where: { userId, tabType },
          })
        );
      } else {
        operations.push(
          prisma.customPrompt.upsert({
            where: {
              userId_name_tabType: { userId, name, tabType },
            },
            update: { content: content.trim() },
            create: { userId, name, tabType, content: content.trim() },
          })
        );
      }
    };

    handlePrompt(coverLetter, 'COVER_LETTER', 'Cover Letter Prompt');
    handlePrompt(linkedIn, 'LINKEDIN', 'LinkedIn Prompt');
    handlePrompt(email, 'EMAIL', 'Email Prompt');

    if (operations.length > 0) {
      await prisma.$transaction(operations);
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    return handleApiError(error, 'Save prompts error');
  }
}
