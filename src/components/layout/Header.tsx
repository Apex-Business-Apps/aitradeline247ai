import React from 'react';
import { featureFlags } from '@/config/featureFlags';
import { HeaderLegacy } from './HeaderLegacy';
import { HeaderV2 } from './HeaderV2';
/**
 * Header Component - Feature Flag Router
 * 
 * Routes to either HeaderLegacy (safe fallback) or HeaderV2 (new implementation)
 * based on featureFlags.HEADER_MODE setting.
 * 
 * To switch headers, modify src/config/featureFlags.ts:
 * - HEADER_MODE: 'legacy' = Use HeaderLegacy (previous working version)
 * - HEADER_MODE: 'new' = Use HeaderV2 (new specification)
 */
export const Header: React.FC = () => {
  // Route to appropriate header based on feature flag
  if (featureFlags.HEADER_MODE === 'new') {
    return <HeaderV2 />;
  }
  
  // Default to legacy (safe) header
  return <HeaderLegacy />;
};