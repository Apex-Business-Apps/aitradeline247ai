import express from 'express';
import path from 'node:path';
import fs from 'node:fs';
import compression from 'compression';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const distDir = path.join(__dirname, 'dist');
const indexPath = path.join(distDir, 'index.html');

const app = express();

app.set('trust proxy', 1);
app.disable('x-powered-by');

// CSP that doesn't brick boot
const csp = helmet.contentSecurityPolicy.getDefaultDirectives();
csp["script-src"] = ["'self'"];
csp["style-src"] = ["'self'", "https:", "'unsafe-inline'"];
csp["img-src"] = ["'self'", "data:", "https:"];
csp["connect-src"] = ["'self'", "https://hysvqdwmhxnblxfqnszn.supabase.co", "wss://hysvqdwmhxnblxfqnszn.supabase.co", "https://api.tradeline247ai.com", "wss://api.tradeline247ai.com"];
app.use(helmet({ contentSecurityPolicy: { directives: csp } }));
console.log('[Server] CSP directives:', JSON.stringify(csp, null, 2));

app.use(compression());
app.use(express.json({ limit: '100kb' }));

const apiLimiter = rateLimit({
  windowMs: 60_000,
  max: 120,
  standardHeaders: true,
  legacyHeaders: false,
});

const authLimiter = rateLimit({
  windowMs: 60_000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
});

app.use('/api', apiLimiter);
app.use('/auth', authLimiter);

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
