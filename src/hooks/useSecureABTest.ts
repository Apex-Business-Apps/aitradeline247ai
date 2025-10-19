import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useSecureAnalytics } from './useSecureAnalytics';
import { featureFlags } from '@/config/featureFlags';

interface ABTestVariant {
  [key: string]: any;
}

// Generate secure session ID for A/B testing
const getOrCreateSessionId = (): string => {
  const sessionKey = 'ab_test_session_id';
  let sessionId = sessionStorage.getItem(sessionKey);
  
  if (!sessionId) {
    sessionId = crypto.randomUUID();
    sessionStorage.setItem(sessionKey, sessionId);
    
    // Register session server-side for validation (async, non-blocking)
    fetch('https://hysvqdwmhxnblxfqnszn.supabase.co/functions/v1/register-ab-session', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        sessionId,
        userAgent: navigator.userAgent 
      })
    }).catch(() => {
      // Fail silently - session registration is best-effort
      console.debug('Session registration deferred');
    });
  }
  
  return sessionId;
};

export const useSecureABTest = (testName: string) => {
  const [variant, setVariant] = useState<string>('A');
  const [variantData, setVariantData] = useState<ABTestVariant>({ text: 'Grow Now', color: 'primary' });
  const [loading, setLoading] = useState(false);
  const analytics = useSecureAnalytics();

  // Get user's assigned variant from secure server-side assignment
  const getSecureVariant = useCallback(async () => {
    // Feature flag: short-circuit A/B testing when disabled
    if (!featureFlags.AB_ENABLED) {
      setVariant('A');
      setVariantData({ text: 'Grow Now', color: 'primary' });
      setLoading(false);
      return;
    }

    try {
      const sessionId = getOrCreateSessionId();

      // Call secure assignment endpoint
      const { data, error } = await supabase.functions.invoke('secure-ab-assign', {
        body: { 
          testName,
          anonId: sessionId
        }
      });

      if (error) {
        console.error('Error getting secure A/B assignment:', error);
        return { variant: 'A', variantData: { text: 'Grow Now', color: 'primary' } };
      }

      return data || { variant: 'A', variantData: { text: 'Grow Now', color: 'primary' } };

    } catch (error) {
      console.error('Error in secure A/B test assignment:', error);
      return { variant: 'A', variantData: { text: 'Grow Now', color: 'primary' } };
    }
  }, [testName]);

  // Load test configuration and user assignment
  useEffect(() => {
    const loadSecureTest = async () => {
      setLoading(true);
      try {
        // Get assigned variant and safe display data from secure endpoint
        const result = await getSecureVariant();
        
        if (typeof result === 'object' && result.variant) {
          setVariant(result.variant);
          // Use the variantData returned from the secure endpoint (no direct table access)
          setVariantData(result.variantData || { text: 'Grow Now', color: 'primary' });
        } else {
          // Fallback for string response (backward compatibility)
          setVariant(result as string);
          setVariantData({ text: 'Grow Now', color: 'primary' });
        }
      } catch (error) {
        console.error('Error loading secure A/B test:', error);
        // Set fallback values
        setVariant('A');
        setVariantData({ text: 'Grow Now', color: 'primary' });
      } finally {
        setLoading(false);
      }
    };

    loadSecureTest();
  }, [testName, getSecureVariant]);

  // Track conversion (e.g., form submission, purchase)
  const convert = useCallback(async (conversionValue?: number) => {
    // Feature flag: no-op when A/B testing is disabled
    if (!featureFlags.AB_ENABLED) {
      return;
    }

    try {
      const { error } = await supabase.functions.invoke('ab-convert', {
        body: {
          testName,
          conversionValue
        }
      });

      if (error) {
        console.error('Secure conversion error:', error);
      } else {
        // Track conversion via privacy-first analytics
        analytics.trackConversion('ab_test_conversion', conversionValue, {
          test_name: testName,
          variant,
          privacy_protected: true
        });
      }
    } catch (error) {
      console.error('Error tracking secure A/B test conversion:', error);
    }
  }, [testName, variant]);

  return {
    variant,
    variantData,
    loading,
    convert
  };
};
