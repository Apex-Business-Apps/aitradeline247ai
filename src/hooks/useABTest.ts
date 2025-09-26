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

  // Get user's assigned variant (simplified version without database)
  const getAssignedVariant = useCallback(async () => {
    try {
      const sessionId = getSessionId();
      
      // Check localStorage for existing assignment
      const storageKey = `ab_test_${testName}_${sessionId}`;
      const existingAssignment = localStorage.getItem(storageKey);
      
      if (existingAssignment) {
        return existingAssignment;
      }

      // Simple random assignment between A and B
      const variants = ['A', 'B'];
      const assignedVariant = variants[Math.floor(Math.random() * variants.length)];
      
      // Save assignment to localStorage
      localStorage.setItem(storageKey, assignedVariant);

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

        // Set fallback variant data based on variant
        if (assignedVariant === 'B') {
          setVariantData({ text: 'Start Now', color: 'secondary' });
        } else {
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

  // Mark conversion for this user (simplified version without database)
  const convert = useCallback(async (conversionValue?: number) => {
    try {
      const sessionId = getSessionId();
      const storageKey = `ab_test_${testName}_${sessionId}_converted`;
      
      // Check if already converted
      if (localStorage.getItem(storageKey)) {
        return;
      }

      // Mark as converted in localStorage
      localStorage.setItem(storageKey, 'true');

      // Track conversion
      track({
        event_type: 'ab_test_conversion',
        event_data: { test_name: testName, variant, conversion_value: conversionValue },
      });
      console.log(`A/B test conversion tracked for ${testName}, variant ${variant}`);
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