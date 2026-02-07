import { prisma } from '@/lib/db/prisma';
import { MISUSE_MARKER } from './prompts';
import { logger } from '@/lib/logger';

/**
 * Default misuse message shown to users
 */
const DEFAULT_MISUSE_MESSAGE = `I built the platform you are using 😊, now go back to prompt and change it accordingly, I am smarter than you bro 👍`;

/**
 * Key for storing the misuse message in SystemSettings
 */
export const MISUSE_MESSAGE_KEY = 'misuse_detection_message';

/**
 * Check if AI-generated content is a misuse response.
 * This requires the response to be primarily the JSON misuse object,
 * not just containing the marker somewhere in normal content.
 * This prevents false positives when the AI generates valid career content.
 */
export function detectMisuse(content: string): boolean {
  // Trim and check if response is very short (misuse response should be just the JSON)
  const trimmed = content.trim();
  
  // The misuse response should be short (under 200 chars) and contain the marker
  // Normal career-related responses will be much longer
  if (trimmed.length > 200) {
    return false;
  }
  
  // Check for the JSON structure with misuseDetected: true
  const hasMisuseMarker = content.includes(MISUSE_MARKER);
  const hasMisuseJsonPattern = /\{\s*"misuseDetected"\s*:\s*true/i.test(trimmed);
  
  return hasMisuseMarker && hasMisuseJsonPattern;
}

/**
 * Get the current misuse message from database or use default
 */
export async function getMisuseMessage(): Promise<string> {
  try {
    const setting = await prisma.systemSettings.findUnique({
      where: { key: MISUSE_MESSAGE_KEY },
    });

    if (setting && setting.value) {
      return setting.value;
    }

    return DEFAULT_MISUSE_MESSAGE;
  } catch (error) {
    logger.error('Error fetching misuse message', error);
    return DEFAULT_MISUSE_MESSAGE;
  }
}

/**
 * Set the misuse message in database (admin only)
 */
export async function setMisuseMessage(message: string): Promise<void> {
  await prisma.systemSettings.upsert({
    where: { key: MISUSE_MESSAGE_KEY },
    update: { value: message },
    create: {
      key: MISUSE_MESSAGE_KEY,
      value: message,
      description: 'Message shown to users when prompt misuse is detected',
    },
  });
}
