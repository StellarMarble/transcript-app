/**
 * Redis-based rate limiter using Upstash
 * Falls back to in-memory for local development without Redis
 */

import { Redis } from '@upstash/redis';

// Initialize Redis client if credentials are available
const redis = process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN
  ? new Redis({
      url: process.env.UPSTASH_REDIS_REST_URL,
      token: process.env.UPSTASH_REDIS_REST_TOKEN,
    })
  : null;

// Fallback in-memory store for local development
const memoryStore = new Map<string, { count: number; resetTime: number }>();

export interface RateLimitConfig {
  maxRequests: number;
  windowMs: number;
}

export interface RateLimitResult {
  success: boolean;
  remaining: number;
  resetIn: number;
}

export async function checkRateLimit(
  identifier: string,
  config: RateLimitConfig
): Promise<RateLimitResult> {
  if (redis) {
    return checkRateLimitRedis(identifier, config);
  }
  return checkRateLimitMemory(identifier, config);
}

async function checkRateLimitRedis(
  identifier: string,
  config: RateLimitConfig
): Promise<RateLimitResult> {
  const key = `ratelimit:${identifier}`;
  const windowSeconds = Math.ceil(config.windowMs / 1000);

  try {
    // Use Redis INCR with expiry for atomic rate limiting
    const count = await redis!.incr(key);

    // Set expiry only on first request (when count is 1)
    if (count === 1) {
      await redis!.expire(key, windowSeconds);
    }

    // Get TTL to calculate resetIn
    const ttl = await redis!.ttl(key);
    const resetIn = ttl > 0 ? ttl : windowSeconds;

    if (count > config.maxRequests) {
      return {
        success: false,
        remaining: 0,
        resetIn,
      };
    }

    return {
      success: true,
      remaining: config.maxRequests - count,
      resetIn,
    };
  } catch (error) {
    console.error('Redis rate limit error:', error);
    // On Redis error, allow the request (fail open)
    return { success: true, remaining: config.maxRequests, resetIn: 0 };
  }
}

function checkRateLimitMemory(
  identifier: string,
  config: RateLimitConfig
): RateLimitResult {
  const now = Date.now();
  let entry = memoryStore.get(identifier);

  // Clean up expired entry
  if (entry && now > entry.resetTime) {
    memoryStore.delete(identifier);
    entry = undefined;
  }

  if (!entry) {
    entry = { count: 1, resetTime: now + config.windowMs };
    memoryStore.set(identifier, entry);
    return {
      success: true,
      remaining: config.maxRequests - 1,
      resetIn: Math.ceil(config.windowMs / 1000),
    };
  }

  if (entry.count >= config.maxRequests) {
    return {
      success: false,
      remaining: 0,
      resetIn: Math.ceil((entry.resetTime - now) / 1000),
    };
  }

  entry.count++;
  return {
    success: true,
    remaining: config.maxRequests - entry.count,
    resetIn: Math.ceil((entry.resetTime - now) / 1000),
  };
}

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

export const RATE_LIMITS = {
  transcriptCreate: { maxRequests: 10, windowMs: 60 * 60 * 1000 },
  aiOperations: { maxRequests: 20, windowMs: 60 * 60 * 1000 },
  authAttempts: { maxRequests: 5, windowMs: 15 * 60 * 1000 },
  registration: { maxRequests: 3, windowMs: 60 * 60 * 1000 },
  general: { maxRequests: 100, windowMs: 60 * 1000 },
};
