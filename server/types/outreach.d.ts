export interface OutreachSession {
  id: string;
  callSid: string;
  e164: string;
  channel: 'sms' | 'whatsapp' | null;
  state: 'pending' | 'sent' | 'responded' | 'expired' | 'stopped';
  lastSentAt?: string | null;
  followupDueAt?: string | null;
  createdAt: string;
}

export interface OutreachMessage {
  id: string;
  sessionId: string;
  direction: 'in' | 'out';
  body?: string | null;
  createdAt: string;
}

export interface LatestConsent {
  status: 'opt_in' | 'opt_out' | null;
  channel: 'sms' | 'whatsapp';
  lastChangeAt?: string | null;
}