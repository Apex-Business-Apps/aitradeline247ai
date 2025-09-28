import express from 'express';
import rateLimit from 'express-rate-limit';
import { statusHandler, versionHandler } from '../routes/status.version.mjs';

// Light rate limiting for status endpoints
const statusRateLimit = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 60, // 60 requests per minute
  message: { error: 'Too many requests, please try again later' },
  standardHeaders: true,
  legacyHeaders: false
});

/**
 * Wire up status and version routes to Express app
 * @param {Express} app - Express application instance
 */
export function wireStatus(app) {
  // Apply rate limiting to status endpoints
  app.use('/status.json', statusRateLimit);
  app.use('/version', statusRateLimit);
  
  // Mount status routes
  app.get('/status.json', statusHandler);
  app.get('/version', versionHandler);
  
  console.log('✅ Status routes wired successfully');
}