import Stripe from 'stripe';
import { createClient } from '@supabase/supabase-js';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET;

const SUPABASE_URL = process.env.SUPABASE_URL || 'https://hysvqdwmhxnblxfqnszn.supabase.co';
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

/**
 * Stripe Subscriptions Webhook Handler
 * POST /webhooks/stripe/subs
 * Handles subscription created/updated/deleted events
 */
export function wireStripeSubsWebhook(app) {
  app.post('/webhooks/stripe/subs', async (req, res) => {
    const sig = req.headers['stripe-signature'];
    let event;

    try {
      // Verify webhook signature using RAW body
      event = stripe.webhooks.constructEvent(req.body, sig, endpointSecret);
    } catch (err) {
      console.log('Webhook signature verification failed:', err.message);
      return res.status(400).send(`Webhook Error: ${err.message}`);
    }

    try {
      // Handle the event
      switch (event.type) {
        case 'customer.subscription.created':
          await handleSubscriptionCreated(event.data.object);
          break;
          
        case 'customer.subscription.updated':
          await handleSubscriptionUpdated(event.data.object);
          break;
          
        case 'customer.subscription.deleted':
          await handleSubscriptionDeleted(event.data.object);
          break;
          
        default:
          console.log(`Unhandled event type ${event.type}`);
      }

      res.json({ received: true });
    } catch (error) {
      console.error('Webhook handler error:', error);
      res.status(500).json({ error: 'Webhook processing failed' });
    }
  });

  console.log('✅ Stripe subscriptions webhook wired at /webhooks/stripe/subs');
}

async function handleSubscriptionCreated(subscription) {
  try {
    const { error } = await supabase
      .from('subscriptions')
      .insert({
        stripe_subscription_id: subscription.id,
        stripe_customer_id: subscription.customer,
        status: subscription.status,
        plan: subscription.items.data[0]?.price?.nickname || 'unknown',
        current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
        // org_id should be set based on customer metadata or lookup
      });

    if (error) {
      console.error('Failed to create subscription record:', error);
    } else {
      console.log('Subscription created:', subscription.id);
    }
  } catch (err) {
    console.error('Error handling subscription created:', err);
  }
}

async function handleSubscriptionUpdated(subscription) {
  try {
    const { error } = await supabase
      .from('subscriptions')
      .update({
        status: subscription.status,
        plan: subscription.items.data[0]?.price?.nickname || 'unknown',
        current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
      })
      .eq('stripe_subscription_id', subscription.id);

    if (error) {
      console.error('Failed to update subscription record:', error);
    } else {
      console.log('Subscription updated:', subscription.id);
    }
  } catch (err) {
    console.error('Error handling subscription updated:', err);
  }
}

async function handleSubscriptionDeleted(subscription) {
  try {
    const { error } = await supabase
      .from('subscriptions')
      .update({ status: 'canceled' })
      .eq('stripe_subscription_id', subscription.id);

    if (error) {
      console.error('Failed to cancel subscription record:', error);
    } else {
      console.log('Subscription canceled:', subscription.id);
    }
  } catch (err) {
    console.error('Error handling subscription deleted:', err);
  }
}