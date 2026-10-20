/**
 * Phase 10: AI Safety & Content Moderation Service
 * Ensures user prompts and AI responses adhere to agricultural safety, privacy,
 * and security rules without fabricating claims or leaking private information.
 */

export interface SafetyCheckResult {
  isSafe: boolean;
  blockedReason?: string;
  safeResponse?: string;
}

export class SafetyService {
  // Disallowed prompt patterns (secrets, injection, bypass, hazardous advice)
  private static readonly INJECTION_PATTERNS = [
    /ignore (all )?previous instructions/i,
    /system prompt/i,
    /reveal (your|the) (secret|key|prompt|instructions)/i,
    /bypass (auth|security|rules)/i,
    /drop\s+table/i,
    /delete\s+from\s+users/i,
    /select\s+.*\s+from\s+users/i,
    /union\s+select/i,
    /exec(ute)?\s*\(/i,
  ];

  private static readonly PRIVACY_PATTERNS = [
    /other users?[' ]*(data|payments?|passwords?|tokens?|addresses?)/i,
    /admin password/i,
    /jwt secret/i,
    /upi pin/i,
    /card number/i,
    /cvv/i,
  ];

  private static readonly HAZARDOUS_PATTERNS = [
    /how to make (poison|explosive|bomb|chemical weapon)/i,
    /lethal dose/i,
    /banned chemical/i,
  ];

  /**
   * Evaluates if a user's prompt is safe to process.
   */
  static evaluatePrompt(prompt: string): SafetyCheckResult {
    if (!prompt || typeof prompt !== 'string') {
      return {
        isSafe: false,
        blockedReason: 'Empty or invalid prompt received.',
        safeResponse: 'Please ask a valid question about farming, equipment, livestock, or AgroRent services.',
      };
    }

    const trimmed = prompt.trim();

    // Check maximum character length (Cost Control Part 28: max 2000 chars)
    if (trimmed.length > 2000) {
      return {
        isSafe: false,
        blockedReason: 'Prompt exceeds maximum character limit of 2,000 characters.',
        safeResponse: 'Your question is a bit too long. Please shorten your message to under 2,000 characters so I can assist you better.',
      };
    }

    // Check Prompt Injection
    for (const pattern of this.INJECTION_PATTERNS) {
      if (pattern.test(trimmed)) {
        return {
          isSafe: false,
          blockedReason: 'Security boundary enforcement triggered.',
          safeResponse: 'I am the AgroRent AI Assistant. I can only assist with agricultural guidance, equipment, livestock, and official platform workflows.',
        };
      }
    }

    // Check Privacy Inquiries
    for (const pattern of this.PRIVACY_PATTERNS) {
      if (pattern.test(trimmed)) {
        return {
          isSafe: false,
          blockedReason: 'Privacy boundary violation.',
          safeResponse: 'I cannot provide or search for any other user\'s private credentials, payment details, or personal accounts. You can view your own orders in your dashboard.',
        };
      }
    }

    // Check Hazardous Materials
    for (const pattern of this.HAZARDOUS_PATTERNS) {
      if (pattern.test(trimmed)) {
        return {
          isSafe: false,
          blockedReason: 'Hazardous substance restriction.',
          safeResponse: 'I cannot provide information on restricted, harmful, or prohibited substances. Please consult your local Krishi Vigyan Kendra (KVK) or agricultural extension officer.',
        };
      }
    }

    return { isSafe: true };
  }

  /**
   * Sanitizes output and appends safety disclaimers where appropriate.
   */
  static sanitizeResponse(text: string): string {
    if (!text) return '';

    let sanitized = text;

    // Filter out accidental system leak artifacts
    sanitized = sanitized
      .replace(/AI_API_KEY/gi, '[REDACTED]')
      .replace(/GEMINI_API_KEY/gi, '[REDACTED]')
      .replace(/JWT_SECRET/gi, '[REDACTED]');

    return sanitized;
  }

  /**
   * Standard disclaimer for agricultural & government information.
   */
  static getGovernmentDisclaimer(): string {
    return '\n\n*Note: Information on government schemes is retrieved from AgroRent\'s database. Official eligibility, application guidelines, and approvals are managed solely by government authorities. Please verify details on official portals.*';
  }

  /**
   * Standard disclaimer for livestock & veterinary advice.
   */
  static getVeterinaryDisclaimer(): string {
    return '\n\n*Note: This is general livestock care guidance and not a veterinary prescription. Please consult a qualified veterinary doctor for any animal illness diagnosis or treatment.*';
  }
}
