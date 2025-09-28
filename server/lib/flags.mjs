/**
 * Runtime feature flags - control enhancements without redeploy
 */

export const FLAGS = {
  ENHANCEMENTS_ENABLED: (process.env.ENHANCEMENTS_ENABLED ?? 'true') === 'true',
  DEPOSIT_CTA_ENABLED: (process.env.DEPOSIT_CTA_ENABLED ?? 'true') === 'true'
};