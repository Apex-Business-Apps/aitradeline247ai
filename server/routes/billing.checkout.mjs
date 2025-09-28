import express from 'express';
import Stripe from 'stripe';
import { ensureOrg, linkCustomer } from '../lib/billing.store.mjs';
import { isNANP } from '../lib/e164.mjs';

const router = express.Router();
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

// Validate required environment variables
const REQUIRED_ENVS = [
  'STRIPE_SECRET_KEY',
  'STRIPE_PRICE_BASIC',
  'STRIPE_PRICE_PRO', 
  'STRIPE_PRICE_ENT',
  'BASE_URL'
];

for (const env of REQUIRED_ENVS) {
  if (!process.env[env]) {
    throw new Error(`Missing required environment variable: ${env}`);
  }
}

const PLAN_PRICES = {
  basic: process.env.STRIPE_PRICE_BASIC,
  pro: process.env.STRIPE_PRICE_PRO,
  enterprise: process.env.STRIPE_PRICE_ENT
};

router.post('/api/billing/checkout', async (req, res) => {
  try {
    const { name, email_to, target_e164, plan } = req.body;

    // Validate inputs
    if (!name || !email_to || !target_e164 || !plan) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    if (!['basic', 'pro', 'enterprise'].includes(plan)) {
      return res.status(400).json({ error: 'Invalid plan' });
    }

    // Validate E.164 format for NANP
    if (!isNANP(target_e164)) {
      return res.status(400).json({ 
        error: 'Invalid phone number. Please use US/Canada format: +1XXXXXXXXXX' 
      });
    }

    // Ensure organization exists
    const { org } = await ensureOrg({ name, email_to, target_e164 });

    // Create Stripe customer
    const customer = await stripe.customers.create({
      email: email_to,
      name: name,
      metadata: {
        org_id: org.id
      }
    });

    // Create Checkout Session
    const session = await stripe.checkout.sessions.create({
      mode: 'subscription',
      customer: customer.id,
      line_items: [{
        price: PLAN_PRICES[plan],
        quantity: 1
      }],
      success_url: `${process.env.BASE_URL}/settings?success=1`,
      cancel_url: `${process.env.BASE_URL}/pricing?canceled=1`,
      metadata: {
        org_id: org.id,
        plan: plan
      }
    });

    // Link customer to org
    await linkCustomer({
      org_id: org.id,
      stripe_customer_id: customer.id
    });

    res.json({ url: session.url });

  } catch (error) {
    console.error('Checkout error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;