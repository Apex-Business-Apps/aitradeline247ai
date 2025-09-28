import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.SUPABASE_URL || 'https://hysvqdwmhxnblxfqnszn.supabase.co';
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

/**
 * Log audit events to the database
 * @param {Object} params - Audit parameters
 * @param {string} params.action - Action type (e.g., 'settings.update', 'cta.callback') 
 * @param {string} params.org_id - Organization ID
 * @param {string} params.user_id - User ID who performed the action
 * @param {string} params.target - Target resource/entity
 * @param {Object} params.payload - Additional data about the action
 */
export async function audit({ action, org_id, user_id, target, payload = {} }) {
  try {
    const { error } = await supabase
      .from('audit_logs')
      .insert({
        action,
        org_id,
        user_id,
        target,
        payload,
        ts: new Date().toISOString()
      });

    if (error) {
      console.error('Audit log failed:', error);
    }
  } catch (err) {
    console.error('Audit log error:', err);
  }
}