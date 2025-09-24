import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useSecureAnalytics } from './useSecureAnalytics';

interface ABTestVariant {
  [key: string]: any;
}

export const useSecureABTest = (testName: string) => {
  const [variant, setVariant] = useState<string>('A');
  const [variantData, setVariantData] = useState<ABTestVariant>({});
  const [loading, setLoading] = useState(true);
  const { getSessionId } = useSecureAnalytics();

  // Get user's assigned variant from secure server-side assignment
  const getSecureVariant = useCallback(async () => {
    try {
      const sessionId = getSessionId();
      
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
  }, [testName, getSessionId]);

  // Load test configuration and user assignment
  useEffect(() => {
    const loadSecureTest = async () => {
      setLoading(true);
      try {
        // Get assigned variant from secure endpoint
        const assignedVariant = await getSecureVariant();
        setVariant(assignedVariant);

        // Get test configuration for variant data (client-side, read-only)
        const { data: testConfig } = await supabase
          .from('ab_tests')
          .select('variants')
          .eq('test_name', testName)
          .eq('active', true)
          .maybeSingle();

        if (testConfig && testConfig.variants[assignedVariant]) {
          setVariantData(testConfig.variants[assignedVariant]);
        } else {
          // Fallback variant data
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