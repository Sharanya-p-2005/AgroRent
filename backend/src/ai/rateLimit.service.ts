/**
 * Phase 10: AI Rate Limiting Service
 * Protects AI endpoints from abuse and controls token/request costs.
 * Default: 20 requests per user per hour (configurable via env vars).
 */

interface RateLimitRecord {
  timestamps: number[];
}

export class RateLimitService {
  private static userRequests = new Map<string, RateLimitRecord>();

  /**
   * Retrieves configured max requests and sliding window in milliseconds.
   */
  private static getConfig() {
    const maxRequests = parseInt(process.env.AI_RATE_LIMIT || '20', 10);
    const windowSeconds = parseInt(process.env.AI_RATE_WINDOW || '3600', 10);
    return {
      maxRequests: isNaN(maxRequests) ? 20 : maxRequests,
      windowMs: (isNaN(windowSeconds) ? 3600 : windowSeconds) * 1000,
    };
  }

  /**
   * Checks if user has exceeded their rate limit.
   * Admin users bypass the rate limit.
   */
  static checkRateLimit(userId: string, userRole?: string): {
    allowed: boolean;
    remaining: number;
    resetInSeconds: number;
  } {
    if (userRole === 'ADMIN') {
      return { allowed: true, remaining: 9999, resetInSeconds: 0 };
    }

    const now = Date.now();
    const { maxRequests, windowMs } = this.getConfig();

    let record = this.userRequests.get(userId);
    if (!record) {
      record = { timestamps: [] };
      this.userRequests.set(userId, record);
    }

    // Filter out timestamps outside the sliding window
    record.timestamps = record.timestamps.filter((ts) => now - ts < windowMs);

    if (record.timestamps.length >= maxRequests) {
      const oldest = record.timestamps[0];
      const resetInSeconds = Math.max(1, Math.ceil((oldest + windowMs - now) / 1000));
      return {
        allowed: false,
        remaining: 0,
        resetInSeconds,
      };
    }

    // Allowed: record timestamp
    record.timestamps.push(now);
    const remaining = maxRequests - record.timestamps.length;
    return {
      allowed: true,
      remaining,
      resetInSeconds: Math.ceil(windowMs / 1000),
    };
  }

  /**
   * Cleanup stale records periodically to avoid memory growth.
   */
  static cleanupStaleRecords(): void {
    const now = Date.now();
    const { windowMs } = this.getConfig();

    for (const [userId, record] of this.userRequests.entries()) {
      record.timestamps = record.timestamps.filter((ts) => now - ts < windowMs);
      if (record.timestamps.length === 0) {
        this.userRequests.delete(userId);
      }
    }
  }
}

// Run cleanup every 15 minutes
setInterval(() => {
  RateLimitService.cleanupStaleRecords();
}, 15 * 60 * 1000);
