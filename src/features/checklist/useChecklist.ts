import { useState, useEffect } from "react";

interface ChecklistItem {
  id: string;
  title: string;
  description: string;
  completed: boolean;
  link: string;
}

export function useChecklist() {
  const [items, setItems] = useState<ChecklistItem[]>([
    {
      id: 'business_number',
      title: 'Business number set',
      description: 'Configure your business phone number',
      completed: false,
      link: '/settings'
    },
    {
      id: 'email_recipients',
      title: 'Email recipients configured',
      description: 'Set up notification email addresses',
      completed: false,
      link: '/settings'
    },
    {
      id: 'test_call',
      title: 'Test call placed',
      description: 'Verify your setup with a test call',
      completed: false,
      link: '/settings'
    },
    {
      id: 'first_transcript',
      title: 'First transcript delivered',
      description: 'Receive your first call transcript',
      completed: false,
      link: '/settings'
    },
    {
      id: 'billing_active',
      title: 'Billing activated',
      description: 'Activate your subscription',
      completed: false,
      link: '/subscribe'
    }
  ]);

  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkItemCompletion();
  }, []);

  const checkItemCompletion = async () => {
    try {
      // TODO: Replace with actual API checks
      // Simulate API calls to check completion status
      setTimeout(() => {
        setItems(prev => prev.map(item => {
          switch (item.id) {
            case 'business_number':
              // Check if business number is set (+14319900222)
              return { ...item, completed: checkBusinessNumber() };
            case 'email_recipients':
              // Check if email recipients are configured
              return { ...item, completed: checkEmailRecipients() };
            case 'test_call':
              // Check Twilio events in last 24h
              return { ...item, completed: checkTestCall() };
            case 'first_transcript':
              // Check Resend success in last 24h
              return { ...item, completed: checkFirstTranscript() };
            case 'billing_active':
              // Check Stripe subscription status
              return { ...item, completed: checkBillingActive() };
            default:
              return item;
          }
        }));
        setLoading(false);
      }, 800);
    } catch (error) {
      console.error('Failed to check completion status:', error);
      setLoading(false);
    }
  };

  // Mock functions for checking completion status
  // These should be replaced with actual API calls
  const checkBusinessNumber = (): boolean => {
    // Check if business number matches +14319900222 or similar
    const savedNumber = localStorage.getItem('businessNumber');
    return savedNumber === '+14319900222' || Math.random() > 0.7;
  };

  const checkEmailRecipients = (): boolean => {
    // Check if email recipients include info@tradeline247ai.com or others
    const savedEmail = localStorage.getItem('notificationEmail');
    return savedEmail === 'info@tradeline247ai.com' || Math.random() > 0.6;
  };

  const checkTestCall = (): boolean => {
    // Check Twilio webhook events in last 24h
    // This should check actual Twilio event logs
    return Math.random() > 0.8;
  };

  const checkFirstTranscript = (): boolean => {
    // Check Resend delivery success in last 24h
    // This should check actual email delivery logs
    return Math.random() > 0.9;
  };

  const checkBillingActive = (): boolean => {
    // Check Stripe subscription status
    // This should check actual Stripe subscription status
    return Math.random() > 0.85;
  };

  const completedCount = items.filter(item => item.completed).length;
  const progress = (completedCount / items.length) * 100;
  const isComplete = completedCount === items.length;

  const refreshStatus = () => {
    setLoading(true);
    checkItemCompletion();
  };

  return {
    items,
    progress,
    isComplete,
    loading,
    refreshStatus,
    completedCount,
    totalCount: items.length
  };
}