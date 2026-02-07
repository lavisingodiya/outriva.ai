/**
 * Input sanitization utilities to prevent prompt injection and XSS attacks
 */

/**
 * Sanitizes user input to prevent prompt injection attacks
 * Removes common prompt injection patterns and limits input length
 */
export function sanitizePromptInput(input: string | undefined, maxLength: number = 10000): string {
  if (!input) return '';

  let sanitized = input;

  // Limit length to prevent abuse
  sanitized = sanitized.slice(0, maxLength);

  // Remove null bytes
  sanitized = sanitized.replace(/\0/g, '');

  // Detect and neutralize common prompt injection patterns
  const injectionPatterns = [
    /ignore\s+(all\s+)?(previous|above|prior)\s+(instructions|prompts|rules|commands)/gi,
    /disregard\s+(all\s+)?(previous|above|prior)\s+(instructions|prompts|rules|commands)/gi,
    /forget\s+(all\s+)?(previous|above|prior)\s+(instructions|prompts|rules|commands)/gi,
    /new\s+(instructions|prompt|role|task)\s*:/gi,
    /system\s*(prompt|message|role)\s*:/gi,
    /you\s+are\s+now\s+(a|an)/gi,
    /pretend\s+(you|to)\s+(are|be)/gi,
    /act\s+as\s+(if|a|an)/gi,
    /roleplay\s+as/gi,
  ];

  // Check for injection attempts and log them (but don't completely block)
  for (const pattern of injectionPatterns) {
    if (pattern.test(sanitized)) {
      console.warn('Potential prompt injection detected in user input');
      // Replace the pattern with a sanitized version
      sanitized = sanitized.replace(pattern, '[content removed]');
    }
  }

  // Remove excessive newlines (more than 3 consecutive)
  sanitized = sanitized.replace(/\n{4,}/g, '\n\n\n');

  // Trim whitespace
  sanitized = sanitized.trim();

  return sanitized;
}

/**
 * Sanitizes HTML to prevent XSS attacks
 * Escapes HTML special characters
 */
export function sanitizeHtml(input: string | undefined): string {
  if (!input) return '';

  return input
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .replace(/\//g, '&#x2F;');
}

/**
 * Sanitizes email addresses
 * Validates format and removes potentially dangerous characters
 */
export function sanitizeEmail(email: string | undefined): string {
  if (!email) return '';

  // Basic email validation regex
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  const sanitized = email.trim().toLowerCase();

  if (!emailRegex.test(sanitized)) {
    throw new Error('Invalid email format');
  }

  // Remove any non-standard email characters
  return sanitized.replace(/[^a-z0-9@._+-]/g, '');
}

/**
 * Sanitizes URLs
 * Validates format and ensures safe protocols
 */
export function sanitizeUrl(url: string | undefined): string {
  if (!url) return '';

  const sanitized = url.trim();

  try {
    const urlObj = new URL(sanitized);

    // Only allow http, https, and linkedin protocols
    const allowedProtocols = ['http:', 'https:'];

    if (!allowedProtocols.includes(urlObj.protocol)) {
      throw new Error('Invalid URL protocol');
    }

    return sanitized;
  } catch {
    throw new Error('Invalid URL format');
  }
}

/**
 * Sanitizes company and position names
 * Removes potentially dangerous characters while preserving readability
 */
export function sanitizeName(name: string | undefined, maxLength: number = 200): string {
  if (!name) return '';

  let sanitized = name.trim();

  // Limit length
  sanitized = sanitized.slice(0, maxLength);

  // Remove null bytes and control characters
  sanitized = sanitized.replace(/[\0-\x1F\x7F]/g, '');

  // Allow letters, numbers, spaces, and common punctuation
  // This preserves company names like "AT&T", "O'Reilly", etc.
  sanitized = sanitized.replace(/[^\w\s.,&'()-]/g, '');

  return sanitized.trim();
}

/**
 * Comprehensive sanitization for all user inputs in API requests
 */
export interface SanitizedInputs {
  jobDescription?: string;
  companyDescription?: string;
  companyName?: string;
  positionTitle?: string;
  recipientName?: string;
  recipientPosition?: string;
  areasOfInterest?: string;
  extraContent?: string;
  recipientEmail?: string;
  linkedinUrl?: string;
}

export function sanitizeApiInputs(inputs: SanitizedInputs): SanitizedInputs {
  return {
    jobDescription: inputs.jobDescription
      ? sanitizePromptInput(inputs.jobDescription, 20000)
      : undefined,
    companyDescription: inputs.companyDescription
      ? sanitizePromptInput(inputs.companyDescription, 10000)
      : undefined,
    companyName: inputs.companyName
      ? sanitizeName(inputs.companyName)
      : undefined,
    positionTitle: inputs.positionTitle
      ? sanitizeName(inputs.positionTitle)
      : undefined,
    recipientName: inputs.recipientName
      ? sanitizeName(inputs.recipientName, 100)
      : undefined,
    recipientPosition: inputs.recipientPosition
      ? sanitizeName(inputs.recipientPosition)
      : undefined,
    areasOfInterest: inputs.areasOfInterest
      ? sanitizePromptInput(inputs.areasOfInterest, 1000)
      : undefined,
    extraContent: inputs.extraContent
      ? sanitizePromptInput(inputs.extraContent, 5000)
      : undefined,
    recipientEmail: inputs.recipientEmail
      ? sanitizeEmail(inputs.recipientEmail)
      : undefined,
    linkedinUrl: inputs.linkedinUrl
      ? sanitizeUrl(inputs.linkedinUrl)
      : undefined,
  };
}
