/**
 * Stripe Webhook Handler
 * POST /stripe-webhook
 * 
 * Receives and processes Stripe webhook events with:
 * - Signature verification
 * - Idempotent event storage
 * - Fast ACK (< 200ms)
 * - Background processing
 */

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";
import { corsHeaders } from "../_shared/cors.ts";
import { verifyStripeWebhook, getStripeSignature } from "../_shared/stripeWebhookValidator.ts";
import { createRequestContext, logWithContext } from "../_shared/requestId.ts";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const STRIPE_WEBHOOK_SECRET = Deno.env.get("STRIPE_WEBHOOK_SECRET")!;

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const ctx = createRequestContext(req);
  logWithContext(ctx, "info", "Stripe webhook received");

  try {
    // Only accept POST
    if (req.method !== "POST") {
      return new Response(JSON.stringify({ error: "Method not allowed" }), {
        status: 405,
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      });
    }

    // Get raw body and signature
    const payload = await req.text();
    const signature = getStripeSignature(req);

    if (!signature) {
      logWithContext(ctx, "warn", "Missing Stripe signature");
      return new Response(JSON.stringify({ error: "Missing signature" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      });
    }

    // Verify webhook signature
    const validation = verifyStripeWebhook(payload, signature, STRIPE_WEBHOOK_SECRET);
    
    if (!validation.valid) {
      logWithContext(ctx, "error", "Invalid webhook signature", { error: validation.error });
      return new Response(JSON.stringify({ error: "Invalid signature" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      });
    }

    const event = validation.event!;
    logWithContext(ctx, "info", "Webhook verified", { 
      eventId: event.id, 
      eventType: event.type 
    });

    // Create Supabase client
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    // Idempotent insert: store event (will fail silently if duplicate)
    const { data: existingEvent, error: checkError } = await supabase
      .from("billing_events")
      .select("id, processing_status")
      .eq("event_id", event.id)
      .single();

    if (existingEvent) {
      logWithContext(ctx, "info", "Duplicate event, already processed", {
        eventId: event.id,
        status: existingEvent.processing_status
      });
      
      // Still return 200 (idempotent)
      return new Response(JSON.stringify({ 
        received: true, 
        duplicate: true,
        eventId: event.id 
      }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      });
    }

    // Store new event
    const { error: insertError } = await supabase
      .from("billing_events")
      .insert({
        event_id: event.id,
        event_type: event.type,
        payload: event as any,
        processing_status: "pending",
        received_at: new Date().toISOString()
      });

    if (insertError) {
      // Check if it's a uniqueness violation (race condition)
      if (insertError.code === "23505") {
        logWithContext(ctx, "info", "Race condition: event already inserted", { eventId: event.id });
        return new Response(JSON.stringify({ 
          received: true, 
          duplicate: true,
          eventId: event.id 
        }), {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" }
        });
      }

      logWithContext(ctx, "error", "Failed to store event", { error: insertError });
      throw insertError;
    }

    logWithContext(ctx, "info", "Event stored successfully", { eventId: event.id });

    // Queue background processing (async, don't await)
    processEventBackground(event.id, event.type).catch((err) => {
      console.error(`Background processing failed for ${event.id}:`, err);
    });

    // Fast ACK to Stripe
    return new Response(JSON.stringify({ 
      received: true,
      eventId: event.id 
    }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" }
    });

  } catch (error: any) {
    logWithContext(ctx, "error", "Webhook processing failed", { 
      message: error.message,
      stack: error.stack 
    });

    return new Response(JSON.stringify({ 
      error: "Internal server error",
      requestId: ctx.requestId 
    }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" }
    });
  }
});

/**
 * Background event processing
 * Updates billing_events status and processes based on event type
 */
async function processEventBackground(eventId: string, eventType: string): Promise<void> {
  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

  try {
    // Mark as processing
    await supabase
      .from("billing_events")
      .update({ 
        processing_status: "processing",
        last_processed_at: new Date().toISOString()
      })
      .eq("event_id", eventId);

    console.log(`Processing event ${eventId} (${eventType})`);

    // Get full event data
    const { data: eventRecord } = await supabase
      .from("billing_events")
      .select("payload")
      .eq("event_id", eventId)
      .single();

    if (!eventRecord) {
      throw new Error("Event record not found");
    }

    const event = eventRecord.payload as any;

    // Process based on event type
    switch (eventType) {
      case "invoice.payment_succeeded":
        await handleInvoicePaymentSucceeded(supabase, event);
        break;
      
      case "invoice.payment_failed":
        await handleInvoicePaymentFailed(supabase, event);
        break;
      
      case "payment_intent.succeeded":
        await handlePaymentIntentSucceeded(supabase, event);
        break;
      
      case "payment_intent.payment_failed":
        await handlePaymentIntentFailed(supabase, event);
        break;
      
      case "customer.subscription.created":
      case "customer.subscription.updated":
      case "customer.subscription.deleted":
        await handleSubscriptionEvent(supabase, event);
        break;

      default:
        console.log(`No handler for event type: ${eventType}`);
    }

    // Mark as processed
    await supabase
      .from("billing_events")
      .update({ 
        processing_status: "processed",
        last_processed_at: new Date().toISOString()
      })
      .eq("event_id", eventId);

    console.log(`Event ${eventId} processed successfully`);

  } catch (error: any) {
    console.error(`Error processing event ${eventId}:`, error);

    // Mark as failed and increment retry count
    await supabase
      .from("billing_events")
      .update({ 
        processing_status: "failed",
        error_message: error.message,
        last_processed_at: new Date().toISOString(),
        retry_count: supabase.raw("retry_count + 1")
      })
      .eq("event_id", eventId);
  }
}

async function handleInvoicePaymentSucceeded(supabase: any, event: any): Promise<void> {
  const invoice = event.data.object;
  
  await supabase
    .from("billing_invoices")
    .upsert({
      stripe_invoice_id: invoice.id,
      stripe_customer_id: invoice.customer,
      amount_due: invoice.amount_due,
      amount_paid: invoice.amount_paid,
      currency: invoice.currency,
      status: invoice.status,
      invoice_pdf: invoice.invoice_pdf,
      hosted_invoice_url: invoice.hosted_invoice_url,
      billing_reason: invoice.billing_reason,
      metadata: invoice.metadata || {}
    }, {
      onConflict: "stripe_invoice_id"
    });

  console.log(`Invoice payment succeeded: ${invoice.id}`);
}

async function handleInvoicePaymentFailed(supabase: any, event: any): Promise<void> {
  const invoice = event.data.object;
  
  await supabase
    .from("billing_invoices")
    .upsert({
      stripe_invoice_id: invoice.id,
      stripe_customer_id: invoice.customer,
      amount_due: invoice.amount_due,
      amount_paid: invoice.amount_paid,
      currency: invoice.currency,
      status: "payment_failed",
      metadata: invoice.metadata || {}
    }, {
      onConflict: "stripe_invoice_id"
    });

  console.log(`Invoice payment failed: ${invoice.id}`);
}

async function handlePaymentIntentSucceeded(supabase: any, event: any): Promise<void> {
  const paymentIntent = event.data.object;
  
  await supabase
    .from("billing_payments")
    .upsert({
      stripe_payment_intent_id: paymentIntent.id,
      stripe_customer_id: paymentIntent.customer,
      amount: paymentIntent.amount,
      currency: paymentIntent.currency,
      status: paymentIntent.status,
      payment_method: paymentIntent.payment_method,
      metadata: paymentIntent.metadata || {}
    }, {
      onConflict: "stripe_payment_intent_id"
    });

  console.log(`Payment intent succeeded: ${paymentIntent.id}`);
}

async function handlePaymentIntentFailed(supabase: any, event: any): Promise<void> {
  const paymentIntent = event.data.object;
  
  await supabase
    .from("billing_payments")
    .upsert({
      stripe_payment_intent_id: paymentIntent.id,
      stripe_customer_id: paymentIntent.customer,
      amount: paymentIntent.amount,
      currency: paymentIntent.currency,
      status: "failed",
      payment_method: paymentIntent.payment_method,
      metadata: paymentIntent.metadata || {}
    }, {
      onConflict: "stripe_payment_intent_id"
    });

  console.log(`Payment intent failed: ${paymentIntent.id}`);
}

async function handleSubscriptionEvent(supabase: any, event: any): Promise<void> {
  // Subscription events can be handled based on your business logic
  console.log(`Subscription event: ${event.type}`, event.data.object.id);
}

