import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

/**
 * Ensure organization exists, create if not
 * @param {Object} params - { name, email_to, target_e164 }
 * @returns {Promise<{org: Object}>}
 */
export async function ensureOrg({ name, email_to, target_e164 }) {
  try {
    const { data, error } = await supabase
      .from('orgs')
      .upsert({
        name,
        email_to: email_to.toLowerCase(),
        target_e164
      }, {
        onConflict: 'email_to',
        ignoreDuplicates: false
      })
      .select()
      .single();

    if (error) {
      console.error('Failed to ensure org:', error);
      throw new Error(`Org creation failed: ${error.message}`);
    }

    return { org: data };
  } catch (error) {
    console.error('Ensure org error:', error);
    throw error;
  }
}

/**
 * Link Stripe customer to organization
 * @param {Object} params - { org_id, stripe_customer_id }
 * @returns {Promise<void>}
 */
export async function linkCustomer({ org_id, stripe_customer_id }) {
  try {
    const { error } = await supabase
      .from('subscriptions')
      .upsert({
        org_id,
        stripe_customer_id,
        plan: 'basic',
        status: 'incomplete'
      }, {
        onConflict: 'org_id',
        ignoreDuplicates: false
      });

    if (error) {
      console.error('Failed to link customer:', error);
      throw new Error(`Customer link failed: ${error.message}`);
    }
  } catch (error) {
    console.error('Link customer error:', error);
    throw error;
  }
}

/**
 * Update subscription details
 * @param {Object} params - { stripe_customer_id, plan, status, current_period_end, stripe_subscription_id }
 * @returns {Promise<void>}
 */
export async function updateSubscription({ 
  stripe_customer_id, 
  plan, 
  status, 
  current_period_end, 
  stripe_subscription_id 
}) {
  try {
    const updates = {
      plan,
      status,
      current_period_end: current_period_end ? new Date(current_period_end * 1000).toISOString() : null,
      stripe_subscription_id
    };

    const { error } = await supabase
      .from('subscriptions')
      .update(updates)
      .eq('stripe_customer_id', stripe_customer_id);

    if (error) {
      console.error('Failed to update subscription:', error);
      throw new Error(`Subscription update failed: ${error.message}`);
    }

    console.log(`Subscription updated for customer ${stripe_customer_id}: ${status}`);
  } catch (error) {
    console.error('Update subscription error:', error);
    throw error;
  }
}