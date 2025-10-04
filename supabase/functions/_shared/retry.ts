/**
 * Retry Utility with Exponential Backoff
 * Implements reliable retry logic for external API calls
 */

export interface RetryOptions {
  maxAttempts?: number;
  initialDelayMs?: number;
  maxDelayMs?: number;
  backoffMultiplier?: number;
  timeoutMs?: number;
  shouldRetry?: (error: any, attempt: number) => boolean;
}

const DEFAULT_OPTIONS: Required<RetryOptions> = {
  maxAttempts: 3,
  initialDelayMs: 1000,
  maxDelayMs: 10000,
  backoffMultiplier: 2,
  timeoutMs: 30000,
  shouldRetry: (error: any, attempt: number) => {
    // Retry on network errors, 5xx, or rate limits
    if (error?.status) {
      return error.status >= 500 || error.status === 429;
    }
    return attempt < 3; // Always retry at least twice on unknown errors
  }
};

/**
 * Sleep utility for delays
 */
function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Execute a function with retry logic and exponential backoff
 */
export async function withRetry<T>(
  fn: () => Promise<T>,
  options: RetryOptions = {}
): Promise<T> {
  const opts = { ...DEFAULT_OPTIONS, ...options };
  let lastError: any;
  
  for (let attempt = 1; attempt <= opts.maxAttempts; attempt++) {
    try {
      // Wrap in timeout
      const timeoutPromise = new Promise<never>((_, reject) => 
        setTimeout(() => reject(new Error('Request timeout')), opts.timeoutMs)
      );
      
      const result = await Promise.race([fn(), timeoutPromise]);
      
      // Success - return result
      if (attempt > 1) {
        console.log(`✅ Retry succeeded on attempt ${attempt}/${opts.maxAttempts}`);
      }
      
      return result;
      
    } catch (error) {
      lastError = error;
      
      console.warn(`Attempt ${attempt}/${opts.maxAttempts} failed:`, {
        error: error instanceof Error ? error.message : String(error),
        status: (error as any)?.status
      });
      
      // Check if we should retry
      if (attempt >= opts.maxAttempts || !opts.shouldRetry(error, attempt)) {
        throw error;
      }
      
      // Calculate exponential backoff delay with jitter
      const baseDelay = opts.initialDelayMs * Math.pow(opts.backoffMultiplier, attempt - 1);
      const jitter = Math.random() * 0.3 * baseDelay; // ±30% jitter
      const delay = Math.min(baseDelay + jitter, opts.maxDelayMs);
      
      console.log(`⏳ Retrying in ${Math.round(delay)}ms...`);
      await sleep(delay);
    }
  }
  
  throw lastError;
}

/**
 * Retry specifically for fetch requests
 */
export async function fetchWithRetry(
  url: string,
  init?: RequestInit,
  options?: RetryOptions
): Promise<Response> {
  return withRetry(async () => {
    const response = await fetch(url, init);
    
    // Throw for error status codes so retry logic can handle them
    if (!response.ok) {
      const error: any = new Error(`HTTP ${response.status}: ${response.statusText}`);
      error.status = response.status;
      error.response = response;
      throw error;
    }
    
    return response;
  }, {
    ...options,
    shouldRetry: (error: any, attempt: number) => {
      // Don't retry 4xx errors (except 429)
      if (error?.status >= 400 && error?.status < 500 && error?.status !== 429) {
        return false;
      }
      // Retry 5xx and 429
      if (error?.status >= 500 || error?.status === 429) {
        return attempt < (options?.maxAttempts || 3);
      }
      // Retry network errors
      return attempt < (options?.maxAttempts || 3);
    }
  });
}
