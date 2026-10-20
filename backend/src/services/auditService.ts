import { Request } from 'express';
import { AuditLogModel, CreateAuditLogDto } from '../models/auditLogModel.js';
import { AuthenticatedRequest } from '../middleware/authMiddleware.js';

export interface LogAuditOptions {
  req?: Request | AuthenticatedRequest;
  action: string;
  entityType: string;
  entityId?: string | null;
  oldValues?: Record<string, any> | null;
  newValues?: Record<string, any> | null;
  userId?: string | null;
}

export class AuditService {
  /**
   * Safe asynchronous audit logger. Does not throw or block the main request thread if logging fails.
   */
  static async log(options: LogAuditOptions): Promise<void> {
    try {
      let ipAddress: string | null = null;
      let userAgent: string | null = null;
      let userId: string | null = options.userId || null;

      if (options.req) {
        // Extract client IP address safely
        const forwarded = options.req.headers['x-forwarded-for'];
        if (typeof forwarded === 'string') {
          ipAddress = forwarded.split(',')[0].trim();
        } else if (Array.isArray(forwarded)) {
          ipAddress = forwarded[0].trim();
        } else {
          ipAddress = (options.req.socket?.remoteAddress as string) || null;
        }

        userAgent = (options.req.headers['user-agent'] as string) || null;

        if (!userId && (options.req as AuthenticatedRequest).user) {
          userId = (options.req as AuthenticatedRequest).user?.id || null;
        }
      }

      // Filter out sensitive fields like passwords, secrets, tokens, UPI pins from values
      const sanitize = (data?: Record<string, any> | null) => {
        if (!data || typeof data !== 'object') return null;
        const sanitized: Record<string, any> = {};
        for (const [key, value] of Object.entries(data)) {
          const lower = key.toLowerCase();
          if (
            lower.includes('password') ||
            lower.includes('secret') ||
            lower.includes('pin') ||
            lower.includes('token') ||
            lower.includes('credential') ||
            lower.includes('razorpay_key_secret')
          ) {
            sanitized[key] = '***REDACTED***';
          } else {
            sanitized[key] = value;
          }
        }
        return sanitized;
      };

      const dto: CreateAuditLogDto = {
        user_id: userId,
        action: options.action,
        entity_type: options.entityType,
        entity_id: options.entityId,
        old_values: sanitize(options.oldValues),
        new_values: sanitize(options.newValues),
        ip_address: ipAddress,
        user_agent: userAgent,
      };

      await AuditLogModel.create(dto);
    } catch (err: any) {
      console.warn('[AuditService] Failed to record audit log:', err.message);
    }
  }
}
