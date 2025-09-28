// API client for onboarding endpoints

export interface CheckoutRequest {
  name: string;
  email_to: string;
  target_e164: string;
  plan: 'basic' | 'pro' | 'enterprise';
}

export interface CheckoutResponse {
  url: string;
}

export interface PortalRequest {
  stripe_customer_id: string;
}

export interface PortalResponse {
  url: string;
}

export interface SettingsRequest {
  email_to: string;
  business_name: string;
  business_target_e164: string;
  email_recipients?: string[];
}

export interface SettingsResponse {
  ok: boolean;
}

export interface SettingsGetResponse {
  org: {
    id: string;
    name: string;
    email_to: string;
    target_e164: string;
    created_at: string;
  };
  settings?: {
    org_id: string;
    business_name: string;
    email_recipients: string[];
    business_target_e164: string;
    updated_at: string;
  };
  subscription?: {
    id: string;
    org_id: string;
    stripe_customer_id: string;
    stripe_subscription_id?: string;
    plan: string;
    status: string;
    current_period_end?: string;
    created_at: string;
  };
}

export interface TestCallRequest {
  email_to: string;
}

export interface TestCallResponse {
  ok: boolean;
  placed: boolean;
  call_sid?: string;
}

/**
 * Create Stripe checkout session
 */
export async function createCheckout(data: CheckoutRequest): Promise<CheckoutResponse> {
  const response = await fetch('/api/billing/checkout', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Checkout failed');
  }

  return response.json();
}

/**
 * Create Stripe billing portal session
 */
export async function createPortal(data: PortalRequest): Promise<PortalResponse> {
  const response = await fetch('/api/billing/portal', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Portal creation failed');
  }

  return response.json();
}

/**
 * Get organization settings
 */
export async function getSettings(email_to: string): Promise<SettingsGetResponse> {
  const response = await fetch(`/api/settings?email_to=${encodeURIComponent(email_to)}`);

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to get settings');
  }

  return response.json();
}

/**
 * Save organization settings
 */
export async function saveSettings(data: SettingsRequest): Promise<SettingsResponse> {
  const response = await fetch('/api/settings', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to save settings');
  }

  return response.json();
}

/**
 * Place test call
 */
export async function placeTestCall(data: TestCallRequest): Promise<TestCallResponse> {
  const response = await fetch('/api/settings/test-call', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Test call failed');
  }

  return response.json();
}