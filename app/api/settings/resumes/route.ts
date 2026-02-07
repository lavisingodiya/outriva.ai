import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { prisma } from '@/lib/db/prisma';
import { ensureUserExists } from '@/lib/auth-helpers';
import pdf from 'pdf-parse';
import mammoth from 'mammoth';
import { logger } from '@/lib/logger';
import { handleApiError } from '@/lib/api/errors';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';
export const revalidate = 120; // Cache for 2 minutes (resumes change infrequently)

// GET - Fetch all resumes for the user
export async function GET(req: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const resumes = await prisma.resume.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        title: true,
        content: true,
        isDefault: true,
        createdAt: true,
      },
    });

    return NextResponse.json({ resumes });
  } catch (error) {
    return handleApiError(error, 'Get resumes error');
  }
}

// POST - Upload new resume
export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Ensure user exists in database
    await ensureUserExists(user);

    // Get user type to determine resume limit
    const dbUser = await prisma.user.findUnique({
      where: { id: user.id },
      select: { userType: true },
    });

    const maxResumes = dbUser?.userType === 'PLUS' ? 8 : dbUser?.userType === 'ADMIN' ? 999 : 3;

    // Check current resume count
    const resumeCount = await prisma.resume.count({
      where: { userId: user.id },
    });

    if (resumeCount >= maxResumes) {
      return NextResponse.json(
        { error: `Maximum of ${maxResumes} resumes allowed for ${dbUser?.userType} users` },
        { status: 400 }
      );
    }

    const formData = await req.formData();
    const file = formData.get('file') as File;
    const title = formData.get('title') as string;

    if (!file || !title) {
      return NextResponse.json(
        { error: 'File and title are required' },
        { status: 400 }
      );
    }

    // Validate file type (only PDF and DOCX)
    const allowedTypes = [
      'application/pdf',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    ];
    
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        { error: 'Invalid file type. Only PDF and DOCX files are allowed.' },
        { status: 400 }
      );
    }

    // Validate file size (max 3MB)
    const maxSize = 3 * 1024 * 1024; // 3MB in bytes
    if (file.size > maxSize) {
      return NextResponse.json(
        { error: 'File size exceeds 3MB limit. Please upload a smaller file.' },
        { status: 400 }
      );
    }

    // Extract text from file
    const content = await extractTextFromFile(file);

    if (!content || content.trim().length === 0) {
      return NextResponse.json(
        { error: 'Could not extract text from file' },
        { status: 400 }
      );
    }

    // Upload file to Supabase Storage
    const fileBuffer = await file.arrayBuffer();
    const fileExt = file.name.split('.').pop();
    const fileName = `${user.id}/${Date.now()}-${crypto.randomUUID()}.${fileExt}`;

    const { data: uploadData, error: uploadError } = await supabase
      .storage
      .from('resumes')
      .upload(fileName, fileBuffer, {
        contentType: file.type,
        upsert: false,
      });

    if (uploadError) {
      logger.error('Supabase storage upload error:', uploadError);
      return NextResponse.json(
        { error: 'Failed to upload resume file to storage' },
        { status: 500 }
      );
    }

    // Get public URL for the uploaded file
    const { data: { publicUrl } } = supabase
      .storage
      .from('resumes')
      .getPublicUrl(fileName);

    // Create resume (set as default if it's the first one)
    const isFirstResume = resumeCount === 0;
    const resume = await prisma.resume.create({
      data: {
        userId: user.id,
        title: title.trim(),
        fileName: file.name,
        fileUrl: publicUrl,
        content,
        isDefault: isFirstResume,
      },
    });

    return NextResponse.json({
      success: true,
      resume: {
        id: resume.id,
        title: resume.title,
        isDefault: resume.isDefault,
        createdAt: resume.createdAt,
      },
    });
  } catch (error) {
    return handleApiError(error, 'Upload resume error');
  }
}

// DELETE - Delete a resume
export async function DELETE(req: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const resumeId = searchParams.get('id');

    if (!resumeId) {
      return NextResponse.json(
        { error: 'Resume ID is required' },
        { status: 400 }
      );
    }

    // Verify ownership
    const resume = await prisma.resume.findFirst({
      where: {
        id: resumeId,
        userId: user.id,
      },
    });

    if (!resume) {
      return NextResponse.json(
        { error: 'Resume not found' },
        { status: 404 }
      );
    }

    // Delete file from Supabase Storage if fileUrl exists
    if (resume.fileUrl) {
      try {
        // Extract file path from URL
        const url = new URL(resume.fileUrl);
        const pathParts = url.pathname.split('/resumes/');
        if (pathParts.length > 1) {
          const filePath = pathParts[1];
          await supabase.storage.from('resumes').remove([filePath]);
        }
      } catch (storageError) {
        logger.error('Failed to delete file from storage:', storageError);
        // Continue with database deletion even if storage deletion fails
      }
    }

    // Delete the resume from database
    await prisma.resume.delete({
      where: { id: resumeId },
    });

    // If deleted resume was default, set another as default
    if (resume.isDefault) {
      const firstResume = await prisma.resume.findFirst({
        where: { userId: user.id },
        orderBy: { createdAt: 'desc' },
      });

      if (firstResume) {
        await prisma.resume.update({
          where: { id: firstResume.id },
          data: { isDefault: true },
        });
      }
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    return handleApiError(error, 'Delete resume error');
  }
}

// Helper function to extract text from file
async function extractTextFromFile(file: File): Promise<string> {
  const buffer = await file.arrayBuffer();
  
  // For TXT files, return as-is
  if (file.type === 'text/plain') {
    const text = Buffer.from(buffer).toString('utf-8');
    return text.trim();
  }

  // For PDF files, use pdf-parse
  if (file.type === 'application/pdf') {
    try {
      const pdfBuffer = Buffer.from(buffer);
      const data = await pdf(pdfBuffer);
      return data.text.trim();
    } catch (error) {
      logger.error('PDF parsing error:', error);
      throw new Error('Failed to parse PDF file. Please ensure it is a valid PDF document.');
    }
  }

  // For DOCX files, use mammoth
  if (file.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
    try {
      const docxBuffer = Buffer.from(buffer);
      const result = await mammoth.extractRawText({ buffer: docxBuffer });
      return result.value.trim();
    } catch (error) {
      logger.error('DOCX parsing error:', error);
      throw new Error('Failed to parse DOCX file. Please ensure it is a valid Word document.');
    }
  }

  throw new Error('Unsupported file type. Please upload a .txt, .pdf, or .docx file.');
}
