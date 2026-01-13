/**
 * Simple in-memory rate limiter
 * For production at scale, consider using Vercel KV or Upstash Redis
 */

interface RateLimitEntry {
  count: number;
  resetTime: number;
}

const rateLimitMap = new Map<string, RateLimitEntry>();

// Clean up old entries every 5 minutes
setInterval(() => {
  const now = Date.now();
  for (const [key, entry] of rateLimitMap.entries()) {
    if (now > entry.resetTime) {
      rateLimitMap.delete(key);
    }
  }
}, 5 * 60 * 1000);

export interface RateLimitConfig {
  maxRequests: number;  // Max requests allowed
  windowMs: number;     // Time window in milliseconds
}

export interface RateLimitResult {
  success: boolean;
  remaining: number;
  resetIn: number;  // Seconds until reset
}

export function checkRateLimit(
  identifier: string,
  config: RateLimitConfig
): RateLimitResult {
  const now = Date.now();
  const key = identifier;

  let entry = rateLimitMap.get(key);

  // If no entry or window has passed, create new entry
  if (!entry || now > entry.resetTime) {
    entry = {
      count: 1,
      resetTime: now + config.windowMs,
    };
    rateLimitMap.set(key, entry);
    return {
      success: true,
      remaining: config.maxRequests - 1,
      resetIn: Math.ceil(config.windowMs / 1000),
    };
  }

  // Check if limit exceeded
  if (entry.count >= config.maxRequests) {
    return {
      success: false,
      remaining: 0,
      resetIn: Math.ceil((entry.resetTime - now) / 1000),
    };
  }

  // Increment counter
  entry.count++;
  rateLimitMap.set(key, entry);

  return {
    success: true,
    remaining: config.maxRequests - entry.count,
    resetIn: Math.ceil((entry.resetTime - now) / 1000),
  };
}

// Get client IP from request headers
export function getClientIp(request: Request): string {
  const forwarded = request.headers.get('x-forwarded-for');
  if (forwarded) {
    return forwarded.split(',')[0].trim();
  }
  const realIp = request.headers.get('x-real-ip');
  if (realIp) {
    return realIp;
  }
  return 'unknown';
}

// Pre-configured rate limiters for different endpoints
export const RATE_LIMITS = {
  // Transcript creation: 10 per hour (expensive operation)
  transcriptCreate: { maxRequests: 10, windowMs: 60 * 60 * 1000 },

  // AI operations: 20 per hour
  aiOperations: { maxRequests: 20, windowMs: 60 * 60 * 1000 },

  // Auth attempts: 5 per 15 minutes (prevent brute force)
  authAttempts: { maxRequests: 5, windowMs: 15 * 60 * 1000 },

  // Registration: 3 per hour
  registration: { maxRequests: 3, windowMs: 60 * 60 * 1000 },

  // General API: 100 per minute
  general: { maxRequests: 100, windowMs: 60 * 1000 },
};
