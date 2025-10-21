/**
 * Centralized Error Reporter
 * Captures and reports all errors for monitoring
 */

interface ErrorReport {
  type: 'error' | 'unhandledRejection' | 'react' | 'network';
  message: string;
  stack?: string;
  timestamp: string;
  url: string;
  userAgent: string;
  environment: string;
  metadata?: Record<string, any>;
}

class ErrorReporter {
  private errors: ErrorReport[] = [];
  private maxErrors = 50;
  private reportEndpoint = '/api/errors'; // Could be Supabase function

  constructor() {
    if (typeof window !== 'undefined') {
      this.setupGlobalHandlers();
    }
  }

  private setupGlobalHandlers() {
    // Catch unhandled errors
    window.addEventListener('error', (event) => {
      this.report({
        type: 'error',
        message: event.message,
        stack: event.error?.stack,
        timestamp: new Date().toISOString(),
        url: window.location.href,
        userAgent: navigator.userAgent,
        environment: this.getEnvironment(),
        metadata: {
          filename: event.filename,
          lineno: event.lineno,
          colno: event.colno
        }
      });
    });

    // Catch unhandled promise rejections
    window.addEventListener('unhandledrejection', (event) => {
      this.report({
        type: 'unhandledRejection',
        message: event.reason?.message || String(event.reason),
        stack: event.reason?.stack,
        timestamp: new Date().toISOString(),
        url: window.location.href,
        userAgent: navigator.userAgent,
        environment: this.getEnvironment(),
        metadata: {
          reason: event.reason
        }
      });
    });

    // Network error detection
    const originalFetch = window.fetch;
    window.fetch = async (...args) => {
      try {
        const response = await originalFetch(...args);
        if (!response.ok) {
          this.report({
            type: 'network',
            message: `Network error: ${response.status} ${response.statusText}`,
            timestamp: new Date().toISOString(),
            url: window.location.href,
            userAgent: navigator.userAgent,
            environment: this.getEnvironment(),
            metadata: {
              fetchUrl: args[0],
              status: response.status,
              statusText: response.statusText
            }
          });
        }
        return response;
      } catch (error) {
        this.report({
          type: 'network',
          message: `Fetch failed: ${error}`,
          stack: error instanceof Error ? error.stack : undefined,
          timestamp: new Date().toISOString(),
          url: window.location.href,
          userAgent: navigator.userAgent,
          environment: this.getEnvironment(),
          metadata: {
            fetchUrl: args[0],
            error: String(error)
          }
        });
        throw error;
      }
    };
  }

  private getEnvironment(): string {
    const hostname = window.location.hostname;
    if (hostname.includes('lovableproject.com') || hostname.includes('https://tradeline247aicom.lovable.app/')) {
      return 'preview';
    }
    if (hostname === 'localhost' || hostname === '127.0.0.1') {
      return 'development';
    }
    if (hostname.includes('tradeline247ai.com')) {
      return 'production';
    }
    return 'unknown';
  }

  report(error: ErrorReport) {
    // Add to local store
    this.errors.push(error);
    if (this.errors.length > this.maxErrors) {
      this.errors.shift();
    }

    // Log to console in dev
    if (import.meta.env.DEV || this.getEnvironment() === 'preview') {
      console.error('📊 Error Report:', error);
    }

    // Send to backend (optional, only in production)
    if (this.getEnvironment() === 'production') {
      this.sendToBackend(error).catch(e => {
        console.warn('Failed to send error report:', e);
      });
    }

    // Store in localStorage for debugging
    try {
      const stored = JSON.parse(localStorage.getItem('error_reports') || '[]');
      stored.push(error);
      // Keep only last 20
      const trimmed = stored.slice(-20);
      localStorage.setItem('error_reports', JSON.stringify(trimmed));
    } catch (e) {
      // Ignore localStorage errors
    }
  }

  private async sendToBackend(error: ErrorReport) {
    // Only send critical errors to avoid spam
    if (error.type === 'error' || error.type === 'unhandledRejection') {
      try {
        await fetch(this.reportEndpoint, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(error)
        });
      } catch (e) {
        // Silent fail - don't want to create error loops
      }
    }
  }

  getRecentErrors(): ErrorReport[] {
    return [...this.errors];
  }

  clearErrors() {
    this.errors = [];
    try {
      localStorage.removeItem('error_reports');
    } catch (e) {
      // Ignore
    }
  }
}

export const errorReporter = new ErrorReporter();

// Export for React Error Boundaries
export function reportReactError(error: Error, errorInfo: any) {
  errorReporter.report({
    type: 'react',
    message: error.message,
    stack: error.stack,
    timestamp: new Date().toISOString(),
    url: window.location.href,
    userAgent: navigator.userAgent,
    environment: errorReporter['getEnvironment'](),
    metadata: {
      componentStack: errorInfo.componentStack
    }
  });
}

