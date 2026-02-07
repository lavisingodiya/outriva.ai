import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { prisma } from '@/lib/db/prisma';
import { EmailMessageType } from '@prisma/client';
import { generateMessageId } from '@/lib/utils/message-id';
import { logger } from '@/lib/logger';
import { trackActivityCount } from '@/lib/tracking';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

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
      subject,
      body: emailBody,
      messageType,
      resumeId,
      recipientEmail,
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

    if (!subject || !emailBody || !recipientEmail || !companyName || !messageType) {
      return NextResponse.json(
        { error: 'Subject, body, recipient email, company name, and message type are required' },
        { status: 400 }
      );
    }

    let messageId = null;
    try {
      messageId = generateMessageId('email');
    } catch (e) {
      messageId = null;
    }

    const emailMessage = await prisma.emailMessage.create({
      data: {
        userId: user.id,
        resumeId: resumeId || null,
        messageType: messageType as EmailMessageType,
        recipientEmail,
        recipientName: recipientName || null,
        recipientPosition: recipientPosition || null,
        positionTitle: positionTitle || null,
        areasOfInterest: areasOfInterest || null,
        companyName,
        jobDescription: jobDescription || null,
        companyDescription: companyDescription || null,
        subject,
        body: emailBody,
        length: length || null,
        llmModel: llmModel || null,
        status: status || 'SENT',
        requestReferral,
        parentMessageId: parentMessageId || null,
        messageId: messageId || null,
      },
    });

    // Track activity count
    await trackActivityCount(user.id, messageType === 'FOLLOW_UP');

    return NextResponse.json({
      success: true,
      id: emailMessage.id,
      messageId: messageId,
    });
  } catch (error) {
    logger.error('Email message save error', error);
    return NextResponse.json(
      { error: 'Failed to save email message' },
      { status: 500 }
    );
  }
}
