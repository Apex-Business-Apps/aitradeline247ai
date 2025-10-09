import path from 'node:path';
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';
import express from 'express';
import compression from 'compression';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const distDir = path.join(__dirname, 'dist');
const indexPath = path.join(distDir, 'index.html');

const app = express();

app.set('trust proxy', 1);
app.disable('x-powered-by');

app.use(
  helmet({
    contentSecurityPolicy: false,
    crossOriginEmbedderPolicy: false,
  }),
);

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

app.get('/healthz', (_req, res) => {
  res.type('text/plain').send('ok');
});

app.get('/readyz', (_req, res) => {
  fs.access(indexPath, fs.constants.R_OK, (err) => {
    if (err) {
      res.sendStatus(503);
    } else {
      res.type('text/plain').send('ok');
    }
  });
});

app.use(
  express.static(distDir, {
    index: false,
    maxAge: '1y',
    etag: true,
    setHeaders(res, filePath) {
      if (filePath.endsWith('index.html')) {
        res.setHeader('Cache-Control', 'no-cache');
      }
    },
  }),
);

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
