// Example usage: import { wireOutreach } from './server/boot/outreach.wire.mjs'; wireOutreach(app);

import cors from 'cors';
import rateLimit from 'express-rate-limit';
import { setupMessagingWebhook } from '../routes/webhooks.messaging.mjs';
import { setupVoiceStatusPatch } from '../routes/voice.status.patch.mjs';
import { setupInternalOutreachRun } from '../routes/internal.outreach.run.mjs';
import { setupAdminAPI } from '../routes/api.outreach.admin.mjs';

export function wireOutreach(app) {
  // JSON body parsing for webhooks and API
  app.use('/webhooks', express.json());
  app.use('/api/outreach', express.json());
  app.use('/internal/outreach', express.json());

  // CORS for API endpoints
  app.use('/api/outreach', cors({
    origin: true,
    credentials: true
  }));

  // Rate limiting for webhooks and internal endpoints
  const webhookRateLimit = rateLimit({
    windowMs: 60 * 1000, // 1 minute
    max: 60, // 60 requests per minute
    message: 'Too many webhook requests'
  });

  const internalRateLimit = rateLimit({
    windowMs: 60 * 1000, // 1 minute
    max: 10, // 10 requests per minute
    message: 'Too many internal requests'
  });

  // Apply rate limits
  app.use('/webhooks/messaging/twilio', webhookRateLimit);
  app.use('/internal/outreach/run', internalRateLimit);

  // Mount routes
  setupMessagingWebhook(app);
  setupInternalOutreachRun(app);
  setupAdminAPI(app);
  
  // Note: Voice status patch should be handled separately in main server
  // since it needs to integrate with existing voice handler
}