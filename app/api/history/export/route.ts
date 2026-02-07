import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { prisma } from '@/lib/db/prisma';
import { ApplicationStatus } from '@prisma/client';
import { logger } from '@/lib/logger';
import { handleApiError } from '@/lib/api/errors';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';
export const revalidate = 120; // Cache for 2 minutes (export data changes infrequently, heavy query)

export async function GET(req: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get query parameters for filtering
    const { searchParams } = new URL(req.url);
    const type = searchParams.get('type');
    const status = searchParams.get('status');
    const search = searchParams.get('search');

    // Fetch all three types of content
    const [coverLetters, linkedInMessages, emailMessages] = await Promise.all([
      prisma.coverLetter.findMany({
        where: {
          userId: user.id,
          ...(search
            ? {
                OR: [
                  { companyName: { contains: search, mode: 'insensitive' } },
                  { positionTitle: { contains: search, mode: 'insensitive' } },
                ],
              }
            : {}),
        },
        orderBy: { createdAt: 'desc' },
      }),
      prisma.linkedInMessage.findMany({
        where: {
          userId: user.id,
          ...(status && status !== 'ALL' ? { status: status as ApplicationStatus } : {}),
          ...(search
            ? {
                OR: [
                  { companyName: { contains: search, mode: 'insensitive' } },
                  { positionTitle: { contains: search, mode: 'insensitive' } },
                ],
              }
            : {}),
        },
        orderBy: { createdAt: 'desc' },
      }),
      prisma.emailMessage.findMany({
        where: {
          userId: user.id,
          ...(status && status !== 'ALL' ? { status: status as ApplicationStatus } : {}),
          ...(search
            ? {
                OR: [
                  { companyName: { contains: search, mode: 'insensitive' } },
                  { positionTitle: { contains: search, mode: 'insensitive' } },
                ],
              }
            : {}),
        },
        orderBy: { createdAt: 'desc' },
      }),
    ]);

    // Transform into CSV format
    let csvRows: string[][] = [];

    // Add header
    csvRows.push([
      'Type',
      'Company',
      'Position',
      'Status',
      'Date',
      'Content/Subject',
      'Body (Email only)',
      'Message Type',
      'Model Used',
      'Length',
    ]);

    // Add cover letters
    for (const item of coverLetters) {
      csvRows.push([
        'Cover Letter',
        escapeCSV(item.companyName || ''),
        escapeCSV(item.positionTitle || ''),
        '', // No status for cover letters
        item.createdAt.toISOString(),
        escapeCSV(item.content),
        '',
        '',
        item.llmModel || '',
        item.length || '',
      ]);
    }

    // Add LinkedIn messages
    for (const item of linkedInMessages) {
      csvRows.push([
        'LinkedIn',
        escapeCSV(item.companyName),
        escapeCSV(item.positionTitle || 'General Inquiry'),
        item.status,
        item.createdAt.toISOString(),
        escapeCSV(item.content),
        '',
        item.messageType,
        item.llmModel || '',
        item.length || '',
      ]);
    }

    // Add emails
    for (const item of emailMessages) {
      csvRows.push([
        'Email',
        escapeCSV(item.companyName),
        escapeCSV(item.positionTitle || 'General Inquiry'),
        item.status,
        item.createdAt.toISOString(),
        escapeCSV(item.subject),
        escapeCSV(item.body),
        item.messageType,
        item.llmModel || '',
        item.length || '',
      ]);
    }

    // Filter by type if specified
    if (type && type !== 'ALL') {
      csvRows = [csvRows[0], ...csvRows.slice(1).filter((row) => row[0] === type)];
    }

    // Sort by date descending (skip header)
    const header = csvRows[0];
    const dataRows = csvRows.slice(1);
    dataRows.sort((a, b) => new Date(b[4]).getTime() - new Date(a[4]).getTime());
    csvRows = [header, ...dataRows];

    // Convert to CSV string
    const csv = csvRows.map((row) => row.join(',')).join('\n');

    // Return as downloadable file
    return new NextResponse(csv, {
      status: 200,
      headers: {
        'Content-Type': 'text/csv',
        'Content-Disposition': `attachment; filename="job-applications-${new Date().toISOString().split('T')[0]}.csv"`,
      },
    });
  } catch (error) {
    return handleApiError(error, 'Export history error');
  }
}

// Helper function to escape CSV fields
function escapeCSV(field: string): string {
  if (!field) return '';
  // If field contains comma, newline, or quote, wrap in quotes and escape internal quotes
  if (field.includes(',') || field.includes('\n') || field.includes('"')) {
    return `"${field.replace(/"/g, '""')}"`;
  }
  return field;
}
