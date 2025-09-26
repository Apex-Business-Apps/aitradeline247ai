import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useSecureAnalytics } from './useSecureAnalytics';

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
  }
  
  return sessionId;
};

export const useSecureABTest = (testName: string) => {
  const [variant, setVariant] = useState<string>('A');
  const [variantData, setVariantData] = useState<ABTestVariant>({});
  const [loading, setLoading] = useState(true);
  const analytics = useSecureAnalytics();

  // Get user's assigned variant from secure server-side assignment
  const getSecureVariant = useCallback(async () => {
    try {
      const sessionId = getOrCreateSessionId();
      
      console.log(`Getting secure A/B test assignment for: ${testName}`);

      // Call secure assignment endpoint
      const { data, error } = await supabase.functions.invoke('secure-ab-assign', {
        body: { 
          testName,
          anonId: sessionId
        }
      });

      if (error) {
        console.error('Error getting secure A/B assignment:', error);
        return 'A'; // Fallback
      }

      console.log(`Secure assignment result:`, data);
      return data?.variant || 'A';

    } catch (error) {
      console.error('Error in secure A/B test assignment:', error);
      return 'A'; // Default fallback
    }
  }, [testName]);

  // Load test configuration and user assignment
  useEffect(() => {
    const loadSecureTest = async () => {
      setLoading(true);
      try {
        // Get assigned variant from secure endpoint
        const assignedVariant = await getSecureVariant();
        setVariant(assignedVariant);

        // Get test configuration for variant data (fallback to local data)
        // TODO: Create ab_tests table when implementing A/B testing functionality
        const testConfig = null;

        if (assignedVariant === 'B') {
          setVariantData({ text: 'Start Now', color: 'secondary' });
        } else {
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

  // Mark conversion through secure endpoint with signed cookies
  const convert = useCallback(async (conversionValue?: number) => {
    try {
      console.log(`Attempting secure conversion for ${testName}, variant ${variant}`);

      const { error } = await supabase.functions.invoke('ab-convert', {
        body: {
          testName,
          conversionValue
        }
      });

      if (error) {
        console.error('Secure conversion error:', error);
      } else {
        console.log(`Secure A/B test conversion tracked for ${testName}, variant ${variant}`);
        
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