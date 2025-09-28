export interface OutreachSession {
  id: string;
  callSid: string;
  e164: string;
  channel: 'sms' | 'whatsapp' | null;
  state: 'pending' | 'sent' | 'responded' | 'expired' | 'stopped';
  lastSentAt?: string | null;
  followupDueAt?: string | null;
  createdAt: string;
  meta?: Record<string, any>;
}

export interface OutreachMessage {
  direction: 'in' | 'out';
  body?: string | null;
  createdAt: string;
}

export interface ConsentInfo {
  status: 'opt_in' | 'opt_out' | null;
  lastChangeAt?: string | null;
}

export interface SessionDetail {
  session: OutreachSession;
  messages: OutreachMessage[];
  consent: Record<string, ConsentInfo>;
}

export interface SessionsResponse {
  items: OutreachSession[];
  nextOffset?: number | null;
}