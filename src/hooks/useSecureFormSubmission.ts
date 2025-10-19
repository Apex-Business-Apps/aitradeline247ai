import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface SecureSubmissionOptions {
  rateLimitKey?: string;
  maxAttemptsPerHour?: number;
}

export const useSecureFormSubmission = (options: SecureSubmissionOptions = {}) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [attempts, setAttempts] = useState(0);
  
  const { rateLimitKey, maxAttemptsPerHour = 5 } = options;

  const checkRateLimit = async (): Promise<boolean> => {
    if (!rateLimitKey) return true;
    
    try {
      // Use server-side rate limiting via RPC function
      const { data, error } = await supabase.rpc('secure_rate_limit', {
        identifier: rateLimitKey,
        max_requests: maxAttemptsPerHour,
        window_seconds: 3600
      });

      if (error) {
        console.error('Rate limit check error:', error);
        // Fail closed - deny on error to prevent bypass
        return false;
      }

      // Parse the response - RPC returns Json type
      const result = data as { allowed: boolean; remaining: number; limit: number };
      
      if (!result?.allowed) {
        console.warn('Rate limit exceeded for:', rateLimitKey);
        return false;
      }

      setAttempts(maxAttemptsPerHour - (result.remaining || 0));
      return true;
    } catch (error) {
      console.error('Rate limit check failed:', error);
      // Fail closed - deny on error to prevent bypass
      return false;
    }
  };

  const getCSRFToken = (): string => {
    // Generate a CSRF token if none exists
    let token = sessionStorage.getItem('csrf-token');
    if (!token) {
      token = crypto.randomUUID();
      sessionStorage.setItem('csrf-token', token);
    }
    return token;
  };

  const secureSubmit = async <T>(
    endpoint: string, 
    data: any, 
    options: { 
      validateResponse?: (response: any) => boolean;
      sanitizeData?: (data: any) => any;
    } = {}
  ): Promise<T> => {
    const rateLimitPassed = await checkRateLimit();
    if (!rateLimitPassed) {
      throw new Error('Rate limit exceeded. Please try again later.');
    }

    setIsSubmitting(true);
    
    try {
      // Sanitize data if function provided
      const sanitizedData = options.sanitizeData ? options.sanitizeData(data) : data;
      
      // Add CSRF token
      const submissionData = {
        ...sanitizedData,
        _csrf: getCSRFToken(),
        _timestamp: Date.now()
      };

      const { data: response, error } = await supabase.functions.invoke(endpoint, {
        body: submissionData,
        headers: {
          'X-CSRF-Token': getCSRFToken(),
          'Content-Type': 'application/json'
        }
      });

      if (error) {
        throw new Error(error.message || 'Submission failed');
      }

      // Validate response if function provided
      if (options.validateResponse && !options.validateResponse(response)) {
        throw new Error('Invalid response received');
      }

      return response;
    } finally {
      setIsSubmitting(false);
    }
  };

  const getRemainingAttempts = (): number => {
    return Math.max(0, maxAttemptsPerHour - attempts);
  };

  return {
    isSubmitting,
    secureSubmit,
    checkRateLimit,
    getRemainingAttempts,
    attempts
  };
};
