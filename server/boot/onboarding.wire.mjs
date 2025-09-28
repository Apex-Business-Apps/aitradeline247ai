import express from 'express';
import billingCheckout from '../routes/billing.checkout.mjs';
import billingPortal from '../routes/billing.portal.mjs';
import webhooksStripeSubs from '../routes/webhooks.stripe.subs.mjs';
import settingsApi from '../routes/settings.api.mjs';
import settingsTestCall from '../routes/settings.testcall.mjs';

export function wireOnboarding(app) {
  // Enable JSON and URL-encoded body parsing
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  // Mount billing routes
  app.use(billingCheckout);
  app.use(billingPortal);
  
  // Mount webhook routes (raw body for Stripe webhook verification)
  app.use(webhooksStripeSubs);
  
  // Mount settings routes
  app.use(settingsApi);
  app.use(settingsTestCall);
  
  console.log('Onboarding routes wired successfully');
}