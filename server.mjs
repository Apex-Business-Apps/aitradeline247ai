import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';
import twilio from 'twilio';

const app = express();
app.disable('x-powered-by');
app.set('trust proxy', 1);

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PUB = path.join(__dirname, 'public');
const DIST = path.join(__dirname, 'dist');

// 1) Apex → www (strict 308), FIRST
app.use((req, res, next) => {
  if (req.headers.host === 'tradeline247ai.com') {
    return res.redirect(308, `https://www.tradeline247ai.com${req.originalUrl}`);
  }
  next();
});

// 2) Security headers (cheap)
app.use((req, res, next) => {
  res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains; preload');
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'SAMEORIGIN');
  next();
});

// 3) Liveness/Readiness
app.get('/healthz', (_req, res) => res.status(200).send('ok'));
app.get('/readyz',  (_req, res) => res.status(200).send('ok'));

// 4) Static mounts BEFORE SPA
app.use(express.static(PUB,  { immutable: true, maxAge: '1y' }));
app.use(express.static(DIST, { extensions: ['html'] }));

// 5) Telephony (Twilio) — minimal, validated, overload-safe
const webhook = twilio.webhook({ validate: true });

app.post('/voice/answer', webhook, (req, res) => {
  const vr = new twilio.twiml.VoiceResponse();
  vr.say('This call may be recorded for quality. Please hold while we connect you.');
  vr.dial({ answerOnBridge: true, timeout: 20 }).number(process.env.BUSINESS_TARGET_E164 || '+14319900222');
  res.type('text/xml').send(vr.toString());
});

app.post('/voice/status', webhook, (req, res) => {
  // upsert by CallSid with minimal work; no heavy I/O in request path
  res.sendStatus(200);
});

// 6) SPA fallback only if artifacts exist (prevents bad states)
const hasArtifacts =
  fs.existsSync(path.join(PUB, 'download', 'release.tar.gz')) &&
  fs.existsSync(path.join(PUB, 'download', 'release.tar.gz.sha256'));

app.get('*', (_req, res) => {
  if (!hasArtifacts) return res.status(503).send('Artifacts missing');
  res.sendFile(path.join(DIST, 'index.html'));
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, '0.0.0.0', () => console.log(`TradeLine 24/7 server listening on ${PORT}`));

export default app;