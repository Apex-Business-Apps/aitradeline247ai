export type KpiId = 'bookings' | 'payout' | 'answerRate' | 'rescued';

export interface Kpi {
  id: KpiId;
  value: number;
  deltaPct?: number;
  currency?: string;
}

export type NextItemStatus = 'new' | 'confirmed' | 'reschedule';
export type NextItemAction = 'confirm' | 'reschedule' | 'note';

export interface NextItem {
  id: string;
  whenISO: string;
  name: string;
  contact: string;
  status: NextItemStatus;
  actions: NextItemAction[];
}

export type TranscriptSentiment = 'positive' | 'neutral' | 'negative';

export interface Transcript {
  id: string;
  atISO: string;
  caller: string;
  summary: string;
  sentiment: TranscriptSentiment;
  needsReply: boolean;
}

export interface QuickActionItem {
  id: string;
  title: string;
  description: string;
  icon: string;
  variant?: 'default' | 'outline' | 'secondary';
}

export interface Announcement {
  id: string;
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error';
  dismissible: boolean;
  actionText?: string;
  actionUrl?: string;
}