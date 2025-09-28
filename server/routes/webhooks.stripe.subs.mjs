import express from 'express';
import Stripe from 'stripe';
import { updateSubscription } from '../lib/billing.store.mjs';

const router = express.Router();
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

router.post('/webhooks/stripe/subs', express.raw({ type: 'application/json' }), async (req, res) => {
  try {
    const sig = req.headers['stripe-signature'];
    let event;

    // Verify webhook signature
    try {
      event = stripe.webhooks.constructEvent(req.body, sig, webhookSecret);
    } catch (err) {
      console.error('Webhook signature verification failed:', err.message);
      return res.status(400).send(`Webhook Error: ${err.message}`);
    }

    // Handle subscription events
    if (event.type.startsWith('customer.subscription.')) {
      const subscription = event.data.object;
      
      // Map Stripe subscription to our format
      const subscriptionData = {
        stripe_customer_id: subscription.customer,
        plan: mapStripePriceIdToPlan(subscription.items.data[0]?.price?.id),
        status: subscription.status,
        current_period_end: subscription.current_period_end,
        stripe_subscription_id: subscription.id
      };

      await updateSubscription(subscriptionData);
      
      console.log(`Subscription ${event.type} processed for customer ${subscription.customer}`);
    }

    res.status(200).json({ received: true });

  } catch (error) {
    console.error('Webhook processing error:', error);
    res.status(500).json({ error: 'Webhook processing failed' });
  }
});

/**
 * Map Stripe price ID to our plan names
 * @param {string} priceId - Stripe price ID
 * @returns {string} - Plan name
 */
function mapStripePriceIdToPlan(priceId) {
  const priceMapping = {
    [process.env.STRIPE_PRICE_BASIC]: 'basic',
    [process.env.STRIPE_PRICE_PRO]: 'pro',
    [process.env.STRIPE_PRICE_ENT]: 'enterprise'
  };
  
  return priceMapping[priceId] || 'basic';
}

export default router;