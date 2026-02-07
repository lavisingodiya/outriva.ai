/**
 * Dynamically converts a technical model name to a user-friendly display name
 * Removes date suffixes, converts hyphens to spaces, and applies proper capitalization
 * @param modelName - The technical model name (e.g., "claude-3-5-sonnet-20240620")
 * @returns User-friendly display name (e.g., "Claude 3.5 Sonnet")
 * 
 * @example
 * getModelDisplayName("gpt-4o") // "GPT 4o"
 * getModelDisplayName("claude-3-5-sonnet-20240620") // "Claude 3.5 Sonnet"
 * getModelDisplayName("gemini-1.5-pro") // "Gemini 1.5 Pro"
 */
export function getModelDisplayName(modelName: string): string {
  // Remove date suffixes (e.g., -20240620, -20241022)
  let cleanName = modelName.replace(/-\d{8}$/, '');
  
  // Remove 'exp' suffix with optional number (e.g., -exp, -1206 for experimental)
  cleanName = cleanName.replace(/-exp(-\d+)?$/, '');
  
  // Handle version numbers like "3-5" -> "3.5" before splitting
  // This handles cases like "claude-3-5-sonnet" -> "claude-3.5-sonnet"
  cleanName = cleanName.replace(/(\d)-(\d)/, '$1.$2');
  
  // Split by hyphens
  const parts = cleanName.split('-');
  
  // Capitalize each part appropriately
  const formatted = parts.map((part) => {
    // Handle special cases - model provider names
    if (part.toLowerCase() === 'gpt') return 'GPT';
    if (part.toLowerCase() === 'claude') return 'Claude';
    if (part.toLowerCase() === 'gemini') return 'Gemini';
    
    // Keep version numbers and decimals as-is (e.g., "3.5", "1.5", "2.0")
    if (/^[\d.]+$/.test(part)) return part;
    
    // Handle mixed alphanumeric like "4o" - keep lowercase letter
    if (/^\d+[a-z]$/i.test(part)) {
      return part.toLowerCase();
    }
    
    // Capitalize first letter for words (e.g., "turbo", "sonnet", "haiku", "mini")
    return part.charAt(0).toUpperCase() + part.slice(1).toLowerCase();
  }).join(' ');
  
  return formatted;
}

/**
 * Gets the provider name from a model name
 * @param modelName - The technical model name
 * @returns Provider name (OpenAI, Anthropic, Google) or "Unknown"
 */
export function getModelProvider(modelName: string): string {
  if (modelName.startsWith('gpt-')) return 'OpenAI';
  if (modelName.startsWith('claude-')) return 'Anthropic';
  if (modelName.startsWith('gemini-')) return 'Google';
  return 'Unknown';
}

/**
 * Formats model name with provider in parentheses
 * @param modelName - The technical model name
 * @returns Formatted string like "Claude 3.5 Sonnet (Anthropic)"
 */
export function getModelDisplayNameWithProvider(modelName: string): string {
  const displayName = getModelDisplayName(modelName);
  const provider = getModelProvider(modelName);

  if (provider === 'Unknown' || displayName === modelName) {
    return displayName;
  }

  return `${displayName} (${provider})`;
}
