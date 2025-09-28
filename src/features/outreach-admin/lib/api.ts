import type { SessionsResponse, SessionDetail } from './types';

const API_BASE = '/api/outreach';

export async function fetchSessions(params: {
  state?: string;
  e164?: string;
  limit?: number;
  offset?: number;
}): Promise<SessionsResponse> {
  const searchParams = new URLSearchParams();
  
  if (params.state) searchParams.set('state', params.state);
  if (params.e164) searchParams.set('e164', params.e164);
  if (params.limit) searchParams.set('limit', params.limit.toString());
  if (params.offset) searchParams.set('offset', params.offset.toString());

  const response = await fetch(`${API_BASE}/sessions?${searchParams}`);
  
  if (!response.ok) {
    throw new Error(`Failed to fetch sessions: ${response.statusText}`);
  }
  
  return response.json();
}

export async function fetchSessionDetail(id: string): Promise<SessionDetail> {
  const response = await fetch(`${API_BASE}/sessions/${id}`);
  
  if (!response.ok) {
    throw new Error(`Failed to fetch session detail: ${response.statusText}`);
  }
  
  return response.json();
}

export async function resendInitial(id: string): Promise<void> {
  const response = await fetch(`${API_BASE}/sessions/${id}/actions/resend-initial`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' }
  });
  
  if (!response.ok) {
    throw new Error(`Failed to resend initial: ${response.statusText}`);
  }
}

export async function cancelSession(id: string): Promise<void> {
  const response = await fetch(`${API_BASE}/sessions/${id}/actions/cancel`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' }
  });
  
  if (!response.ok) {
    throw new Error(`Failed to cancel session: ${response.statusText}`);
  }
}

export async function manageConsent(data: {
  e164: string;
  action: 'opt_in' | 'opt_out';
  channel: 'sms' | 'whatsapp';
}): Promise<void> {
  const response = await fetch(`${API_BASE}/consent`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  });
  
  if (!response.ok) {
    throw new Error(`Failed to manage consent: ${response.statusText}`);
  }
}

export async function runFollowups(): Promise<{ sent: number }> {
  const response = await fetch('/internal/outreach/run', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' }
  });
  
  if (!response.ok) {
    throw new Error(`Failed to run followups: ${response.statusText}`);
  }
  
  return response.json();
}