/**
 * Feature Flags Configuration
 * 
 * Centralized feature toggles to safely disable/enable features
 * without code removal or database changes.
 */

export const featureFlags = {
  // A/B Testing System - DISABLED to prevent DB errors
  // Set to false to short-circuit all A/B test logic
  AB_ENABLED: false,
  
  // Header Mode Toggle - legacy = old working header, new = HeaderV2
  // Set to 'legacy' to use the previously working header
  // Set to 'new' to use the new HeaderV2 implementation
  HEADER_MODE: 'legacy' as 'legacy' | 'new',
  
  // Add other feature flags here as needed
  ANALYTICS_ENABLED: true,
  ERROR_BOUNDARY_ENABLED: true,
  SMOKE_CHECKS_ENABLED: process.env.NODE_ENV === 'development',
} as const;

export type FeatureFlag = keyof typeof featureFlags;
