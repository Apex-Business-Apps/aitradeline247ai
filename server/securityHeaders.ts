/**
 * Enhanced Security Headers Configuration
 * Backend only - no UI changes
 */

import helmet from 'helmet';
import type { Request, Response, NextFunction } from 'express';

/**
 * Get helmet configuration with enhanced security headers
 */
export function getSecurityHeaders() {
  return helmet({
    // Content Security Policy
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'"], // Relaxed for compatibility
        styleSrc: ["'self'", "https:", "'unsafe-inline'"], // Allow inline styles for React
        imgSrc: ["'self'", "data:", "https:"],
        connectSrc: [
          "'self'",
          "https://hysvqdwmhxnblxfqnszn.supabase.co",
          "wss://hysvqdwmhxnblxfqnszn.supabase.co",
          "https://api.tradeline247ai.com",
          "wss://api.tradeline247ai.com"
        ],
        fontSrc: ["'self'", "data:"],
        objectSrc: ["'none'"],
        mediaSrc: ["'self'"],
        frameSrc: ["'none'"],
        baseUri: ["'self'"],
        formAction: ["'self'"],
        frameAncestors: ["'none'"],
        upgradeInsecureRequests: [],
      },
    },

    // Strict Transport Security (HSTS)
    hsts: {
      maxAge: 31536000, // 1 year
      includeSubDomains: true,
      preload: true,
    },

    // X-Frame-Options
    frameguard: {
      action: 'deny',
    },

    // X-Content-Type-Options
    noSniff: true,

    // X-XSS-Protection
    xssFilter: true,

    // Referrer-Policy
    referrerPolicy: {
      policy: 'strict-origin-when-cross-origin',
    },

    // Cross-Origin-Opener-Policy
    crossOriginOpenerPolicy: {
      policy: 'same-origin',
    },

    // Cross-Origin-Resource-Policy
    crossOriginResourcePolicy: {
      policy: 'same-origin',
    },

    // Cross-Origin-Embedder-Policy
    crossOriginEmbedderPolicy: false, // Disabled for external resources

    // Remove X-Powered-By header
    hidePoweredBy: true,

    // DNS Prefetch Control
    dnsPrefetchControl: {
      allow: false,
    },

    // Expect-CT (deprecated but still useful)
    expectCt: {
      enforce: true,
      maxAge: 86400, // 1 day
    },

    // Permissions Policy
    permittedCrossDomainPolicies: {
      permittedPolicies: 'none',
    },
  });
}

/**
 * Additional custom security headers middleware
 */
export function additionalSecurityHeaders(req: Request, res: Response, next: NextFunction) {
  // Permissions Policy (replaces Feature-Policy)
  res.setHeader('Permissions-Policy', [
    'geolocation=()',
    'microphone=()',
    'camera=()',
    'payment=()',
    'usb=()',
    'magnetometer=()',
    'gyroscope=()',
    'accelerometer=()',
  ].join(', '));

  // X-Permitted-Cross-Domain-Policies
  res.setHeader('X-Permitted-Cross-Domain-Policies', 'none');

  // X-Download-Options
  res.setHeader('X-Download-Options', 'noopen');

  // Clear-Site-Data on logout endpoint
  if (req.path === '/api/auth/logout') {
    res.setHeader('Clear-Site-Data', '"cache", "cookies", "storage"');
  }

  next();
}

/**
 * CORS configuration for API endpoints
 */
export function getCorsOptions() {
  return {
    origin: (origin: string | undefined, callback: (err: Error | null, allow?: boolean) => void) => {
      const allowedOrigins = [
        'https://tradeline247ai.com',
        'https://www.tradeline247ai.com',
        'https://api.tradeline247ai.com',
      ];

      // Allow requests with no origin (mobile apps, curl, etc.)
      if (!origin) {
        return callback(null, true);
      }

      // Check if origin is in allowed list
      if (allowedOrigins.includes(origin) || origin.includes('localhost')) {
        callback(null, true);
      } else {
        callback(new Error('Not allowed by CORS'));
      }
    },
    credentials: true,
    optionsSuccessStatus: 200,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: [
      'Content-Type',
      'Authorization',
      'X-Requested-With',
      'X-Request-ID',
    ],
    exposedHeaders: [
      'X-Request-ID',
      'X-RateLimit-Limit',
      'X-RateLimit-Remaining',
      'X-RateLimit-Reset',
    ],
  };
}
