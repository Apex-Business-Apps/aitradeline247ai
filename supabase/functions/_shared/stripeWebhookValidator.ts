/**
 * Stripe Webhook Signature Validation
 * Verifies webhook events are from Stripe to prevent replay attacks
 */

import Stripe from "https://esm.sh/stripe@14.21.0";

export interface WebhookValidationResult {
  valid: boolean;
  event?: Stripe.Event;
  error?: string;
}

/**
 * Verify Stripe webhook signature
 * @param payload Raw request body
 * @param signature Stripe-Signature header value
 * @param secret Webhook signing secret
 * @returns Validation result with parsed event or error
 */
export function verifyStripeWebhook(
  payload: string,
  signature: string,
  secret: string
): WebhookValidationResult {
  if (!signature) {
    return {
      valid: false,
      error: "Missing Stripe-Signature header"
    };
  }

  if (!secret) {
    return {
      valid: false,
      error: "Webhook secret not configured"
    };
  }

  try {
    const stripe = new Stripe(secret, {
      apiVersion: "2024-11-20.acacia",
      httpClient: Stripe.createFetchHttpClient()
    });

    // Stripe.constructEvent throws if signature is invalid
    const event = stripe.webhooks.constructEvent(
      payload,
      signature,
      secret
    );

    return {
      valid: true,
      event
    };
  } catch (err: any) {
    console.error("Webhook signature verification failed:", err.message);
    return {
      valid: false,
      error: err.message || "Signature verification failed"
    };
  }
}

/**
 * Extract Stripe signature from headers
 */
export function getStripeSignature(req: Request): string | null {
  return req.headers.get("stripe-signature") || 
         req.headers.get("Stripe-Signature") || 
         null;
}
