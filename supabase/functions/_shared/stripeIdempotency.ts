/**
 * Stripe Idempotency Helper
 * Ensures Stripe API calls can be safely retried without duplicate charges
 */

import Stripe from "https://esm.sh/stripe@14.21.0";
import { createRequestContext } from "./requestId.ts";

/**
 * Generate idempotency key from request context
 * Format: {requestId}_{operation}
 */
export function generateIdempotencyKey(
  req: Request,
  operation: string
): string {
  const ctx = createRequestContext(req);
  return `${ctx.requestId}_${operation}`;
}

/**
 * Create Stripe client with automatic idempotency
 */
export function createStripeClient(apiKey: string): Stripe {
  return new Stripe(apiKey, {
    apiVersion: "2024-11-20.acacia",
    httpClient: Stripe.createFetchHttpClient(),
    maxNetworkRetries: 2,
    timeout: 30000
  });
}

/**
 * Make idempotent Stripe API call
 * Automatically adds idempotency key to prevent duplicate operations
 */
export async function idempotentStripeCall<T>(
  stripe: Stripe,
  idempotencyKey: string,
  callFn: (options: Stripe.RequestOptions) => Promise<T>
): Promise<T> {
  const options: Stripe.RequestOptions = {
    idempotencyKey,
    timeout: 30000
  };

  console.log(`Stripe API call with idempotency key: ${idempotencyKey}`);
  
  try {
    return await callFn(options);
  } catch (error: any) {
    console.error(`Stripe API error (key: ${idempotencyKey}):`, error.message);
    throw error;
  }
}

/**
 * Create checkout session with idempotency
 */
export async function createCheckoutSessionIdempotent(
  stripe: Stripe,
  idempotencyKey: string,
  params: Stripe.Checkout.SessionCreateParams
): Promise<Stripe.Checkout.Session> {
  return idempotentStripeCall(
    stripe,
    idempotencyKey,
    (options) => stripe.checkout.sessions.create(params, options)
  );
}

/**
 * Create payment intent with idempotency
 */
export async function createPaymentIntentIdempotent(
  stripe: Stripe,
  idempotencyKey: string,
  params: Stripe.PaymentIntentCreateParams
): Promise<Stripe.PaymentIntent> {
  return idempotentStripeCall(
    stripe,
    idempotencyKey,
    (options) => stripe.paymentIntents.create(params, options)
  );
}

/**
 * Create invoice with idempotency
 */
export async function createInvoiceIdempotent(
  stripe: Stripe,
  idempotencyKey: string,
  params: Stripe.InvoiceCreateParams
): Promise<Stripe.Invoice> {
  return idempotentStripeCall(
    stripe,
    idempotencyKey,
    (options) => stripe.invoices.create(params, options)
  );
}

/**
 * Create subscription with idempotency
 */
export async function createSubscriptionIdempotent(
  stripe: Stripe,
  idempotencyKey: string,
  params: Stripe.SubscriptionCreateParams
): Promise<Stripe.Subscription> {
  return idempotentStripeCall(
    stripe,
    idempotencyKey,
    (options) => stripe.subscriptions.create(params, options)
  );
}

