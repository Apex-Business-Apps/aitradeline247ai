import express from 'express';
import rateLimit from 'express-rate-limit';
import { emailCtaCallbackHandler } from '../routes/email.cta.callback.mjs';
import { emailCtaResolveHandler } from '../routes/email.cta.resolve.mjs';
import { voiceCallbackConnectHandler } from '../routes/voice.callback.connect.mjs';
import { paymentsCreateCheckoutHandler } from '../routes/payments.create_checkout.mjs';
import { webhooksStripeHandler } from '../routes/webhooks.stripe.mjs';
import { internalDigestRunHandler } from '../routes/internal.digest.run.mjs';

// Light rate limiting for enhancement endpoints
const enhancementRateLimit = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 60, // 60 requests per minute
  message: { error: 'Too many requests, please try again later' },
  standardHeaders: true,
  legacyHeaders: false
});

/**
 * Wire up all enhancement routes to Express app
 * @param {Express} app - Express application instance
 */
export function wireEnhancements(app) {
  // Apply JSON and URL-encoded body parsing for API routes
  app.use('/api', express.json());
  app.use('/api', express.urlencoded({ extended: false }));
  
  // Apply rate limiting to enhancement endpoints
  app.use('/a/*', enhancementRateLimit);
  app.use('/api/payments/*', enhancementRateLimit);
  app.use('/webhooks/stripe', enhancementRateLimit);
  app.use('/internal/digest/run', enhancementRateLimit);
  
  // Email CTA routes
  app.get('/a/c', emailCtaCallbackHandler);
  app.get('/a/r', emailCtaResolveHandler);
  
  // Voice callback route
  app.get('/voice/callback/connect', voiceCallbackConnectHandler);
  app.post('/voice/callback/connect', voiceCallbackConnectHandler);
  
  // Payments routes
  app.post('/api/payments/create-checkout', paymentsCreateCheckoutHandler);
  
  // Stripe webhook (raw body needed for signature verification)
  app.post('/webhooks/stripe', express.raw({ type: 'application/json' }), webhooksStripeHandler);
  
  // Internal operations
  app.post('/internal/digest/run', internalDigestRunHandler);
  
  console.log('✅ Enhancement routes wired successfully');
}