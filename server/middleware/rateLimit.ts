/**
 * Enhanced Rate Limiting Middleware with Supabase Logging
 * Backend only - no UI changes
 */

import type { Request, Response, NextFunction } from 'express';
import { createClient } from '@supabase/supabase-js';

interface RateLimitConfig {
  windowMs: number;
  maxRequests: number;
  blockDurationMs?: number;
  skipSuccessfulRequests?: boolean;
}

const supabaseUrl = process.env.VITE_SUPABASE_URL || 'https://hysvqdwmhxnblxfqnszn.supabase.co';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

// In-memory fallback if Supabase is unavailable
const memoryStore = new Map<string, { count: number; resetAt: number; blockedUntil?: number }>();

/**
 * Create rate limiter middleware
 */
export function createRateLimiter(config: RateLimitConfig) {
  const { windowMs, maxRequests, blockDurationMs = 15 * 60 * 1000 } = config;

  return async (req: Request, res: Response, next: NextFunction) => {
    const endpoint = req.path;
    const identifier = getIdentifier(req);
    const now = Date.now();

    try {
      // Initialize Supabase client
      const supabase = createClient(supabaseUrl, supabaseKey);

      // Calculate window start
      const windowStart = new Date(now - windowMs);

      // Check if blocked
      const { data: blocked } = await supabase
        .from('api_rate_limits')
        .select('blocked_until')
        .eq('identifier', identifier)
        .eq('endpoint', endpoint)
        .not('blocked_until', 'is', null)
        .gte('blocked_until', new Date().toISOString())
        .single();

      if (blocked) {
        console.warn(`[RateLimit] Blocked request from ${identifier} to ${endpoint}`);
        return res.status(429).json({
          error: 'Too many requests',
          retry_after: new Date(blocked.blocked_until).toISOString()
        });
      }

      // Get current request count
      const { data: existing } = await supabase
        .from('api_rate_limits')
        .select('request_count, window_start')
        .eq('identifier', identifier)
        .eq('endpoint', endpoint)
        .gte('window_start', windowStart.toISOString())
        .single();

      let requestCount = 1;

      if (existing) {
        requestCount = existing.request_count + 1;

        // Check if limit exceeded
        if (requestCount > maxRequests) {
          // Block the identifier
          const blockedUntil = new Date(now + blockDurationMs);
          
          await supabase
            .from('api_rate_limits')
            .update({
              blocked_until: blockedUntil.toISOString(),
              updated_at: new Date().toISOString()
            })
            .eq('identifier', identifier)
            .eq('endpoint', endpoint);

          // Log security event
          await supabase.rpc('log_security_event', {
            p_event_type: 'rate_limit_exceeded',
            p_user_id: null,
            p_ip_address: identifier,
            p_event_data: {
              endpoint,
              request_count: requestCount,
              blocked_until: blockedUntil.toISOString()
            }
          });

          console.warn(`[RateLimit] Limit exceeded for ${identifier} on ${endpoint}`);
          
          return res.status(429).json({
            error: 'Too many requests',
            retry_after: blockedUntil.toISOString()
          });
        }

        // Increment count
        await supabase
          .from('api_rate_limits')
          .update({
            request_count: requestCount,
            updated_at: new Date().toISOString()
          })
          .eq('identifier', identifier)
          .eq('endpoint', endpoint);
      } else {
        // Create new rate limit record
        await supabase
          .from('api_rate_limits')
          .insert({
            identifier,
            endpoint,
            request_count: 1,
            window_start: new Date().toISOString()
          });
      }

      // Add rate limit headers
      res.setHeader('X-RateLimit-Limit', maxRequests.toString());
      res.setHeader('X-RateLimit-Remaining', Math.max(0, maxRequests - requestCount).toString());
      res.setHeader('X-RateLimit-Reset', new Date(now + windowMs).toISOString());

      // Continue to next middleware
      next();

    } catch (error) {
      console.error('[RateLimit] Error:', error);
      
      // Fallback to memory store
      const key = `${identifier}:${endpoint}`;
      const record = memoryStore.get(key);

      if (record) {
        if (record.blockedUntil && record.blockedUntil > now) {
          return res.status(429).json({
            error: 'Too many requests',
            retry_after: new Date(record.blockedUntil).toISOString()
          });
        }

        if (record.resetAt < now) {
          // Reset window
          memoryStore.set(key, { count: 1, resetAt: now + windowMs });
        } else {
          record.count++;
          if (record.count > maxRequests) {
            record.blockedUntil = now + blockDurationMs;
            return res.status(429).json({
              error: 'Too many requests',
              retry_after: new Date(record.blockedUntil).toISOString()
            });
          }
        }
      } else {
        memoryStore.set(key, { count: 1, resetAt: now + windowMs });
      }

      next();
    }
  };
}

/**
 * Get identifier from request (IP or user ID)
 */
function getIdentifier(req: Request): string {
  // Try to get user ID from JWT if authenticated
  const authHeader = req.headers.authorization;
  if (authHeader) {
    try {
      const token = authHeader.replace('Bearer ', '');
      const payload = JSON.parse(Buffer.from(token.split('.')[1], 'base64').toString());
      if (payload.sub) {
        return `user:${payload.sub}`;
      }
    } catch {
      // Fall through to IP
    }
  }

  // Fall back to IP address
  const forwarded = req.headers['x-forwarded-for'];
  const ip = forwarded 
    ? (Array.isArray(forwarded) ? forwarded[0] : forwarded.split(',')[0]).trim()
    : req.socket.remoteAddress || 'unknown';
  
  return `ip:${ip}`;
}

/**
 * Cleanup old rate limit records (run periodically)
 */
export async function cleanupRateLimits(): Promise<number> {
  try {
    const supabase = createClient(supabaseUrl, supabaseKey);
    const { data, error } = await supabase.rpc('cleanup_old_rate_limits');
    
    if (error) {
      console.error('[RateLimit] Cleanup error:', error);
      return 0;
    }
    
    return data as number;
  } catch (error) {
    console.error('[RateLimit] Cleanup exception:', error);
    return 0;
  }
}
