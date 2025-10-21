/**
 * Circuit Breaker Pattern Implementation
 * Prevents cascade failures when external services are down
 */

export interface CircuitBreakerOptions {
  failureThreshold?: number;      // Failures before opening circuit (default: 5)
  successThreshold?: number;      // Successes to close circuit (default: 2)
  timeout?: number;               // Time in OPEN state before HALF_OPEN (default: 60000ms)
  monitoringWindowMs?: number;    // Rolling window for failure counting (default: 120000ms)
}

export type CircuitState = 'CLOSED' | 'OPEN' | 'HALF_OPEN';

interface CircuitStats {
  state: CircuitState;
  failures: number;
  successes: number;
  lastFailureTime?: number;
  nextAttemptTime?: number;
}

const DEFAULT_OPTIONS: Required<CircuitBreakerOptions> = {
  failureThreshold: 5,
  successThreshold: 2,
  timeout: 60000,
  monitoringWindowMs: 120000
};

/**
 * Circuit Breaker for external service calls
 */
export class CircuitBreaker {
  private stats: Map<string, CircuitStats> = new Map();
  private options: Required<CircuitBreakerOptions>;

  constructor(options: CircuitBreakerOptions = {}) {
    this.options = { ...DEFAULT_OPTIONS, ...options };
  }

  /**
   * Execute function with circuit breaker protection
   */
  async execute<T>(
    serviceName: string,
    fn: () => Promise<T>
  ): Promise<T> {
    const stats = this.getOrCreateStats(serviceName);
    
    // Check if circuit is OPEN
    if (stats.state === 'OPEN') {
      if (Date.now() < (stats.nextAttemptTime || 0)) {
        throw new Error(`Circuit breaker OPEN for ${serviceName}. Retry after ${new Date(stats.nextAttemptTime!).toISOString()}`);
      }
      // Transition to HALF_OPEN
      stats.state = 'HALF_OPEN';
      stats.successes = 0;
      console.log(`🟡 Circuit breaker ${serviceName}: OPEN → HALF_OPEN`);
    }

    try {
      const result = await fn();
      
      // Record success
      this.recordSuccess(serviceName);
      
      return result;
      
    } catch (error) {
      // Record failure
      this.recordFailure(serviceName);
      
      throw error;
    }
  }

  /**
   * Get current circuit state
   */
  getState(serviceName: string): CircuitState {
    return this.stats.get(serviceName)?.state || 'CLOSED';
  }

  /**
   * Manually reset circuit (for admin operations)
   */
  reset(serviceName: string): void {
    this.stats.set(serviceName, {
      state: 'CLOSED',
      failures: 0,
      successes: 0
    });
    console.log(`🔄 Circuit breaker ${serviceName}: RESET to CLOSED`);
  }

  /**
   * Get or create stats for a service
   */
  private getOrCreateStats(serviceName: string): CircuitStats {
    if (!this.stats.has(serviceName)) {
      this.stats.set(serviceName, {
        state: 'CLOSED',
        failures: 0,
        successes: 0
      });
    }
    return this.stats.get(serviceName)!;
  }

  /**
   * Record a successful call
   */
  private recordSuccess(serviceName: string): void {
    const stats = this.getOrCreateStats(serviceName);
    stats.successes++;
    
    // If HALF_OPEN and reached success threshold, close circuit
    if (stats.state === 'HALF_OPEN' && stats.successes >= this.options.successThreshold) {
      stats.state = 'CLOSED';
      stats.failures = 0;
      stats.successes = 0;
      console.log(`✅ Circuit breaker ${serviceName}: HALF_OPEN → CLOSED`);
    }
    
    // Reset failure count on success in CLOSED state
    if (stats.state === 'CLOSED') {
      stats.failures = 0;
    }
  }

  /**
   * Record a failed call
   */
  private recordFailure(serviceName: string): void {
    const stats = this.getOrCreateStats(serviceName);
    stats.failures++;
    stats.lastFailureTime = Date.now();
    
    // If HALF_OPEN, immediately reopen circuit
    if (stats.state === 'HALF_OPEN') {
      stats.state = 'OPEN';
      stats.nextAttemptTime = Date.now() + this.options.timeout;
      console.error(`🔴 Circuit breaker ${serviceName}: HALF_OPEN → OPEN (failure during recovery)`);
      return;
    }
    
    // If CLOSED and reached failure threshold, open circuit
    if (stats.state === 'CLOSED' && stats.failures >= this.options.failureThreshold) {
      stats.state = 'OPEN';
      stats.nextAttemptTime = Date.now() + this.options.timeout;
      console.error(`🔴 Circuit breaker ${serviceName}: CLOSED → OPEN (${stats.failures} failures)`);
    }
  }
}

// Global circuit breaker instance (shared across function invocations)
const globalCircuitBreaker = new CircuitBreaker({
  failureThreshold: 5,
  successThreshold: 2,
  timeout: 60000,
  monitoringWindowMs: 120000
});

export { globalCircuitBreaker };

