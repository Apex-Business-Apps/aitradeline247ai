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
    PostgrestVersion: "13.0.4"
  }
  public: {
    Tables: {
      analytics_events: {
        Row: {
          created_at: string
          event_data: Json | null
          event_type: string
          id: string
          ip_address: unknown | null
          session_id: string | null
          severity: string | null
          user_agent: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string
          event_data?: Json | null
          event_type: string
          id?: string
          ip_address?: unknown | null
          session_id?: string | null
          severity?: string | null
          user_agent?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string
          event_data?: Json | null
          event_type?: string
          id?: string
          ip_address?: unknown | null
          session_id?: string | null
          severity?: string | null
          user_agent?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      appointment_events: {
        Row: {
          appointment_id: string
          created_at: string
          event: string
          id: string
          meta: Json | null
        }
        Insert: {
          appointment_id: string
          created_at?: string
          event: string
          id?: string
          meta?: Json | null
        }
        Update: {
          appointment_id?: string
          created_at?: string
          event?: string
          id?: string
          meta?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "appointment_events_appointment_id_fkey"
            columns: ["appointment_id"]
            isOneToOne: false
            referencedRelation: "appointments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "appointment_events_appointment_id_fkey"
            columns: ["appointment_id"]
            isOneToOne: false
            referencedRelation: "appointments_safe"
            referencedColumns: ["id"]
          },
        ]
      }
      appointments: {
        Row: {
          created_at: string
          e164: string
          email: string | null
          end_at: string
          first_name: string | null
          id: string
          note: string | null
          organization_id: string | null
          source: string
          start_at: string
          status: string
          tz: string
        }
        Insert: {
          created_at?: string
          e164: string
          email?: string | null
          end_at: string
          first_name?: string | null
          id?: string
          note?: string | null
          organization_id?: string | null
          source?: string
          start_at: string
          status?: string
          tz?: string
        }
        Update: {
          created_at?: string
          e164?: string
          email?: string | null
          end_at?: string
          first_name?: string | null
          id?: string
          note?: string | null
          organization_id?: string | null
          source?: string
          start_at?: string
          status?: string
          tz?: string
        }
        Relationships: []
      }
      audit_logs: {
        Row: {
          action: string
          id: string
          org_id: string | null
          payload: Json | null
          target: string | null
          ts: string
          user_id: string | null
        }
        Insert: {
          action: string
          id?: string
          org_id?: string | null
          payload?: Json | null
          target?: string | null
          ts?: string
          user_id?: string | null
        }
        Update: {
          action?: string
          id?: string
          org_id?: string | null
          payload?: Json | null
          target?: string | null
          ts?: string
          user_id?: string | null
        }
        Relationships: []
      }
      blocklist_numbers: {
        Row: {
          created_at: string
          phone_e164: string
          reason: string | null
        }
        Insert: {
          created_at?: string
          phone_e164: string
          reason?: string | null
        }
        Update: {
          created_at?: string
          phone_e164?: string
          reason?: string | null
        }
        Relationships: []
      }
      bookings: {
        Row: {
          created_at: string | null
          customer_name: string | null
          datetime: string | null
          id: string
          service: string | null
          status: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          customer_name?: string | null
          datetime?: string | null
          id?: string
          service?: string | null
          status?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          customer_name?: string | null
          datetime?: string | null
          id?: string
          service?: string | null
          status?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      call_lifecycle: {
        Row: {
          call_sid: string
          direction: string | null
          end_time: string | null
          from_number: string | null
          meta: Json | null
          start_time: string | null
          status: string | null
          talk_seconds: number | null
          to_number: string | null
          updated_at: string | null
        }
        Insert: {
          call_sid: string
          direction?: string | null
          end_time?: string | null
          from_number?: string | null
          meta?: Json | null
          start_time?: string | null
          status?: string | null
          talk_seconds?: number | null
          to_number?: string | null
          updated_at?: string | null
        }
        Update: {
          call_sid?: string
          direction?: string | null
          end_time?: string | null
          from_number?: string | null
          meta?: Json | null
          start_time?: string | null
          status?: string | null
          talk_seconds?: number | null
          to_number?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      calls: {
        Row: {
          booked: boolean | null
          call_sid: string
          caller_e164: string | null
          intent: string | null
          org_id: string
          outcome: string | null
          redacted: boolean | null
          started_at: string | null
          status: string | null
        }
        Insert: {
          booked?: boolean | null
          call_sid: string
          caller_e164?: string | null
          intent?: string | null
          org_id: string
          outcome?: string | null
          redacted?: boolean | null
          started_at?: string | null
          status?: string | null
        }
        Update: {
          booked?: boolean | null
          call_sid?: string
          caller_e164?: string | null
          intent?: string | null
          org_id?: string
          outcome?: string | null
          redacted?: boolean | null
          started_at?: string | null
          status?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "calls_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      consent_logs: {
        Row: {
          channel: string
          created_at: string
          e164: string
          id: string
          source: string | null
          status: string
        }
        Insert: {
          channel: string
          created_at?: string
          e164: string
          id?: string
          source?: string | null
          status: string
        }
        Update: {
          channel?: string
          created_at?: string
          e164?: string
          id?: string
          source?: string | null
          status?: string
        }
        Relationships: []
      }
      contacts: {
        Row: {
          created_at: string
          e164: string
          first_name: string | null
          id: string
          wa_capable: boolean | null
        }
        Insert: {
          created_at?: string
          e164: string
          first_name?: string | null
          id?: string
          wa_capable?: boolean | null
        }
        Update: {
          created_at?: string
          e164?: string
          first_name?: string | null
          id?: string
          wa_capable?: boolean | null
        }
        Relationships: []
      }
      data_access_audit: {
        Row: {
          access_type: string
          accessed_record_id: string | null
          accessed_table: string
          created_at: string | null
          id: string
          ip_address: unknown | null
          user_agent: string | null
          user_id: string | null
        }
        Insert: {
          access_type: string
          accessed_record_id?: string | null
          accessed_table: string
          created_at?: string | null
          id?: string
          ip_address?: unknown | null
          user_agent?: string | null
          user_id?: string | null
        }
        Update: {
          access_type?: string
          accessed_record_id?: string | null
          accessed_table?: string
          created_at?: string | null
          id?: string
          ip_address?: unknown | null
          user_agent?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      events_inbox: {
        Row: {
          call_sid: string
          created_at: string
          id: string
          idempotency_key: string
          kind: string
          org_id: string
          payload: Json
          processed_at: string | null
        }
        Insert: {
          call_sid: string
          created_at?: string
          id?: string
          idempotency_key: string
          kind: string
          org_id: string
          payload: Json
          processed_at?: string | null
        }
        Update: {
          call_sid?: string
          created_at?: string
          id?: string
          idempotency_key?: string
          kind?: string
          org_id?: string
          payload?: Json
          processed_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "events_inbox_call_sid_fkey"
            columns: ["call_sid"]
            isOneToOne: false
            referencedRelation: "calls"
            referencedColumns: ["call_sid"]
          },
          {
            foreignKeyName: "events_inbox_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      events_outbox: {
        Row: {
          call_sid: string | null
          created_at: string
          dispatched_at: string | null
          id: string
          kind: string
          org_id: string
          payload: Json
        }
        Insert: {
          call_sid?: string | null
          created_at?: string
          dispatched_at?: string | null
          id?: string
          kind: string
          org_id: string
          payload: Json
        }
        Update: {
          call_sid?: string | null
          created_at?: string
          dispatched_at?: string | null
          id?: string
          kind?: string
          org_id?: string
          payload?: Json
        }
        Relationships: [
          {
            foreignKeyName: "events_outbox_call_sid_fkey"
            columns: ["call_sid"]
            isOneToOne: false
            referencedRelation: "calls"
            referencedColumns: ["call_sid"]
          },
          {
            foreignKeyName: "events_outbox_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      faqs: {
        Row: {
          a: string
          created_at: string
          id: string
          organization_id: string
          q: string
          updated_at: string
        }
        Insert: {
          a: string
          created_at?: string
          id?: string
          organization_id: string
          q: string
          updated_at?: string
        }
        Update: {
          a?: string
          created_at?: string
          id?: string
          organization_id?: string
          q?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "faqs_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      hotline_numbers: {
        Row: {
          agent_name: string
          created_at: string
          greeting_template: string | null
          locale: string
          org_id: string
          phone_e164: string
          tagline_on: boolean
        }
        Insert: {
          agent_name?: string
          created_at?: string
          greeting_template?: string | null
          locale?: string
          org_id: string
          phone_e164: string
          tagline_on?: boolean
        }
        Update: {
          agent_name?: string
          created_at?: string
          greeting_template?: string | null
          locale?: string
          org_id?: string
          phone_e164?: string
          tagline_on?: boolean
        }
        Relationships: [
          {
            foreignKeyName: "hotline_numbers_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      hotline_voice_prefs: {
        Row: {
          phone_e164: string
          voice_code: string
        }
        Insert: {
          phone_e164: string
          voice_code: string
        }
        Update: {
          phone_e164?: string
          voice_code?: string
        }
        Relationships: [
          {
            foreignKeyName: "hotline_voice_prefs_phone_e164_fkey"
            columns: ["phone_e164"]
            isOneToOne: true
            referencedRelation: "hotline_numbers"
            referencedColumns: ["phone_e164"]
          },
          {
            foreignKeyName: "hotline_voice_prefs_voice_code_fkey"
            columns: ["voice_code"]
            isOneToOne: false
            referencedRelation: "supported_voices"
            referencedColumns: ["code"]
          },
        ]
      }
      messages: {
        Row: {
          body: string | null
          created_at: string | null
          from_phone: string | null
          id: string
          subject: string | null
          user_id: string | null
        }
        Insert: {
          body?: string | null
          created_at?: string | null
          from_phone?: string | null
          id?: string
          subject?: string | null
          user_id?: string | null
        }
        Update: {
          body?: string | null
          created_at?: string | null
          from_phone?: string | null
          id?: string
          subject?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      org_settings: {
        Row: {
          business_hours: Json | null
          calendly_url: string | null
          emergency_number: string | null
          gcal_service: Json | null
          language: string | null
          organization_id: string
          slack_webhook_url: string | null
          teams_webhook_url: string | null
          updated_at: string
          voice_id: string | null
          zap_outgoing_url: string | null
        }
        Insert: {
          business_hours?: Json | null
          calendly_url?: string | null
          emergency_number?: string | null
          gcal_service?: Json | null
          language?: string | null
          organization_id: string
          slack_webhook_url?: string | null
          teams_webhook_url?: string | null
          updated_at?: string
          voice_id?: string | null
          zap_outgoing_url?: string | null
        }
        Update: {
          business_hours?: Json | null
          calendly_url?: string | null
          emergency_number?: string | null
          gcal_service?: Json | null
          language?: string | null
          organization_id?: string
          slack_webhook_url?: string | null
          teams_webhook_url?: string | null
          updated_at?: string
          voice_id?: string | null
          zap_outgoing_url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "org_settings_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: true
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      org_users: {
        Row: {
          created_at: string | null
          org_id: string
          role: string
          user_id: string
        }
        Insert: {
          created_at?: string | null
          org_id: string
          role?: string
          user_id: string
        }
        Update: {
          created_at?: string | null
          org_id?: string
          role?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "org_users_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "orgs"
            referencedColumns: ["id"]
          },
        ]
      }
      organization_members: {
        Row: {
          created_at: string
          org_id: string
          role: string
          user_id: string
        }
        Insert: {
          created_at?: string
          org_id: string
          role?: string
          user_id: string
        }
        Update: {
          created_at?: string
          org_id?: string
          role?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "organization_members_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      organizations: {
        Row: {
          created_at: string
          id: string
          name: string
          settings: Json
          slug: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          name: string
          settings?: Json
          slug?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
          settings?: Json
          slug?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      orgs: {
        Row: {
          created_at: string
          email_to: string
          id: string
          name: string
          target_e164: string
        }
        Insert: {
          created_at?: string
          email_to: string
          id?: string
          name: string
          target_e164: string
        }
        Update: {
          created_at?: string
          email_to?: string
          id?: string
          name?: string
          target_e164?: string
        }
        Relationships: []
      }
      outreach_events: {
        Row: {
          call_sid: string | null
          channel: string
          created_at: string | null
          dedupe_key: string | null
          id: number
          payload: Json | null
          status: string
        }
        Insert: {
          call_sid?: string | null
          channel: string
          created_at?: string | null
          dedupe_key?: string | null
          id?: number
          payload?: Json | null
          status: string
        }
        Update: {
          call_sid?: string | null
          channel?: string
          created_at?: string | null
          dedupe_key?: string | null
          id?: number
          payload?: Json | null
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "outreach_events_call_sid_fkey"
            columns: ["call_sid"]
            isOneToOne: false
            referencedRelation: "call_lifecycle"
            referencedColumns: ["call_sid"]
          },
        ]
      }
      outreach_messages: {
        Row: {
          body: string | null
          created_at: string
          direction: string
          id: string
          payload: Json | null
          session_id: string
        }
        Insert: {
          body?: string | null
          created_at?: string
          direction: string
          id?: string
          payload?: Json | null
          session_id: string
        }
        Update: {
          body?: string | null
          created_at?: string
          direction?: string
          id?: string
          payload?: Json | null
          session_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "outreach_messages_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "outreach_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      outreach_sessions: {
        Row: {
          call_sid: string
          channel: string | null
          created_at: string
          e164: string
          followup_due_at: string | null
          id: string
          last_sent_at: string | null
          meta: Json | null
          state: string
        }
        Insert: {
          call_sid: string
          channel?: string | null
          created_at?: string
          e164: string
          followup_due_at?: string | null
          id?: string
          last_sent_at?: string | null
          meta?: Json | null
          state?: string
        }
        Update: {
          call_sid?: string
          channel?: string | null
          created_at?: string
          e164?: string
          followup_due_at?: string | null
          id?: string
          last_sent_at?: string | null
          meta?: Json | null
          state?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          created_at: string
          full_name: string | null
          id: string
          phone_e164: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          full_name?: string | null
          id: string
          phone_e164?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          full_name?: string | null
          id?: string
          phone_e164?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      reply_events: {
        Row: {
          created_at: string
          id: string
          session_id: string
          signal: string
        }
        Insert: {
          created_at?: string
          id?: string
          session_id: string
          signal: string
        }
        Update: {
          created_at?: string
          id?: string
          session_id?: string
          signal?: string
        }
        Relationships: [
          {
            foreignKeyName: "reply_events_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "outreach_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      retention_policies: {
        Row: {
          email_logs_days: number
          org_id: string
          recordings_days: number
          transcripts_days: number
          updated_at: string | null
        }
        Insert: {
          email_logs_days?: number
          org_id: string
          recordings_days?: number
          transcripts_days?: number
          updated_at?: string | null
        }
        Update: {
          email_logs_days?: number
          org_id?: string
          recordings_days?: number
          transcripts_days?: number
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "retention_policies_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: true
            referencedRelation: "orgs"
            referencedColumns: ["id"]
          },
        ]
      }
      security_alerts: {
        Row: {
          alert_type: string
          created_at: string | null
          event_data: Json | null
          id: string
          ip_address: unknown | null
          resolved: boolean | null
          severity: string | null
          user_agent: string | null
          user_id: string | null
        }
        Insert: {
          alert_type: string
          created_at?: string | null
          event_data?: Json | null
          id?: string
          ip_address?: unknown | null
          resolved?: boolean | null
          severity?: string | null
          user_agent?: string | null
          user_id?: string | null
        }
        Update: {
          alert_type?: string
          created_at?: string | null
          event_data?: Json | null
          id?: string
          ip_address?: unknown | null
          resolved?: boolean | null
          severity?: string | null
          user_agent?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      security_compliance: {
        Row: {
          check_name: string
          description: string | null
          id: string
          last_checked: string | null
          manual_action_required: boolean | null
          remediation_notes: string | null
          status: string
        }
        Insert: {
          check_name: string
          description?: string | null
          id?: string
          last_checked?: string | null
          manual_action_required?: boolean | null
          remediation_notes?: string | null
          status: string
        }
        Update: {
          check_name?: string
          description?: string | null
          id?: string
          last_checked?: string | null
          manual_action_required?: boolean | null
          remediation_notes?: string | null
          status?: string
        }
        Relationships: []
      }
      subscriptions: {
        Row: {
          created_at: string
          current_period_end: string | null
          id: string
          org_id: string
          plan: string
          status: string
          stripe_customer_id: string
          stripe_subscription_id: string | null
        }
        Insert: {
          created_at?: string
          current_period_end?: string | null
          id?: string
          org_id: string
          plan: string
          status: string
          stripe_customer_id: string
          stripe_subscription_id?: string | null
        }
        Update: {
          created_at?: string
          current_period_end?: string | null
          id?: string
          org_id?: string
          plan?: string
          status?: string
          stripe_customer_id?: string
          stripe_subscription_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "subscriptions_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "orgs"
            referencedColumns: ["id"]
          },
        ]
      }
      support_tickets: {
        Row: {
          created_at: string
          email: string
          id: string
          message: string
          status: string
          subject: string
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
          message: string
          status?: string
          subject: string
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          message?: string
          status?: string
          subject?: string
        }
        Relationships: []
      }
      supported_locales: {
        Row: {
          code: string
          name: string
        }
        Insert: {
          code: string
          name: string
        }
        Update: {
          code?: string
          name?: string
        }
        Relationships: []
      }
      supported_voices: {
        Row: {
          code: string
          display_name: string
          gender: string | null
          locale_code: string
          provider: string
        }
        Insert: {
          code: string
          display_name: string
          gender?: string | null
          locale_code: string
          provider: string
        }
        Update: {
          code?: string
          display_name?: string
          gender?: string | null
          locale_code?: string
          provider?: string
        }
        Relationships: [
          {
            foreignKeyName: "supported_voices_locale_code_fkey"
            columns: ["locale_code"]
            isOneToOne: false
            referencedRelation: "supported_locales"
            referencedColumns: ["code"]
          },
        ]
      }
      transcripts: {
        Row: {
          call_sid: string
          content: string
          created_at: string
          id: string
          org_id: string
        }
        Insert: {
          call_sid: string
          content: string
          created_at?: string
          id?: string
          org_id: string
        }
        Update: {
          call_sid?: string
          content?: string
          created_at?: string
          id?: string
          org_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "transcripts_call_sid_fkey"
            columns: ["call_sid"]
            isOneToOne: false
            referencedRelation: "calls"
            referencedColumns: ["call_sid"]
          },
          {
            foreignKeyName: "transcripts_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      upgrade_audit: {
        Row: {
          check_name: string
          created_at: string | null
          details: Json | null
          id: string
          status: string
          upgrade_phase: string
        }
        Insert: {
          check_name: string
          created_at?: string | null
          details?: Json | null
          id?: string
          status: string
          upgrade_phase: string
        }
        Update: {
          check_name?: string
          created_at?: string | null
          details?: Json | null
          id?: string
          status?: string
          upgrade_phase?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string
          created_by: string | null
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      user_views: {
        Row: {
          created_at: string | null
          id: string
          kind: string
          name: string
          payload: Json
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          kind: string
          name: string
          payload: Json
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          kind?: string
          name?: string
          payload?: Json
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      appointments_safe: {
        Row: {
          created_at: string | null
          end_at: string | null
          id: string | null
          note: string | null
          organization_id: string | null
          source: string | null
          start_at: string | null
          status: string | null
          tz: string | null
        }
        Insert: {
          created_at?: string | null
          end_at?: string | null
          id?: string | null
          note?: string | null
          organization_id?: string | null
          source?: string | null
          start_at?: string | null
          status?: string | null
          tz?: string | null
        }
        Update: {
          created_at?: string | null
          end_at?: string | null
          id?: string | null
          note?: string | null
          organization_id?: string | null
          source?: string | null
          start_at?: string | null
          status?: string | null
          tz?: string | null
        }
        Relationships: []
      }
    }
    Functions: {
      anonymize_ip_address: {
        Args: { ip: unknown }
        Returns: unknown
      }
      can_access_customer_pii: {
        Args: { _user_id: string }
        Returns: boolean
      }
      citext: {
        Args: { "": boolean } | { "": string } | { "": unknown }
        Returns: string
      }
      citext_hash: {
        Args: { "": string }
        Returns: number
      }
      citextin: {
        Args: { "": unknown }
        Returns: string
      }
      citextout: {
        Args: { "": string }
        Returns: unknown
      }
      citextrecv: {
        Args: { "": unknown }
        Returns: string
      }
      citextsend: {
        Args: { "": string }
        Returns: string
      }
      cleanup_old_analytics_events: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      detect_and_alert_anomalies: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      detect_anomalous_access: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      detect_auth_anomalies: {
        Args: {
          p_event_type: string
          p_ip_address: unknown
          p_user_agent: string
          p_user_id: string
        }
        Returns: undefined
      }
      emergency_customer_contact: {
        Args: { appointment_id: string; emergency_reason: string }
        Returns: {
          e164: string
          email: string
          first_name: string
        }[]
      }
      get_appointments_summary: {
        Args: { limit_count?: number; org_id: string }
        Returns: {
          created_at: string
          end_at: string
          has_contact_info: boolean
          id: string
          note: string
          organization_id: string
          source: string
          start_at: string
          status: string
          tz: string
        }[]
      }
      get_customer_contact_info: {
        Args: { appointment_id: string }
        Returns: {
          e164: string
          email: string
          first_name: string
        }[]
      }
      get_latest_consent_status: {
        Args: { p_channel?: string; p_e164?: string }
        Returns: {
          channel: string
          e164: string
          last_change_at: string
          status: string
        }[]
      }
      get_masked_profile: {
        Args: { profile_user_id: string }
        Returns: {
          created_at: string
          full_name: string
          id: string
          phone_e164_masked: string
          updated_at: string
        }[]
      }
      get_org_appointments_secure: {
        Args: { limit_count?: number; org_id: string }
        Returns: {
          created_at: string
          e164_masked: string
          email_masked: string
          end_at: string
          first_name_masked: string
          id: string
          note: string
          organization_id: string
          source: string
          start_at: string
          status: string
          tz: string
        }[]
      }
      get_profile_with_restrictions: {
        Args: { profile_user_id: string }
        Returns: {
          created_at: string
          full_name: string
          id: string
          phone_e164_full: string
          phone_e164_masked: string
          updated_at: string
        }[]
      }
      get_secure_appointment: {
        Args: { appointment_id: string }
        Returns: {
          created_at: string
          e164_masked: string
          email_masked: string
          end_at: string
          first_name_masked: string
          id: string
          note: string
          organization_id: string
          source: string
          start_at: string
          status: string
          tz: string
        }[]
      }
      get_user_role: {
        Args: { _user_id: string }
        Returns: Database["public"]["Enums"]["app_role"]
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_org_member: {
        Args: { p_org_id: string }
        Returns: boolean
      }
      log_analytics_event_secure: {
        Args: {
          p_event_data?: Json
          p_event_type: string
          p_ip_address?: unknown
          p_page_url?: string
          p_user_agent?: string
          p_user_session?: string
        }
        Returns: boolean
      }
      log_auth_attempt: {
        Args: {
          p_event_type: string
          p_ip_address?: unknown
          p_success: boolean
          p_user_agent?: string
          p_user_identifier?: string
        }
        Returns: undefined
      }
      log_data_access: {
        Args: {
          p_access_type?: string
          p_record_id?: string
          p_table_name: string
        }
        Returns: undefined
      }
      log_data_export: {
        Args: {
          p_export_type: string
          p_filters?: Json
          p_record_count: number
          p_table_name: string
          p_user_id: string
        }
        Returns: undefined
      }
      log_security_event: {
        Args: {
          p_event_data?: Json
          p_event_type: string
          p_session_id?: string
          p_severity?: string
          p_user_id?: string
        }
        Returns: undefined
      }
      log_security_event_enhanced: {
        Args: {
          p_event_data?: Json
          p_event_type: string
          p_ip_address?: unknown
          p_session_id?: string
          p_severity?: string
          p_user_agent?: string
          p_user_id?: string
        }
        Returns: undefined
      }
      log_upgrade_step: {
        Args: {
          p_details?: Json
          p_phase: string
          p_status: string
          p_step: string
        }
        Returns: undefined
      }
      mask_phone_number: {
        Args: { phone_e164: string; requesting_user_id: string }
        Returns: string
      }
      monitor_upgrade_health: {
        Args: Record<PropertyKey, never>
        Returns: {
          component: string
          details: string
          last_check: string
          status: string
        }[]
      }
      process_event: {
        Args: {
          p_call_sid: string
          p_idempotency_key: string
          p_kind: string
          p_org_id: string
          p_payload: Json
        }
        Returns: undefined
      }
      resolve_greeting: {
        Args: { p_phone_e164: string }
        Returns: string
      }
      safe_analytics_insert_with_circuit_breaker: {
        Args: {
          p_event_data?: Json
          p_event_type: string
          p_ip_address?: unknown
          p_page_url?: string
          p_user_agent?: string
          p_user_session?: string
        }
        Returns: boolean
      }
      schedule_analytics_cleanup: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      share_org: {
        Args: { _user_a: string; _user_b: string }
        Returns: boolean
      }
      validate_security_post_upgrade: {
        Args: Record<PropertyKey, never>
        Returns: Json
      }
    }
    Enums: {
      app_role: "admin" | "user" | "moderator"
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
      app_role: ["admin", "user", "moderator"],
    },
  },
} as const
