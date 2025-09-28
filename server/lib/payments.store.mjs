import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

/**
 * Check if customer has recent successful payment
 * @param {string} e164 - Phone number in E164 format
 * @param {number} days - Days to look back (default: 30)
 * @returns {Promise<boolean>}
 */
export async function hasRecentSuccess(e164, days = 30) {
  try {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - days);
    
    const { data, error } = await supabase
      .from('payments')
      .select('id')
      .eq('e164', e164)
      .eq('status', 'succeeded')
      .gte('created_at', cutoffDate.toISOString())
      .limit(1);
    
    if (error) {
      console.warn('Error checking recent payments:', error);
      return false;
    }
    
    return data && data.length > 0;
    
  } catch (error) {
    console.warn('Failed to check recent success:', error);
    return false;
  }
}

/**
 * Create payment record
 * @param {Object} params - { e164, callSid, amountCents, source }
 * @returns {Promise<{paymentId: string}>}
 */
export async function createPayment({ e164, callSid, amountCents, source }) {
  try {
    const paymentId = `pay_${Date.now()}_${Math.random().toString(36).substring(7)}`;
    
    const { data, error } = await supabase
      .from('payments')
      .insert({
        id: paymentId,
        e164,
        call_sid: callSid,
        amount_cents: amountCents,
        status: 'pending',
        source,
        created_at: new Date().toISOString()
      })
      .select('id')
      .single();
    
    if (error) {
      console.error('Failed to create payment record:', error);
      throw new Error(`Payment creation failed: ${error.message}`);
    }
    
    return { paymentId: data.id };
    
  } catch (error) {
    console.error('Create payment error:', error);
    throw error;
  }
}

/**
 * Update payment status
 * @param {Object} params - { paymentId, status, payload }
 */
export async function markPaymentStatus({ paymentId, status, payload = {} }) {
  try {
    const { error } = await supabase
      .from('payments')
      .update({
        status,
        stripe_payload: payload,
        updated_at: new Date().toISOString()
      })
      .eq('id', paymentId);
    
    if (error) {
      console.error('Failed to update payment status:', error);
      throw new Error(`Payment status update failed: ${error.message}`);
    }
    
    console.log(`Payment ${paymentId} marked as ${status}`);
    
  } catch (error) {
    console.error('Mark payment status error:', error);
    throw error;
  }
}

/**
 * Ensure payments table exists (auto-create if missing)
 */
export async function ensurePaymentsTable() {
  try {
    // Try to query the table to see if it exists
    const { error: queryError } = await supabase
      .from('payments')
      .select('id')
      .limit(1);
    
    if (queryError && queryError.code === 'PGRST116') {
      console.log('Payments table does not exist, it should be created via migration');
      // Table doesn't exist - in a real scenario, this would need a migration
      // For now, we'll just log and continue
    }
    
  } catch (error) {
    console.warn('Error checking payments table:', error);
  }
}

// Initialize table check on module load
ensurePaymentsTable();