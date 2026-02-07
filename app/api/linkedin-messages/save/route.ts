import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { prisma } from '@/lib/db/prisma';
import { LinkedInMessageType, Length, ApplicationStatus } from '@prisma/client';
import { generateMessageId } from '@/lib/utils/message-id';
import { logger } from '@/lib/logger';
import { trackActivityCount } from '@/lib/tracking';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

// Valid enum values for validation
const VALID_LENGTHS: string[] = ['CONCISE', 'MEDIUM', 'LONG'];
const VALID_STATUSES: string[] = ['DRAFT', 'SENT', 'DONE', 'GHOST', 'REQUESTED'];

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const {
      content,
      messageType,
      resumeId,
      linkedinUrl,
      recipientName,
      recipientPosition,
      positionTitle,
      areasOfInterest,
      companyName,
      jobDescription,
      companyDescription,
      parentMessageId,
      length,
      llmModel,
      status = 'SENT',
      requestReferral = false,
    } = body;

    // For CONNECTION_NOTE, company name is optional
    if (!content || !messageType) {
      return NextResponse.json(
        { error: 'Content and message type are required' },
        { status: 400 }
      );
    }

    // For non-CONNECTION_NOTE types, company name is required
    if (messageType !== 'CONNECTION_NOTE' && !companyName) {
      return NextResponse.json(
        { error: 'Company name is required' },
        { status: 400 }
      );
    }

    // Validate and default length
    const validLength = (length && VALID_LENGTHS.includes(length)) ? length : 'MEDIUM';
    // Validate and default status
    const validStatus = (status && VALID_STATUSES.includes(status)) ? status : 'SENT';

    let messageId = null;
    try {
      messageId = generateMessageId('linkedin');
    } catch (e) {
      messageId = null;
    }

    const linkedInMessage = await prisma.linkedInMessage.create({
      data: {
        userId: user.id,
        resumeId: resumeId || null,
        messageType: messageType as LinkedInMessageType,
        linkedinUrl: linkedinUrl || null,
        recipientName: recipientName || null,
        recipientPosition: recipientPosition || null,
        positionTitle: positionTitle || null,
        areasOfInterest: areasOfInterest || null,
        companyName: companyName || 'Unknown',
        jobDescription: jobDescription || null,
        companyDescription: companyDescription || null,
        content,
        length: validLength as Length,
        llmModel: llmModel || null,
        status: validStatus as ApplicationStatus,
        requestReferral,
        parentMessageId: parentMessageId || null,
        messageId: messageId || null,
      },
    });

    // Track activity count
    await trackActivityCount(user.id, messageType === 'FOLLOW_UP');

    return NextResponse.json({
      success: true,
      id: linkedInMessage.id,
      messageId: messageId,
    });
  } catch (error) {
    logger.error('LinkedIn message save error', error);
    return NextResponse.json(
      { error: 'Failed to save LinkedIn message' },
      { status: 500 }
    );
  }
}
