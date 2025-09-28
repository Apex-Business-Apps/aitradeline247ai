import express from 'express';
import Stripe from 'stripe';

const router = express.Router();
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

router.post('/api/billing/portal', async (req, res) => {
  try {
    const { stripe_customer_id } = req.body;

    if (!stripe_customer_id) {
      return res.status(400).json({ error: 'Missing stripe_customer_id' });
    }

    // Create billing portal session
    const session = await stripe.billingPortal.sessions.create({
      customer: stripe_customer_id,
      return_url: `${process.env.BASE_URL}/settings`
    });

    res.json({ url: session.url });

  } catch (error) {
    console.error('Billing portal error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;