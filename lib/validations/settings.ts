import { z } from 'zod';
import { TabType, Length } from '@prisma/client';

export const apiKeySchema = z.object({
  openaiApiKey: z.string().optional(),
  anthropicApiKey: z.string().optional(),
  geminiApiKey: z.string().optional(),
});

export const resumeUploadSchema = z.object({
  file: z.instanceof(File).refine((file) => {
    return file.size <= 5 * 1024 * 1024; // 5MB
  }, 'File size must be less than 5MB')
  .refine((file) => {
    const allowedTypes = ['application/pdf', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
    return allowedTypes.includes(file.type);
  }, 'File must be PDF or DOCX'),
});

export const customPromptSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100, 'Name is too long'),
  content: z.string().min(10, 'Prompt must be at least 10 characters'),
  tabType: z.nativeEnum(TabType),
});

export const preferencesSchema = z.object({
  defaultResumeId: z.string().optional(),
  defaultLlmModel: z.string().optional(),
  defaultLength: z.nativeEnum(Length),
  autoSaveCoverLetters: z.boolean(),
});

export type ApiKeyInput = z.infer<typeof apiKeySchema>;
export type ResumeUploadInput = z.infer<typeof resumeUploadSchema>;
export type CustomPromptInput = z.infer<typeof customPromptSchema>;
export type PreferencesInput = z.infer<typeof preferencesSchema>;
