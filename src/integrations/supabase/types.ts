export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "13.0.5"
  }
  public: {
    Tables: {
      ab_test_assignments: {
        Row: {
          converted: boolean | null
          created_at: string
          id: string
          test_name: string
          user_session: string
          variant: string
        }
        Insert: {
          converted?: boolean | null
          created_at?: string
          id?: string
          test_name: string
          user_session: string
          variant: string
        }
        Update: {
          converted?: boolean | null
          created_at?: string
          id?: string
          test_name?: string
          user_session?: string
          variant?: string
        }
        Relationships: []
      }
      ab_tests: {
        Row: {
          active: boolean | null
          created_at: string
          end_date: string | null
          id: string
          start_date: string | null
          test_name: string
          traffic_split: Json | null
          variants: Json
        }
        Insert: {
          active?: boolean | null
          created_at?: string
          end_date?: string | null
          id?: string
          start_date?: string | null
          test_name: string
          traffic_split?: Json | null
          variants: Json
        }
        Update: {
          active?: boolean | null
          created_at?: string
          end_date?: string | null
          id?: string
          start_date?: string | null
          test_name?: string
          traffic_split?: Json | null
          variants?: Json
        }
        Relationships: []
      }
      analytics_events: {
        Row: {
          created_at: string
          event_data: Json | null
          event_type: string
          id: string
          ip_address: string | null
          page_url: string | null
          user_agent: string | null
          user_id: string | null
          user_session: string | null
        }
        Insert: {
          created_at?: string
          event_data?: Json | null
          event_type: string
          id?: string
          ip_address?: string | null
          page_url?: string | null
          user_agent?: string | null
          user_id?: string | null
          user_session?: string | null
        }
        Update: {
          created_at?: string
          event_data?: Json | null
          event_type?: string
          id?: string
          ip_address?: string | null
          page_url?: string | null
          user_agent?: string | null
          user_id?: string | null
          user_session?: string | null
        }
        Relationships: []
      }
      batch_embeddings_jobs: {
        Row: {
          batch_id: string
          completed_count: number
          created_at: string
          failed_count: number
          id: string
          input_file_count: number
          org_id: string
          status: string
          updated_at: string
        }
        Insert: {
          batch_id: string
          completed_count?: number
          created_at?: string
          failed_count?: number
          id?: string
          input_file_count?: number
          org_id: string
          status?: string
          updated_at?: string
        }
        Update: {
          batch_id?: string
          completed_count?: number
          created_at?: string
          failed_count?: number
          id?: string
          input_file_count?: number
          org_id?: string
          status?: string
          updated_at?: string
        }
        Relationships: []
      }
      call_summaries: {
        Row: {
          call_sid: string | null
          confidence_score: number | null
          created_at: string
          escalated: boolean | null
          id: string
          model_used: string | null
          next_actions: Json | null
          org_id: string
          subject: string | null
          summary: string
          tags: Json | null
        }
        Insert: {
          call_sid?: string | null
          confidence_score?: number | null
          created_at?: string
          escalated?: boolean | null
          id?: string
          model_used?: string | null
          next_actions?: Json | null
          org_id: string
          subject?: string | null
          summary: string
          tags?: Json | null
        }
        Update: {
          call_sid?: string | null
          confidence_score?: number | null
          created_at?: string
          escalated?: boolean | null
          id?: string
          model_used?: string | null
          next_actions?: Json | null
          org_id?: string
          subject?: string | null
          summary?: string
          tags?: Json | null
        }
        Relationships: []
      }
      commission_charges: {
        Row: {
          amount_cents: number
          call_id: string | null
          call_sid: string | null
          created_at: string
          currency: Database["public"]["Enums"]["currency_code"]
          id: string
          idempotency_key: string | null
          invoice_id: string | null
          ledger_entry_id: string | null
          org_id: string
          qualified: boolean
          rules_snapshot: Json
        }
        Insert: {
          amount_cents: number
          call_id?: string | null
          call_sid?: string | null
          created_at?: string
          currency?: Database["public"]["Enums"]["currency_code"]
          id?: string
          idempotency_key?: string | null
          invoice_id?: string | null
          ledger_entry_id?: string | null
          org_id: string
          qualified?: boolean
          rules_snapshot?: Json
        }
        Update: {
          amount_cents?: number
          call_id?: string | null
          call_sid?: string | null
          created_at?: string
          currency?: Database["public"]["Enums"]["currency_code"]
          id?: string
          idempotency_key?: string | null
          invoice_id?: string | null
          ledger_entry_id?: string | null
          org_id?: string
          qualified?: boolean
          rules_snapshot?: Json
        }
        Relationships: [
          {
            foreignKeyName: "commission_charges_invoice_id_fkey"
            columns: ["invoice_id"]
            isOneToOne: false
            referencedRelation: "invoices"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "commission_charges_ledger_entry_id_fkey"
            columns: ["ledger_entry_id"]
            isOneToOne: false
            referencedRelation: "wallet_ledger"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "commission_charges_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      commission_disputes: {
        Row: {
          charge_id: string
          created_at: string
          decided_at: string | null
          decision_memo: string | null
          id: string
          org_id: string
          reason: string
          status: string
        }
        Insert: {
          charge_id: string
          created_at?: string
          decided_at?: string | null
          decision_memo?: string | null
          id?: string
          org_id: string
          reason: string
          status?: string
        }
        Update: {
          charge_id?: string
          created_at?: string
          decided_at?: string | null
          decision_memo?: string | null
          id?: string
          org_id?: string
          reason?: string
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "commission_disputes_charge_id_fkey"
            columns: ["charge_id"]
            isOneToOne: false
            referencedRelation: "commission_charges"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "commission_disputes_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      consent_records: {
        Row: {
          consent_given: boolean
          consent_timestamp: string | null
          consent_type: string
          contact_identifier: string
          created_at: string
          id: string
          metadata: Json | null
          org_id: string
          source: string | null
          updated_at: string
          withdraw_timestamp: string | null
        }
        Insert: {
          consent_given?: boolean
          consent_timestamp?: string | null
          consent_type: string
          contact_identifier: string
          created_at?: string
          id?: string
          metadata?: Json | null
          org_id: string
          source?: string | null
          updated_at?: string
          withdraw_timestamp?: string | null
        }
        Update: {
          consent_given?: boolean
          consent_timestamp?: string | null
          consent_type?: string
          contact_identifier?: string
          created_at?: string
          id?: string
          metadata?: Json | null
          org_id?: string
          source?: string | null
          updated_at?: string
          withdraw_timestamp?: string | null
        }
        Relationships: []
      }
      invoices: {
        Row: {
          created_at: string
          currency: Database["public"]["Enums"]["currency_code"]
          id: string
          meta: Json
          number: string | null
          org_id: string
          period_end: string | null
          period_start: string | null
          provider: string | null
          provider_id: string | null
          status: Database["public"]["Enums"]["invoice_status"]
          subtotal_cents: number
          tax_cents: number
          total_cents: number | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          currency?: Database["public"]["Enums"]["currency_code"]
          id?: string
          meta?: Json
          number?: string | null
          org_id: string
          period_end?: string | null
          period_start?: string | null
          provider?: string | null
          provider_id?: string | null
          status?: Database["public"]["Enums"]["invoice_status"]
          subtotal_cents?: number
          tax_cents?: number
          total_cents?: number | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          currency?: Database["public"]["Enums"]["currency_code"]
          id?: string
          meta?: Json
          number?: string | null
          org_id?: string
          period_end?: string | null
          period_start?: string | null
          provider?: string | null
          provider_id?: string | null
          status?: Database["public"]["Enums"]["invoice_status"]
          subtotal_cents?: number
          tax_cents?: number
          total_cents?: number | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "invoices_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      kb_documents: {
        Row: {
          checksum: string
          created_at: string
          embedding: string | null
          id: string
          org_id: string
          text: string
          title: string
          updated_at: string
          url: string | null
        }
        Insert: {
          checksum: string
          created_at?: string
          embedding?: string | null
          id?: string
          org_id: string
          text: string
          title: string
          updated_at?: string
          url?: string | null
        }
        Update: {
          checksum?: string
          created_at?: string
          embedding?: string | null
          id?: string
          org_id?: string
          text?: string
          title?: string
          updated_at?: string
          url?: string | null
        }
        Relationships: []
      }
      kb_versions: {
        Row: {
          created_at: string
          document_count: number
          id: string
          last_embedded_at: string | null
          org_id: string
          updated_at: string
          version: number
        }
        Insert: {
          created_at?: string
          document_count?: number
          id?: string
          last_embedded_at?: string | null
          org_id: string
          updated_at?: string
          version?: number
        }
        Update: {
          created_at?: string
          document_count?: number
          id?: string
          last_embedded_at?: string | null
          org_id?: string
          updated_at?: string
          version?: number
        }
        Relationships: []
      }
      leads: {
        Row: {
          assigned_to: string | null
          company: string
          created_at: string
          email: string
          id: string
          lead_score: number | null
          name: string
          notes: string | null
          source: string | null
          status: string | null
          updated_at: string
        }
        Insert: {
          assigned_to?: string | null
          company: string
          created_at?: string
          email: string
          id?: string
          lead_score?: number | null
          name: string
          notes?: string | null
          source?: string | null
          status?: string | null
          updated_at?: string
        }
        Update: {
          assigned_to?: string | null
          company?: string
          created_at?: string
          email?: string
          id?: string
          lead_score?: number | null
          name?: string
          notes?: string | null
          source?: string | null
          status?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      operational_metrics: {
        Row: {
          id: string
          metadata: Json | null
          metric_name: string
          metric_unit: string | null
          metric_value: number
          org_id: string
          recorded_at: string
        }
        Insert: {
          id?: string
          metadata?: Json | null
          metric_name: string
          metric_unit?: string | null
          metric_value: number
          org_id: string
          recorded_at?: string
        }
        Update: {
          id?: string
          metadata?: Json | null
          metric_name?: string
          metric_unit?: string | null
          metric_value?: number
          org_id?: string
          recorded_at?: string
        }
        Relationships: []
      }
      organizations: {
        Row: {
          created_at: string
          id: string
          name: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          name: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
          updated_at?: string
        }
        Relationships: []
      }
      outbox_messages: {
        Row: {
          attempts: number
          body_html: string | null
          body_text: string | null
          created_at: string
          id: string
          kind: string
          last_error: string | null
          org_id: string
          sent_at: string | null
          status: string
          subject: string
          to_email: string
        }
        Insert: {
          attempts?: number
          body_html?: string | null
          body_text?: string | null
          created_at?: string
          id?: string
          kind: string
          last_error?: string | null
          org_id: string
          sent_at?: string | null
          status?: string
          subject: string
          to_email: string
        }
        Update: {
          attempts?: number
          body_html?: string | null
          body_text?: string | null
          created_at?: string
          id?: string
          kind?: string
          last_error?: string | null
          org_id?: string
          sent_at?: string | null
          status?: string
          subject?: string
          to_email?: string
        }
        Relationships: [
          {
            foreignKeyName: "outbox_messages_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      payment_intents: {
        Row: {
          amount_cents: number
          created_at: string
          currency: Database["public"]["Enums"]["currency_code"]
          id: string
          idempotency_key: string | null
          intent_type: Database["public"]["Enums"]["txn_type"]
          metadata: Json
          org_id: string
          provider: string | null
          provider_id: string | null
          status: Database["public"]["Enums"]["payment_status"]
          updated_at: string
        }
        Insert: {
          amount_cents: number
          created_at?: string
          currency?: Database["public"]["Enums"]["currency_code"]
          id?: string
          idempotency_key?: string | null
          intent_type: Database["public"]["Enums"]["txn_type"]
          metadata?: Json
          org_id: string
          provider?: string | null
          provider_id?: string | null
          status?: Database["public"]["Enums"]["payment_status"]
          updated_at?: string
        }
        Update: {
          amount_cents?: number
          created_at?: string
          currency?: Database["public"]["Enums"]["currency_code"]
          id?: string
          idempotency_key?: string | null
          intent_type?: Database["public"]["Enums"]["txn_type"]
          metadata?: Json
          org_id?: string
          provider?: string | null
          provider_id?: string | null
          status?: Database["public"]["Enums"]["payment_status"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "payment_intents_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          display_name: string | null
          id: string
          organization_id: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          display_name?: string | null
          id?: string
          organization_id?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          display_name?: string | null
          id?: string
          organization_id?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "profiles_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      rag_cache: {
        Row: {
          answer: Json
          created_at: string
          expires_at: string
          id: string
          kb_version: number
          org_id: string
          question_hash: string
        }
        Insert: {
          answer: Json
          created_at?: string
          expires_at?: string
          id?: string
          kb_version: number
          org_id: string
          question_hash: string
        }
        Update: {
          answer?: Json
          created_at?: string
          expires_at?: string
          id?: string
          kb_version?: number
          org_id?: string
          question_hash?: string
        }
        Relationships: []
      }
      ragas_evaluations: {
        Row: {
          answer: string
          answer_relevance_score: number | null
          context: Json | null
          created_at: string
          faithfulness_score: number | null
          ground_truth: string | null
          id: string
          org_id: string
          question: string
          retrieval_precision: number | null
        }
        Insert: {
          answer: string
          answer_relevance_score?: number | null
          context?: Json | null
          created_at?: string
          faithfulness_score?: number | null
          ground_truth?: string | null
          id?: string
          org_id: string
          question: string
          retrieval_precision?: number | null
        }
        Update: {
          answer?: string
          answer_relevance_score?: number | null
          context?: Json | null
          created_at?: string
          faithfulness_score?: number | null
          ground_truth?: string | null
          id?: string
          org_id?: string
          question?: string
          retrieval_precision?: number | null
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      user_sessions: {
        Row: {
          created_at: string
          expires_at: string
          id: string
          is_active: boolean
          last_activity: string
          session_token: string
          user_id: string
        }
        Insert: {
          created_at?: string
          expires_at?: string
          id?: string
          is_active?: boolean
          last_activity?: string
          session_token: string
          user_id: string
        }
        Update: {
          created_at?: string
          expires_at?: string
          id?: string
          is_active?: boolean
          last_activity?: string
          session_token?: string
          user_id?: string
        }
        Relationships: []
      }
      wallet_ledger: {
        Row: {
          amount_cents: number
          created_at: string
          created_by: string | null
          currency: Database["public"]["Enums"]["currency_code"]
          entry_type: Database["public"]["Enums"]["ledger_entry_type"]
          id: string
          idempotency_key: string | null
          memo: string | null
          org_id: string
          related_id: string | null
          related_type: string | null
        }
        Insert: {
          amount_cents: number
          created_at?: string
          created_by?: string | null
          currency?: Database["public"]["Enums"]["currency_code"]
          entry_type: Database["public"]["Enums"]["ledger_entry_type"]
          id?: string
          idempotency_key?: string | null
          memo?: string | null
          org_id: string
          related_id?: string | null
          related_type?: string | null
        }
        Update: {
          amount_cents?: number
          created_at?: string
          created_by?: string | null
          currency?: Database["public"]["Enums"]["currency_code"]
          entry_type?: Database["public"]["Enums"]["ledger_entry_type"]
          id?: string
          idempotency_key?: string | null
          memo?: string | null
          org_id?: string
          related_id?: string | null
          related_type?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "wallet_ledger_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      webhook_events: {
        Row: {
          dedupe_key: string | null
          event_type: string
          id: string
          org_id: string | null
          payload: Json
          processed_at: string | null
          provider: string
          received_at: string
        }
        Insert: {
          dedupe_key?: string | null
          event_type: string
          id?: string
          org_id?: string | null
          payload: Json
          processed_at?: string | null
          provider: string
          received_at?: string
        }
        Update: {
          dedupe_key?: string | null
          event_type?: string
          id?: string
          org_id?: string | null
          payload?: Json
          processed_at?: string | null
          provider?: string
          received_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "webhook_events_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      analytics_privacy_summary: {
        Row: {
          event_count: number | null
          event_type: string | null
          time_window: string | null
          traffic_level: string | null
          unique_sessions: number | null
        }
        Relationships: []
      }
      secure_lead_metrics: {
        Row: {
          recent_count: number | null
          report_type: string | null
          total_count: number | null
          weekly_count: number | null
        }
        Relationships: []
      }
      wallet_balances: {
        Row: {
          balance_cents: number | null
          org_id: string | null
        }
        Relationships: [
          {
            foreignKeyName: "wallet_ledger_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Functions: {
      anonymize_old_analytics_data: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      anonymize_old_leads: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      binary_quantize: {
        Args: { "": string } | { "": unknown }
        Returns: unknown
      }
      calculate_lead_score: {
        Args: {
          company_name: string
          email_domain: string
          notes_content: string
        }
        Returns: number
      }
      cleanup_expired_rag_cache: {
        Args: Record<PropertyKey, never>
        Returns: number
      }
      cleanup_expired_sessions: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      cleanup_old_analytics_data: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      current_org_id: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      get_current_user_role: {
        Args: Record<PropertyKey, never>
        Returns: Database["public"]["Enums"]["app_role"]
      }
      get_lead_security_metrics: {
        Args: Record<PropertyKey, never>
        Returns: {
          average_score: number
          domain_diversity: number
          recent_leads: number
          security_events: number
          total_leads: number
        }[]
      }
      get_secure_lead_stats: {
        Args: Record<PropertyKey, never>
        Returns: {
          avg_score: number
          leads_today: number
          total_leads: number
          unique_domains: number
        }[]
      }
      halfvec_avg: {
        Args: { "": number[] }
        Returns: unknown
      }
      halfvec_out: {
        Args: { "": unknown }
        Returns: unknown
      }
      halfvec_send: {
        Args: { "": unknown }
        Returns: string
      }
      halfvec_typmod_in: {
        Args: { "": unknown[] }
        Returns: number
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      hnsw_bit_support: {
        Args: { "": unknown }
        Returns: unknown
      }
      hnsw_halfvec_support: {
        Args: { "": unknown }
        Returns: unknown
      }
      hnsw_sparsevec_support: {
        Args: { "": unknown }
        Returns: unknown
      }
      hnswhandler: {
        Args: { "": unknown }
        Returns: unknown
      }
      increment_kb_version: {
        Args: { target_org_id: string }
        Returns: number
      }
      ivfflat_bit_support: {
        Args: { "": unknown }
        Returns: unknown
      }
      ivfflat_halfvec_support: {
        Args: { "": unknown }
        Returns: unknown
      }
      ivfflathandler: {
        Args: { "": unknown }
        Returns: unknown
      }
      l2_norm: {
        Args: { "": unknown } | { "": unknown }
        Returns: number
      }
      l2_normalize: {
        Args: { "": string } | { "": unknown } | { "": unknown }
        Returns: string
      }
      log_analytics_access_attempt: {
        Args: { access_type: string; success?: boolean; user_context?: string }
        Returns: undefined
      }
      sparsevec_out: {
        Args: { "": unknown }
        Returns: unknown
      }
      sparsevec_send: {
        Args: { "": unknown }
        Returns: string
      }
      sparsevec_typmod_in: {
        Args: { "": unknown[] }
        Returns: number
      }
      vector_avg: {
        Args: { "": number[] }
        Returns: string
      }
      vector_dims: {
        Args: { "": string } | { "": unknown }
        Returns: number
      }
      vector_norm: {
        Args: { "": string }
        Returns: number
      }
      vector_out: {
        Args: { "": string }
        Returns: unknown
      }
      vector_send: {
        Args: { "": string }
        Returns: string
      }
      vector_typmod_in: {
        Args: { "": unknown[] }
        Returns: number
      }
    }
    Enums: {
      app_role: "admin" | "user"
      currency_code: "CAD"
      invoice_status:
        | "draft"
        | "open"
        | "paid"
        | "uncollectible"
        | "void"
        | "refunded"
      ledger_entry_type:
        | "top_up"
        | "authorization"
        | "capture"
        | "refund"
        | "adjustment"
      payment_status:
        | "requires_payment"
        | "processing"
        | "succeeded"
        | "canceled"
        | "requires_action"
        | "failed"
      txn_type:
        | "wallet_top_up"
        | "commission_charge"
        | "subscription_invoice"
        | "refund"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      app_role: ["admin", "user"],
      currency_code: ["CAD"],
      invoice_status: [
        "draft",
        "open",
        "paid",
        "uncollectible",
        "void",
        "refunded",
      ],
      ledger_entry_type: [
        "top_up",
        "authorization",
        "capture",
        "refund",
        "adjustment",
      ],
      payment_status: [
        "requires_payment",
        "processing",
        "succeeded",
        "canceled",
        "requires_action",
        "failed",
      ],
      txn_type: [
        "wallet_top_up",
        "commission_charge",
        "subscription_invoice",
        "refund",
      ],
    },
  },
} as const
