import { useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface PasswordCheckResult {
  isBreached: boolean;
  message: string;
  error?: string;
}

export const usePasswordSecurity = () => {
  // Check if password appears in known breaches using Have I Been Pwned
  const checkPasswordBreach = useCallback(async (password: string): Promise<PasswordCheckResult> => {
    try {
      if (!password || password.length < 1) {
        return {
          isBreached: false,
          message: 'Password required'
        };
      }

      console.log('Checking password breach status...');

      // Call secure password check endpoint
      const { data, error } = await supabase.functions.invoke('check-password-breach', {
        body: { password }
      });

      if (error) {
        console.error('Password breach check error:', error);
        return {
          isBreached: false,
          message: 'Password check service temporarily unavailable',
          error: error.message
        };
      }

      return {
        isBreached: data?.isBreached || false,
        message: data?.message || 'Password check completed',
        error: data?.error
      };

    } catch (error) {
      console.error('Password security check failed:', error);
      return {
        isBreached: false,
        message: 'Password check service error',
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }, []);

  // Validate password strength (client-side basic validation)
  const validatePasswordStrength = useCallback((password: string): { 
    isValid: boolean; 
    strength: string; 
    message?: string 
  } => {
    if (password.length < 8) {
      return { 
        isValid: false, 
        strength: 'Too short', 
        message: 'Password must be at least 8 characters long' 
      };
    }

    const hasLower = /[a-z]/.test(password);
    const hasUpper = /[A-Z]/.test(password);
    const hasNumber = /\d/.test(password);
    const hasSpecial = /[!@#$%^&*(),.?":{}|<>]/.test(password);
    
    const criteriaCount = [hasLower, hasUpper, hasNumber, hasSpecial].filter(Boolean).length;
    
    if (criteriaCount < 3) {
      return { 
        isValid: false, 
        strength: 'Too weak', 
        message: 'Password must contain at least 3 of: lowercase, uppercase, number, special character' 
      };
    }

    const strength = criteriaCount === 4 ? 'Very strong' : 'Good';
    return { isValid: true, strength };
  }, []);

  // Combined password validation (strength + breach check)
  const validatePassword = useCallback(async (password: string): Promise<{
    isValid: boolean;
    strength: string;
    isBreached: boolean;
    message?: string;
  }> => {
    // First check basic strength
    const strengthValidation = validatePasswordStrength(password);
    
    if (!strengthValidation.isValid) {
      return {
        isValid: false,
        strength: strengthValidation.strength,
        isBreached: false,
        message: strengthValidation.message
      };
    }

    // Then check for breaches
    const breachCheck = await checkPasswordBreach(password);
    
    return {
      isValid: !breachCheck.isBreached,
      strength: strengthValidation.strength,
      isBreached: breachCheck.isBreached,
      message: breachCheck.isBreached ? breachCheck.message : undefined
    };
  }, [validatePasswordStrength, checkPasswordBreach]);

  return {
    checkPasswordBreach,
    validatePasswordStrength,
    validatePassword
  };
};