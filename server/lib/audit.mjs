import { supabase } from './supabaseClient.mjs';

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
      .from('analytics_events')
      .insert({
        event_type: `audit.${action}`,
        event_data: {
          action,
          org_id,
          target,
          ...payload
        },
        user_id,
        severity: 'info'
      });

    if (error) {
      console.error('Audit log failed:', error);
    }
  } catch (err) {
    console.error('Audit log error:', err);
  }
}