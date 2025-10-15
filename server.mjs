import express from 'express';
import path from 'node:path';
import fs from 'node:fs';
import compression from 'compression';
import { fileURLToPath } from 'node:url';
import { getSecurityHeaders, additionalSecurityHeaders } from './server/securityHeaders.ts';
import { createRateLimiter, cleanupRateLimits } from './server/middleware/rateLimit.ts';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const distDir = path.join(__dirname, 'dist');
const indexPath = path.join(distDir, 'index.html');

const app = express();

app.set('trust proxy', 1);
app.disable('x-powered-by');

// Enhanced security headers
app.use(getSecurityHeaders());
app.use(additionalSecurityHeaders);

app.use(compression());
app.use(express.json({ limit: '100kb' }));

// Enhanced rate limiting with Supabase logging
const apiLimiter = createRateLimiter({
  windowMs: 60_000,
  maxRequests: 120,
  blockDurationMs: 15 * 60 * 1000, // 15 minutes
});

const authLimiter = createRateLimiter({
  windowMs: 60_000,
  maxRequests: 20,
  blockDurationMs: 30 * 60 * 1000, // 30 minutes
});

const mfaLimiter = createRateLimiter({
  windowMs: 60_000,
  maxRequests: 10,
  blockDurationMs: 60 * 60 * 1000, // 1 hour
});

// Apply rate limiting (skip health endpoints)
app.use((req, res, next) => {
  if (req.path === '/healthz' || req.path === '/readyz') {
    return next();
  }
  
  if (req.path.startsWith('/api/mfa/') || req.path.startsWith('/api/auth/')) {
    return mfaLimiter(req, res, next);
  }
  
  if (req.path.startsWith('/api/')) {
    return apiLimiter(req, res, next);
  }
  
  if (req.path.startsWith('/auth/')) {
    return authLimiter(req, res, next);
  }
  
  next();
});

// Cleanup rate limits every hour
setInterval(async () => {
  const cleaned = await cleanupRateLimits();
  if (cleaned > 0) {
    console.log(`[Server] Cleaned up ${cleaned} expired rate limit records`);
  }
}, 60 * 60 * 1000);

// Health checks
app.get('/healthz', (_req, res) => {
  res.type('text/plain').send('ok');
});

app.get('/readyz', (_req, res) => {
  fs.access(indexPath, fs.constants.R_OK, (err) => {
    if (err) {
      res.sendStatus(503);
    } else {
      res.type('text/plain').send('ready');
    }
  });
});

// Static mounts (order matters - before fallback)
app.use(express.static(distDir, {
  index: false,
  maxAge: '1y',
  etag: true,
  setHeaders(res, filePath) {
    if (filePath.endsWith('index.html')) {
      res.setHeader('Cache-Control', 'no-cache');
    }
  },
}));

app.use('/assets', express.static(path.join(__dirname, 'public', 'assets'), {
  maxAge: '1y',
  etag: true,
}));

app.use('/favicon.ico', express.static(path.join(__dirname, 'public', 'assets', 'brand', 'App_Icons', 'favicon.ico'), {
  maxAge: '1y',
}));

// Service Worker - always fresh (critical for updates)
app.get('/sw.js', (_req, res) => {
  const swPath = path.join(distDir, 'sw.js');
  res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
  res.setHeader('Content-Type', 'application/javascript');
  res.sendFile(swPath, (err) => {
    if (err && !res.headersSent) {
      res.status(404).send('// Service worker not found');
    }
  });
});

// SPA fallback LAST
app.get('*', (_req, res) => {
  res.sendFile(indexPath, (err) => {
    if (err) {
      if (!res.headersSent) {
        res.sendStatus(err.code === 'ENOENT' ? 503 : 500);
      }
    }
  });
});

const port = Number.parseInt(process.env.PORT ?? '', 10) || 3000;
const host = '0.0.0.0';

const server = app.listen(port, host, () => {
  console.log(`🚀 TradeLine247 server listening on http://${host}:${port}`);
});

const shutdown = () => {
  server.close(() => process.exit(0));
};

process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);
