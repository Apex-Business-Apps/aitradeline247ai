import Stripe from 'stripe';
import { createPayment } from '../lib/payments.store.mjs';

const STRIPE_SECRET_KEY = process.env.STRIPE_SECRET_KEY;
const PAY_DEPOSIT_AMOUNT_CAD = parseInt(process.env.PAY_DEPOSIT_AMOUNT_CAD || '25');
const BASE_URL = process.env.BASE_URL;

let stripe = null;

if (STRIPE_SECRET_KEY) {
  stripe = new Stripe(STRIPE_SECRET_KEY);
}

/**
 * Create Stripe checkout session for booking deposit
 * POST /api/payments/create-checkout
 * Body: { callSid, e164 }
 */
export async function paymentsCreateCheckoutHandler(req, res) {
  try {
    // Check if Stripe is configured
    if (!stripe || !STRIPE_SECRET_KEY) {
      return res.json({
        ok: false,
        disabled: true,
        message: 'Stripe not configured'
      });
    }
    
    const { callSid, e164 } = req.body;
    
    if (!callSid || !e164) {
      return res.status(400).json({
        error: 'Missing required fields: callSid, e164'
      });
    }
    
    const amountCents = PAY_DEPOSIT_AMOUNT_CAD * 100; // Convert CAD to cents
    
    try {
      // Create payment record first
      const { paymentId } = await createPayment({
        e164,
        callSid,
        amountCents,
        source: 'email'
      });
      
      // Create Stripe checkout session
      const session = await stripe.checkout.sessions.create({
        payment_method_types: ['card'],
        line_items: [
          {
            price_data: {
              currency: 'cad',
              product_data: {
                name: 'TradeLine 24/7 Booking Deposit',
                description: `Secure your booking deposit for call ${callSid}`
              },
              unit_amount: amountCents
            },
            quantity: 1
          }
        ],
        mode: 'payment',
        success_url: `${BASE_URL}/booking/success?session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${BASE_URL}/booking/cancelled`,
        metadata: {
          callSid,
          e164,
          paymentId,
          source: 'email'
        },
        customer_email: null, // Don't require email
        billing_address_collection: 'auto',
        phone_number_collection: {
          enabled: true
        }
      });
      
      console.log(`Checkout session created: ${session.id} for ${callSid}`);
      
      return res.json({
        ok: true,
        url: session.url,
        paymentId,
        sessionId: session.id
      });
      
    } catch (stripeError) {
      console.error('Stripe checkout creation failed:', stripeError);
      return res.status(500).json({
        error: 'Failed to create checkout session',
        details: stripeError.message
      });
    }
    
  } catch (error) {
    console.error('Create checkout error:', error);
    return res.status(500).json({
      error: 'Internal server error',
      message: error.message
    });
  }
}