// Input validation utilities
import { z } from 'zod';

// Email Generation Schema
export const emailGenerationSchema = z.object({
  jobTitle: z.string().min(1, 'Job title is required').max(200, 'Job title is too long'),
  company: z.string().min(1, 'Company is required').max(200, 'Company name is too long'),
  jobDescription: z.string().min(10, 'Job description must be at least 10 characters').max(10000, 'Job description is too long'),
  resume: z.string().max(50000, 'Resume is too long').optional(),
  customPrompt: z.string().max(2000, 'Custom prompt is too long').optional(),
});

// LinkedIn Generation Schema
export const linkedinGenerationSchema = z.object({
  jobTitle: z.string().min(1, 'Job title is required').max(200, 'Job title is too long'),
  company: z.string().min(1, 'Company is required').max(200, 'Company name is too long'),
  jobDescription: z.string().min(10, 'Job description must be at least 10 characters').max(10000, 'Job description is too long'),
  resume: z.string().max(50000, 'Resume is too long').optional(),
  customPrompt: z.string().max(2000, 'Custom prompt is too long').optional(),
});

// Cover Letter Generation Schema
export const coverLetterGenerationSchema = z.object({
  jobTitle: z.string().min(1, 'Job title is required').max(200, 'Job title is too long'),
  company: z.string().min(1, 'Company is required').max(200, 'Company name is too long'),
  jobDescription: z.string().min(10, 'Job description must be at least 10 characters').max(10000, 'Job description is too long'),
  resume: z.string().max(50000, 'Resume is too long').optional(),
  customPrompt: z.string().max(2000, 'Custom prompt is too long').optional(),
});

// API Key Schema
export const apiKeySchema = z.object({
  provider: z.enum(['openai', 'anthropic'], { required_error: 'Provider must be openai or anthropic' }),
  apiKey: z.string().optional(),
});

// Custom Prompt Schema
export const customPromptSchema = z.object({
  type: z.enum(['email', 'linkedin', 'coverLetter'], { required_error: 'Type must be email, linkedin, or coverLetter' }),
  name: z.string().min(1, 'Name is required').max(100, 'Name is too long'),
  prompt: z.string().min(10, 'Prompt must be at least 10 characters').max(5000, 'Prompt is too long'),
});

// User Query Schema (Admin)
export const userQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(10),
  search: z.string().max(200).optional(),
  role: z.enum(['user', 'admin']).optional(),
});

// Resume Upload Schema
export const resumeUploadSchema = z.object({
  title: z.string().min(1, 'Title is required').max(200, 'Title is too long'),
  file: z.instanceof(File, { message: 'File is required' })
    .refine((file) => file.size <= 5 * 1024 * 1024, 'File size must be less than 5MB')
    .refine(
      (file) => ['application/pdf', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'text/plain'].includes(file.type),
      'File must be PDF, DOCX, or TXT'
    ),
});

// Password Schema
export const passwordSchema = z.string()
  .min(8, 'Password must be at least 8 characters')
  .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
  .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
  .regex(/[0-9]/, 'Password must contain at least one number')
  .regex(/[^A-Za-z0-9]/, 'Password must contain at least one special character');

// Email Schema
export const emailSchema = z.string().email('Invalid email address').max(255, 'Email is too long');

// Helper function to validate request body
export async function validateRequestBody<T>(
  req: Request,
  schema: z.ZodSchema<T>
): Promise<{ success: true; data: T } | { success: false; error: string }> {
  try {
    const body = await req.json();
    const validated = schema.parse(body);
    return { success: true, data: validated };
  } catch (error) {
    if (error instanceof z.ZodError) {
      const firstError = error.errors[0];
      return {
        success: false,
        error: firstError?.message || 'Validation error',
      };
    }
    if (error instanceof SyntaxError) {
      return { success: false, error: 'Invalid JSON in request body' };
    }
    return { success: false, error: 'Invalid request body' };
  }
}

// Helper function to validate query parameters
export function validateQueryParams<T>(
  searchParams: URLSearchParams,
  schema: z.ZodSchema<T>
): { success: true; data: T } | { success: false; error: string } {
  try {
    const params = Object.fromEntries(searchParams.entries());
    const validated = schema.parse(params);
    return { success: true, data: validated };
  } catch (error) {
    if (error instanceof z.ZodError) {
      const firstError = error.errors[0];
      return {
        success: false,
        error: firstError?.message || 'Validation error',
      };
    }
    return { success: false, error: 'Invalid query parameters' };
  }
}
