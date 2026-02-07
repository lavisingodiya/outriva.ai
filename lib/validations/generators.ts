import { z } from 'zod';
import { Length, ApplicationStatus } from '@prisma/client';

export const coverLetterSchema = z.object({
  resumeId: z.string().min(1, 'Resume is required'),
  jobDescription: z.string().min(10, 'Job description must be at least 10 characters'),
  companyName: z.string().optional(),
  positionTitle: z.string().optional(),
  companyDescription: z.string().optional(),
  length: z.nativeEnum(Length),
  llmModel: z.string().min(1, 'LLM model is required'),
  customPromptId: z.string().optional(),
});

export const linkedInMessageSchema = z.object({
  messageType: z.enum(['NEW', 'FOLLOW_UP']),
  resumeId: z.string().min(1, 'Resume is required'),

  // For new messages
  linkedinUrl: z.string().optional(),
  recipientName: z.string().optional(),
  positionTitle: z.string().optional(),
  areasOfInterest: z.string().optional(),
  companyName: z.string().min(1, 'Company name is required'),

  // For follow-ups
  parentMessageId: z.string().optional(),

  // Common fields
  jobDescription: z.string().optional(),
  companyDescription: z.string().optional(),
  length: z.nativeEnum(Length),
  llmModel: z.string().min(1, 'LLM model is required'),
  status: z.nativeEnum(ApplicationStatus),
  customPromptId: z.string().optional(),
}).refine((data) => {
  if (data.messageType === 'FOLLOW_UP') {
    return data.parentMessageId;
  }
  return true;
}, {
  message: 'Missing required fields for message type',
  path: ['messageType'],
});

export const emailMessageSchema = z.object({
  messageType: z.enum(['NEW', 'FOLLOW_UP']),
  resumeId: z.string().min(1, 'Resume is required'),

  // For new messages
  recipientEmail: z.string().email('Invalid email address'),
  recipientName: z.string().optional(),
  positionTitle: z.string().optional(),
  areasOfInterest: z.string().optional(),
  companyName: z.string().min(1, 'Company name is required'),

  // For follow-ups
  parentMessageId: z.string().optional(),

  // Common fields
  jobDescription: z.string().optional(),
  companyDescription: z.string().optional(),
  length: z.nativeEnum(Length),
  llmModel: z.string().min(1, 'LLM model is required'),
  status: z.nativeEnum(ApplicationStatus),
  customPromptId: z.string().optional(),
});

export type CoverLetterInput = z.infer<typeof coverLetterSchema>;
export type LinkedInMessageInput = z.infer<typeof linkedInMessageSchema>;
export type EmailMessageInput = z.infer<typeof emailMessageSchema>;
