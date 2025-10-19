/**
 * Request ID Tracking Utility
 * Generates unique request IDs for correlation across logs and systems
 */

export interface RequestContext {
  requestId: string;
  timestamp: string;
  userId?: string;
  ipAddress?: string;
  userAgent?: string;
}

/**
 * Generate a new request context with unique ID
 */
export function createRequestContext(
  req: Request,
  userId?: string
): RequestContext {
  const requestId = crypto.randomUUID();
  const timestamp = new Date().toISOString();
  
  // Extract client info safely
  const ipAddress = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 
                    req.headers.get('x-real-ip') || 
                    req.headers.get('cf-connecting-ip') || 
                    'unknown';
  
  const userAgent = req.headers.get('user-agent')?.substring(0, 200) || 'unknown';
  
  return {
    requestId,
    timestamp,
    userId,
    ipAddress,
    userAgent
  };
}

/**
 * Create standardized log entry with request context
 */
export function logWithContext(
  ctx: RequestContext,
  level: 'info' | 'warn' | 'error',
  message: string,
  data?: Record<string, any>
) {
  const logEntry = {
    requestId: ctx.requestId,
    timestamp: ctx.timestamp,
    level,
    message,
    userId: ctx.userId,
    ipAddress: ctx.ipAddress,
    ...data
  };
  
  const logMessage = JSON.stringify(logEntry);
  
  switch (level) {
    case 'error':
      console.error(logMessage);
      break;
    case 'warn':
      console.warn(logMessage);
      break;
    default:
      console.log(logMessage);
  }
}

/**
 * Create response headers with request ID for client correlation
 */
export function createResponseHeaders(
  ctx: RequestContext,
  additionalHeaders: Record<string, string> = {}
): Record<string, string> {
  return {
    'X-Request-ID': ctx.requestId,
    'X-Response-Time': `${Date.now() - new Date(ctx.timestamp).getTime()}ms`,
    ...additionalHeaders
  };
}

