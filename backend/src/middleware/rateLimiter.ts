import { Request, Response, NextFunction } from 'express';

interface RateLimitStore {
  count: number;
  resetTime: number;
}

const memoryStore = new Map<string, RateLimitStore>();

// Background cleanup every 5 minutes to prevent memory leaks
setInterval(() => {
  const now = Date.now();
  for (const [key, record] of memoryStore.entries()) {
    if (record.resetTime <= now) {
      memoryStore.delete(key);
    }
  }
}, 5 * 60 * 1000);

export interface RateLimitOptions {
  windowMs: number;
  max: number;
  message?: string;
  keyGenerator?: (req: Request) => string;
}

export function createRateLimiter(options: RateLimitOptions) {
  const {
    windowMs,
    max,
    message = 'Too many requests. Please slow down and try again in a few moments.',
    keyGenerator = (req: Request) => {
      const forwarded = req.headers['x-forwarded-for'];
      const ip = typeof forwarded === 'string' ? forwarded.split(',')[0].trim() : req.socket.remoteAddress || 'unknown';
      return `${req.baseUrl || req.path}:${ip}`;
    },
  } = options;

  return (req: Request, res: Response, next: NextFunction): any => {
    const key = keyGenerator(req);
    const now = Date.now();
    const record = memoryStore.get(key);

    if (!record || record.resetTime <= now) {
      memoryStore.set(key, {
        count: 1,
        resetTime: now + windowMs,
      });
      res.setHeader('X-RateLimit-Limit', max);
      res.setHeader('X-RateLimit-Remaining', max - 1);
      return next();
    }

    if (record.count >= max) {
      const retryAfterSeconds = Math.ceil((record.resetTime - now) / 1000);
      res.setHeader('Retry-After', retryAfterSeconds);
      res.setHeader('X-RateLimit-Limit', max);
      res.setHeader('X-RateLimit-Remaining', 0);
      return res.status(429).json({
        success: false,
        message,
        errorCode: 'RATE_LIMIT_EXCEEDED',
        retryAfterSeconds,
      });
    }

    record.count++;
    res.setHeader('X-RateLimit-Limit', max);
    res.setHeader('X-RateLimit-Remaining', Math.max(0, max - record.count));
    return next();
  };
}

// General API Limiter: 500 requests per 5 minutes per IP
export const generalApiLimiter = createRateLimiter({
  windowMs: 5 * 60 * 1000,
  max: 500,
  message: 'Platform request limit reached. Please wait a moment before refreshing.',
});

// Sensitive Auth Limiter (Login/Register): 30 attempts per 15 minutes per IP
export const authRateLimiter = createRateLimiter({
  windowMs: 15 * 60 * 1000,
  max: 30,
  message: 'Too many authentication attempts. For security, please wait 15 minutes.',
  keyGenerator: (req) => {
    const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress || 'ip';
    return `auth:${ip}`;
  },
});

// AI Rate Limiter: 30 requests per minute
export const aiRateLimiter = createRateLimiter({
  windowMs: 60 * 1000,
  max: 30,
  message: 'AI Assistant rate limit reached. Please wait a moment before sending another message.',
  keyGenerator: (req: any) => {
    const userId = req.user?.id || req.headers['x-forwarded-for'] || req.socket.remoteAddress || 'anon';
    return `ai:${userId}`;
  },
});
