import Stripe from 'stripe';
import { markPaymentStatus } from '../lib/payments.store.mjs';

const STRIPE_SECRET_KEY = process.env.STRIPE_SECRET_KEY;
const STRIPE_WEBHOOK_SECRET = process.env.STRIPE_WEBHOOK_SECRET;

let stripe = null;

if (STRIPE_SECRET_KEY) {
  stripe = new Stripe(STRIPE_SECRET_KEY);
}

/**
 * Handle Stripe webhook events
 * POST /webhooks/stripe
 */
export async function webhooksStripeHandler(req, res) {
  try {
    if (!stripe || !STRIPE_WEBHOOK_SECRET) {
      console.warn('Stripe webhook received but not configured');
      return res.status(400).json({ error: 'Stripe not configured' });
    }
    
    const sig = req.headers['stripe-signature'];
    let event;
    
    try {
      // Verify webhook signature
      event = stripe.webhooks.constructEvent(req.body, sig, STRIPE_WEBHOOK_SECRET);
    } catch (err) {
      console.error('Webhook signature verification failed:', err.message);
      return res.status(400).json({ error: 'Invalid signature' });
    }
    
    console.log(`Stripe webhook received: ${event.type}`);
    
    try {
      // Handle different event types
      switch (event.type) {
        case 'checkout.session.completed': {
          const session = event.data.object;
          const { paymentId, callSid, e164 } = session.metadata || {};
          
          if (paymentId) {
            await markPaymentStatus({
              paymentId,
              status: 'succeeded',
              payload: {
                session_id: session.id,
                amount_total: session.amount_total,
                currency: session.currency,
                payment_status: session.payment_status
              }
            });
            
            console.log(`Checkout completed for call ${callSid}: ${paymentId}`);
          }
          break;
        }
        
        case 'payment_intent.succeeded': {
          const paymentIntent = event.data.object;
          const { paymentId, callSid } = paymentIntent.metadata || {};
          
          if (paymentId) {
            await markPaymentStatus({
              paymentId,
              status: 'succeeded',
              payload: {
                payment_intent_id: paymentIntent.id,
                amount_received: paymentIntent.amount_received,
                currency: paymentIntent.currency
              }
            });
            
            console.log(`Payment succeeded for call ${callSid}: ${paymentId}`);
          }
          break;
        }
        
        case 'payment_intent.payment_failed':
        case 'checkout.session.expired': {
          const object = event.data.object;
          const { paymentId, callSid } = object.metadata || {};
          
          if (paymentId) {
            await markPaymentStatus({
              paymentId,
              status: 'failed',
              payload: {
                failure_reason: object.last_payment_error?.message || 'Payment failed',
                event_type: event.type
              }
            });
            
            console.log(`Payment failed for call ${callSid}: ${paymentId}`);
          }
          break;
        }
        
        default:
          console.log(`Unhandled webhook event type: ${event.type}`);
      }
      
    } catch (processingError) {
      console.error('Error processing webhook event:', processingError);
      // Still return 200 to acknowledge receipt
    }
    
    // Always return 200 to acknowledge receipt
    return res.json({ received: true });
    
  } catch (error) {
    console.error('Stripe webhook error:', error);
    return res.status(500).json({
      error: 'Webhook processing failed',
      message: error.message
    });
  }
}