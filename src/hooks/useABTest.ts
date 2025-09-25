import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAnalytics } from './useAnalytics';

interface ABTestVariant {
  [key: string]: any;
}

interface ABTest {
  test_name: string;
  variants: Record<string, ABTestVariant>;
  traffic_split: Record<string, number>;
  active: boolean;
}

export const useABTest = (testName: string) => {
  const [variant, setVariant] = useState<string>('A');
  const [variantData, setVariantData] = useState<ABTestVariant>({});
  const [loading, setLoading] = useState(true);
  const { getSessionId, track } = useAnalytics();

  // Get user's assigned variant
  const getAssignedVariant = useCallback(async () => {
    try {
      const sessionId = getSessionId();
      
      // Check if user already has an assignment
      const { data: existingAssignment, error: assignmentError } = await supabase
        .from('ab_test_assignments')
        .select('variant')
        .eq('test_name', testName)
        .eq('user_session', sessionId)
        .maybeSingle();

      if (existingAssignment) {
        return existingAssignment.variant;
      }

      // Get active test configuration
      const { data: testConfig, error: testError } = await supabase
        .from('ab_tests')
        .select('*')
        .eq('test_name', testName)
        .eq('active', true)
        .maybeSingle();

      if (!testConfig) {
        console.log(`A/B Test ${testName} not found or inactive, defaulting to variant A`);
        return 'A';
      }

      // Assign variant based on traffic split
      const variants = Object.keys(testConfig.traffic_split);
      const splits = Object.values(testConfig.traffic_split) as number[];
      
      const random = Math.random() * 100;
      let cumulative = 0;
      let assignedVariant = variants[0];

      for (let i = 0; i < variants.length; i++) {
        cumulative += splits[i];
        if (random <= cumulative) {
          assignedVariant = variants[i];
          break;
        }
      }

      // Save assignment
      await supabase.from('ab_test_assignments').insert({
        test_name: testName,
        user_session: sessionId,
        variant: assignedVariant
      });

      // Track assignment
      track({
        event_type: 'ab_test_assignment',
        event_data: { test_name: testName, variant: assignedVariant }
      });

      return assignedVariant;
    } catch (error) {
      console.error('Error getting A/B test assignment:', error);
      return 'A'; // Default fallback
    }
  }, [testName, getSessionId, track]);

  // Load test configuration and user assignment
  useEffect(() => {
    const loadTest = async () => {
      setLoading(true);
      try {
        // Get assigned variant
        const assignedVariant = await getAssignedVariant();
        setVariant(assignedVariant);

        // Get test configuration for variant data
        const { data: testConfig, error: configError } = await supabase
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
        console.error('Error loading A/B test:', error);
        // Set fallback values
        setVariant('A');
        setVariantData({ text: 'Grow Now', color: 'primary' });
      } finally {
        setLoading(false);
      }
    };

    loadTest();
  }, [testName, getAssignedVariant]);

  // Mark conversion for this user - secure update with double-write guard
  const convert = useCallback(async (conversionValue?: number) => {
    try {
      const sessionId = getSessionId();

      // Only update if not already converted and belongs to this session
      const { error } = await supabase
        .from('ab_test_assignments')
        .update({ converted: true })
        .eq('test_name', testName)
        .eq('user_session', sessionId)
        .eq('converted', false);

      if (!error) {
        track({
          event_type: 'ab_test_conversion',
          event_data: { test_name: testName, variant, conversion_value: conversionValue },
        });
        console.log(`A/B test conversion tracked for ${testName}, variant ${variant}`);
      } else {
        console.warn('Conversion update failed:', error);
      }
    } catch (error) {
      console.error('Error tracking A/B test conversion:', error);
    }
  }, [testName, variant, getSessionId, track]);

  return {
    variant,
    variantData,
    loading,
    convert
  };
};