/**
 * Unified operations wiring for TradeLine 24/7
 * Wires enhancements, status, alerts, and CTA pages
 */

import { alertTestHandler } from '../routes/webhooks.alert.test.mjs';
import { ctaCallbackPageHandler, ctaDepositSuccessPageHandler } from '../routes/cta.pages.mjs';
import { securityMonitorHandler } from '../routes/internal.security.monitor.mjs';

/**
 * Wire all operational routes to Express app
 * @param {Express} app - Express application instance
 */
export async function wireOps(app) {
  try {
    // Wire enhancement routes (CTAs, payments, webhooks, digest)
    const { wireEnhancements } = await import('./enhancements.wire.mjs');
    wireEnhancements(app);
    
    // Wire status routes (health checks, version)
    const { wireStatus } = await import('./status.wire.mjs');
    wireStatus(app);
    
    // Alert test endpoint
    app.post('/internal/alert/test', alertTestHandler);
    
    // Security monitoring endpoint
    app.post('/internal/security/monitor', securityMonitorHandler);
    
    // CTA landing pages with GA4 tracking
    app.get('/cta/callback', ctaCallbackPageHandler);
    app.get('/cta/deposit/success', ctaDepositSuccessPageHandler);
    
    console.log('✅ All operational routes wired successfully');
    
  } catch (error) {
    console.error('❌ Failed to wire operational routes:', error);
    throw error;
  }
}