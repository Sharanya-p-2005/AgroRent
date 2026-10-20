/**
 * URL validation and sanitization utility
 * Ensures external links use secure HTTP/HTTPS protocols and reject dangerous schemes.
 */
export function isValidSafeUrl(url?: string | null): boolean {
  if (!url || typeof url !== 'string' || !url.trim()) {
    return true; // Optional fields can be empty
  }

  const trimmed = url.trim();

  // Explicitly reject dangerous schemes
  const lower = trimmed.toLowerCase();
  if (
    lower.startsWith('javascript:') ||
    lower.startsWith('data:') ||
    lower.startsWith('vbscript:') ||
    lower.startsWith('file:')
  ) {
    return false;
  }

  try {
    const parsed = new URL(trimmed);
    return parsed.protocol === 'http:' || parsed.protocol === 'https:';
  } catch {
    return false;
  }
}
