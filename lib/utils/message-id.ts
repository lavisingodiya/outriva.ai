/**
 * Generates a human-readable unique message ID
 * Format: LNK-YYYYMMDD-XXXX or EML-YYYYMMDD-XXXX
 * Example: LNK-20231125-A3F9 or EML-20231125-B2K8
 */
export function generateMessageId(type: 'linkedin' | 'email'): string {
  const prefix = type === 'linkedin' ? 'LNK' : 'EML';
  const date = new Date();
  const dateStr = date.toISOString().slice(0, 10).replace(/-/g, '');

  // Generate 4-character random alphanumeric code (uppercase)
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let code = '';
  for (let i = 0; i < 4; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }

  return `${prefix}-${dateStr}-${code}`;
}

/**
 * Validates message ID format
 */
export function isValidMessageId(messageId: string): boolean {
  const pattern = /^(LNK|EML)-\d{8}-[A-Z0-9]{4}$/;
  return pattern.test(messageId);
}
