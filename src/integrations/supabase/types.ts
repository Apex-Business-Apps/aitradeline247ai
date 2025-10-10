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
          converted: boolean
          created_at: string
          id: string
          test_name: string
          updated_at: string
          user_session: string
          variant: string
        }
        Insert: {
          converted?: boolean
          created_at?: string
          id?: string
          test_name: string
          updated_at?: string
          user_session: string
          variant: string
        }
        Update: {
          converted?: boolean
          created_at?: string
          id?: string
          test_name?: string
          updated_at?: string
          user_session?: string
          variant?: string
        }
        Relationships: []
      }
      ab_tests: {
        Row: {
          active: boolean
          created_at: string
          id: string
          test_name: string
          traffic_split: Json
          updated_at: string
          variants: Json
        }
        Insert: {
          active?: boolean
          created_at?: string
          id?: string
          test_name: string
          traffic_split?: Json
          updated_at?: string
          variants?: Json
        }
        Update: {
          active?: boolean
          created_at?: string
          id?: string
          test_name?: string
          traffic_split?: Json
          updated_at?: string
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
          ip_address: unknown | null
          session_id: string | null
          severity: string | null
          user_agent: string | null
          user_id: string | null
          user_session: string | null
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
          user_session?: string | null
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
          user_session?: string | null
        }
        Relationships: []
      }
      app_config: {
        Row: {
          created_at: string
          key_name: string
          key_value: string
          rotated_at: string | null
          updated_at: string
          version: number
        }
        Insert: {
          created_at?: string
          key_name: string
          key_value: string
          rotated_at?: string | null
          updated_at?: string
          version?: number
        }
        Update: {
          created_at?: string
          key_name?: string
          key_value?: string
          rotated_at?: string | null
          updated_at?: string
          version?: number
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
          e164_encrypted: string | null
          email: string | null
          email_encrypted: string | null
          end_at: string
          first_name: string | null
          first_name_encrypted: string | null
          id: string
          note: string | null
          organization_id: string | null
          pii_iv: string | null
          source: string
          start_at: string
          status: string
          tz: string
        }
        Insert: {
          created_at?: string
          e164: string
          e164_encrypted?: string | null
          email?: string | null
          email_encrypted?: string | null
          end_at: string
          first_name?: string | null
          first_name_encrypted?: string | null
          id?: string
          note?: string | null
          organization_id?: string | null
          pii_iv?: string | null
          source?: string
          start_at: string
          status?: string
          tz?: string
        }
        Update: {
          created_at?: string
          e164?: string
          e164_encrypted?: string | null
          email?: string | null
          email_encrypted?: string | null
          end_at?: string
          first_name?: string | null
          first_name_encrypted?: string | null
          id?: string
          note?: string | null
          organization_id?: string | null
          pii_iv?: string | null
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
      business_profiles: {
        Row: {
          booking_rules: Json
          brand_voice: Json
          business_name: string
          compliance: Json
          created_at: string
          escalation: Json
          faq: Json
          hours: Json
          id: string
          industry: string
          organization_id: string
          service_area: string | null
          timezone: string
          updated_at: string
        }
        Insert: {
          booking_rules?: Json
          brand_voice?: Json
          business_name: string
          compliance?: Json
          created_at?: string
          escalation?: Json
          faq?: Json
          hours?: Json
          id?: string
          industry: string
          organization_id: string
          service_area?: string | null
          timezone?: string
          updated_at?: string
        }
        Update: {
          booking_rules?: Json
          brand_voice?: Json
          business_name?: string
          compliance?: Json
          created_at?: string
          escalation?: Json
          faq?: Json
          hours?: Json
          id?: string
          industry?: string
          organization_id?: string
          service_area?: string | null
          timezone?: string
          updated_at?: string
        }
        Relationships: []
      }
      buyer_path_sends: {
        Row: {
          event_type: string
          id: string
          sent_at: string
          user_id: string
        }
        Insert: {
          event_type: string
          id?: string
          sent_at?: string
          user_id: string
        }
        Update: {
          event_type?: string
          id?: string
          sent_at?: string
          user_id?: string
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
      call_logs: {
        Row: {
          amd_detected: boolean | null
          call_sid: string
          capture_completeness: number | null
          captured_fields: Json | null
          consent_given: boolean | null
          created_at: string
          duration_sec: number | null
          ended_at: string | null
          fail_path: string | null
          from_e164: string
          handoff: boolean | null
          handoff_reason: string | null
          human_answered: boolean | null
          id: string
          llm_session_id: string | null
          mode: string | null
          organization_id: string | null
          pickup_mode: string | null
          recording_url: string | null
          ring_attempted: boolean | null
          ring_seconds: number | null
          started_at: string
          status: string
          summary: string | null
          to_e164: string
          transcript: string | null
          transcript_url: string | null
          updated_at: string
        }
        Insert: {
          amd_detected?: boolean | null
          call_sid: string
          capture_completeness?: number | null
          captured_fields?: Json | null
          consent_given?: boolean | null
          created_at?: string
          duration_sec?: number | null
          ended_at?: string | null
          fail_path?: string | null
          from_e164: string
          handoff?: boolean | null
          handoff_reason?: string | null
          human_answered?: boolean | null
          id?: string
          llm_session_id?: string | null
          mode?: string | null
          organization_id?: string | null
          pickup_mode?: string | null
          recording_url?: string | null
          ring_attempted?: boolean | null
          ring_seconds?: number | null
          started_at?: string
          status?: string
          summary?: string | null
          to_e164: string
          transcript?: string | null
          transcript_url?: string | null
          updated_at?: string
        }
        Update: {
          amd_detected?: boolean | null
          call_sid?: string
          capture_completeness?: number | null
          captured_fields?: Json | null
          consent_given?: boolean | null
          created_at?: string
          duration_sec?: number | null
          ended_at?: string | null
          fail_path?: string | null
          from_e164?: string
          handoff?: boolean | null
          handoff_reason?: string | null
          human_answered?: boolean | null
          id?: string
          llm_session_id?: string | null
          mode?: string | null
          organization_id?: string | null
          pickup_mode?: string | null
          recording_url?: string | null
          ring_attempted?: boolean | null
          ring_seconds?: number | null
          started_at?: string
          status?: string
          summary?: string | null
          to_e164?: string
          transcript?: string | null
          transcript_url?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "call_logs_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
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
      campaign_followups: {
        Row: {
          campaign_id: string
          created_at: string
          followup_number: number
          halted_reason: string | null
          id: string
          member_id: string
          scheduled_at: string
          sent_at: string | null
          status: string
        }
        Insert: {
          campaign_id: string
          created_at?: string
          followup_number?: number
          halted_reason?: string | null
          id?: string
          member_id: string
          scheduled_at: string
          sent_at?: string | null
          status?: string
        }
        Update: {
          campaign_id?: string
          created_at?: string
          followup_number?: number
          halted_reason?: string | null
          id?: string
          member_id?: string
          scheduled_at?: string
          sent_at?: string | null
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "campaign_followups_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "campaigns"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "campaign_followups_member_id_fkey"
            columns: ["member_id"]
            isOneToOne: false
            referencedRelation: "campaign_members"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "campaign_followups_member_id_fkey"
            columns: ["member_id"]
            isOneToOne: false
            referencedRelation: "v_sendable_members"
            referencedColumns: ["member_id"]
          },
        ]
      }
      campaign_members: {
        Row: {
          campaign_id: string
          created_at: string
          error_message: string | null
          id: string
          lead_id: string
          sent_at: string | null
          status: string
        }
        Insert: {
          campaign_id: string
          created_at?: string
          error_message?: string | null
          id?: string
          lead_id: string
          sent_at?: string | null
          status?: string
        }
        Update: {
          campaign_id?: string
          created_at?: string
          error_message?: string | null
          id?: string
          lead_id?: string
          sent_at?: string | null
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "campaign_members_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "campaigns"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "campaign_members_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
        ]
      }
      campaigns: {
        Row: {
          body_template: string
          consent_basis_filter: string[]
          created_at: string
          id: string
          name: string
          organization_id: string
          status: string
          subject: string
          updated_at: string
        }
        Insert: {
          body_template: string
          consent_basis_filter?: string[]
          created_at?: string
          id?: string
          name: string
          organization_id: string
          status?: string
          subject: string
          updated_at?: string
        }
        Update: {
          body_template?: string
          consent_basis_filter?: string[]
          created_at?: string
          id?: string
          name?: string
          organization_id?: string
          status?: string
          subject?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "campaigns_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      command_execution_results: {
        Row: {
          command_id: string
          content_id: string
          content_type: Database["public"]["Enums"]["embedding_content_type"]
          created_at: string
          error_message: string | null
          id: string
          success: boolean
        }
        Insert: {
          command_id: string
          content_id: string
          content_type: Database["public"]["Enums"]["embedding_content_type"]
          created_at?: string
          error_message?: string | null
          id?: string
          success: boolean
        }
        Update: {
          command_id?: string
          content_id?: string
          content_type?: Database["public"]["Enums"]["embedding_content_type"]
          created_at?: string
          error_message?: string | null
          id?: string
          success?: boolean
        }
        Relationships: [
          {
            foreignKeyName: "command_execution_results_command_id_fkey"
            columns: ["command_id"]
            isOneToOne: false
            referencedRelation: "semantic_commands"
            referencedColumns: ["id"]
          },
        ]
      }
      command_execution_tokens: {
        Row: {
          command_id: string
          created_at: string
          expires_at: string
          id: string
          plan_data: Json
          token: string
          used: boolean
          used_at: string | null
        }
        Insert: {
          command_id: string
          created_at?: string
          expires_at?: string
          id?: string
          plan_data: Json
          token?: string
          used?: boolean
          used_at?: string | null
        }
        Update: {
          command_id?: string
          created_at?: string
          expires_at?: string
          id?: string
          plan_data?: Json
          token?: string
          used?: boolean
          used_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "command_execution_tokens_command_id_fkey"
            columns: ["command_id"]
            isOneToOne: false
            referencedRelation: "semantic_commands"
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
      contact_messages: {
        Row: {
          created_at: string
          email: string
          id: string
          ip_address: unknown | null
          message: string
          name: string
          phone: string | null
          subject: string | null
          user_agent: string | null
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
          ip_address?: unknown | null
          message: string
          name: string
          phone?: string | null
          subject?: string | null
          user_agent?: string | null
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          ip_address?: unknown | null
          message?: string
          name?: string
          phone?: string | null
          subject?: string | null
          user_agent?: string | null
        }
        Relationships: []
      }
      contacts: {
        Row: {
          created_at: string
          e164: string
          e164_encrypted: string | null
          first_name: string | null
          first_name_encrypted: string | null
          id: string
          organization_id: string | null
          wa_capable: boolean | null
        }
        Insert: {
          created_at?: string
          e164: string
          e164_encrypted?: string | null
          first_name?: string | null
          first_name_encrypted?: string | null
          id?: string
          organization_id?: string | null
          wa_capable?: boolean | null
        }
        Update: {
          created_at?: string
          e164?: string
          e164_encrypted?: string | null
          first_name?: string | null
          first_name_encrypted?: string | null
          id?: string
          organization_id?: string | null
          wa_capable?: boolean | null
        }
        Relationships: [
          {
            foreignKeyName: "contacts_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      content_embeddings: {
        Row: {
          content_date: string | null
          content_id: string
          content_summary: string | null
          content_text: string
          content_type: Database["public"]["Enums"]["embedding_content_type"]
          created_at: string
          embedding: string
          id: string
          metadata: Json | null
          organization_id: string | null
          user_id: string | null
        }
        Insert: {
          content_date?: string | null
          content_id: string
          content_summary?: string | null
          content_text: string
          content_type: Database["public"]["Enums"]["embedding_content_type"]
          created_at?: string
          embedding: string
          id?: string
          metadata?: Json | null
          organization_id?: string | null
          user_id?: string | null
        }
        Update: {
          content_date?: string | null
          content_id?: string
          content_summary?: string | null
          content_text?: string
          content_type?: Database["public"]["Enums"]["embedding_content_type"]
          created_at?: string
          embedding?: string
          id?: string
          metadata?: Json | null
          organization_id?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "content_embeddings_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      content_folders: {
        Row: {
          created_at: string
          description: string | null
          id: string
          name: string
          organization_id: string
          parent_folder_id: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          name: string
          organization_id: string
          parent_folder_id?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          name?: string
          organization_id?: string
          parent_folder_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "content_folders_parent_folder_id_fkey"
            columns: ["parent_folder_id"]
            isOneToOne: false
            referencedRelation: "content_folders"
            referencedColumns: ["id"]
          },
        ]
      }
      content_tag_assignments: {
        Row: {
          content_id: string
          content_type: Database["public"]["Enums"]["embedding_content_type"]
          created_at: string
          id: string
          organization_id: string
          tag_id: string
        }
        Insert: {
          content_id: string
          content_type: Database["public"]["Enums"]["embedding_content_type"]
          created_at?: string
          id?: string
          organization_id: string
          tag_id: string
        }
        Update: {
          content_id?: string
          content_type?: Database["public"]["Enums"]["embedding_content_type"]
          created_at?: string
          id?: string
          organization_id?: string
          tag_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "content_tag_assignments_tag_id_fkey"
            columns: ["tag_id"]
            isOneToOne: false
            referencedRelation: "content_tags"
            referencedColumns: ["id"]
          },
        ]
      }
      content_tags: {
        Row: {
          color: string | null
          created_at: string
          id: string
          name: string
          organization_id: string
        }
        Insert: {
          color?: string | null
          created_at?: string
          id?: string
          name: string
          organization_id: string
        }
        Update: {
          color?: string | null
          created_at?: string
          id?: string
          name?: string
          organization_id?: string
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
      encryption_errors: {
        Row: {
          appointment_id: string | null
          created_at: string
          error_message: string
          error_type: string
          function_name: string
          id: string
          metadata: Json | null
        }
        Insert: {
          appointment_id?: string | null
          created_at?: string
          error_message: string
          error_type: string
          function_name: string
          id?: string
          metadata?: Json | null
        }
        Update: {
          appointment_id?: string | null
          created_at?: string
          error_message?: string
          error_type?: string
          function_name?: string
          id?: string
          metadata?: Json | null
        }
        Relationships: []
      }
      encryption_key_audit: {
        Row: {
          action: string
          created_at: string
          from_version: number | null
          id: string
          metadata: Json | null
          reason: string | null
          to_version: number | null
          user_role: string
        }
        Insert: {
          action: string
          created_at?: string
          from_version?: number | null
          id?: string
          metadata?: Json | null
          reason?: string | null
          to_version?: number | null
          user_role: string
        }
        Update: {
          action?: string
          created_at?: string
          from_version?: number | null
          id?: string
          metadata?: Json | null
          reason?: string | null
          to_version?: number | null
          user_role?: string
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
      guardian_autoheal_actions: {
        Row: {
          action_type: string
          created_at: string
          id: string
          metadata: Json | null
          mode: string
          status: string
          trigger_reason: string
        }
        Insert: {
          action_type: string
          created_at?: string
          id?: string
          metadata?: Json | null
          mode?: string
          status: string
          trigger_reason: string
        }
        Update: {
          action_type?: string
          created_at?: string
          id?: string
          metadata?: Json | null
          mode?: string
          status?: string
          trigger_reason?: string
        }
        Relationships: []
      }
      guardian_circuit_breaker_events: {
        Row: {
          created_at: string
          failure_count: number
          id: string
          metadata: Json | null
          previous_state: string | null
          reason: string | null
          service_name: string
          state: string
          success_count: number
        }
        Insert: {
          created_at?: string
          failure_count?: number
          id?: string
          metadata?: Json | null
          previous_state?: string | null
          reason?: string | null
          service_name: string
          state: string
          success_count?: number
        }
        Update: {
          created_at?: string
          failure_count?: number
          id?: string
          metadata?: Json | null
          previous_state?: string | null
          reason?: string | null
          service_name?: string
          state?: string
          success_count?: number
        }
        Relationships: []
      }
      guardian_concurrency_locks: {
        Row: {
          acquired_at: string
          lock_key: string
          lock_ttl_seconds: number
          worker_id: string
        }
        Insert: {
          acquired_at?: string
          lock_key: string
          lock_ttl_seconds?: number
          worker_id: string
        }
        Update: {
          acquired_at?: string
          lock_key?: string
          lock_ttl_seconds?: number
          worker_id?: string
        }
        Relationships: []
      }
      guardian_config: {
        Row: {
          key: string
          updated_at: string
          value: Json
        }
        Insert: {
          key: string
          updated_at?: string
          value: Json
        }
        Update: {
          key?: string
          updated_at?: string
          value?: Json
        }
        Relationships: []
      }
      guardian_synthetic_checks: {
        Row: {
          check_run_id: string
          check_type: string
          created_at: string
          error_message: string | null
          id: string
          response_time_ms: number | null
          status_code: number | null
          success: boolean
          target_id: string
          target_url: string
          validation_results: Json | null
        }
        Insert: {
          check_run_id: string
          check_type: string
          created_at?: string
          error_message?: string | null
          id?: string
          response_time_ms?: number | null
          status_code?: number | null
          success: boolean
          target_id: string
          target_url: string
          validation_results?: Json | null
        }
        Update: {
          check_run_id?: string
          check_type?: string
          created_at?: string
          error_message?: string | null
          id?: string
          response_time_ms?: number | null
          status_code?: number | null
          success?: boolean
          target_id?: string
          target_url?: string
          validation_results?: Json | null
        }
        Relationships: []
      }
      hotline_allowlist: {
        Row: {
          added_by: string | null
          created_at: string
          e164: string
          label: string | null
        }
        Insert: {
          added_by?: string | null
          created_at?: string
          e164: string
          label?: string | null
        }
        Update: {
          added_by?: string | null
          created_at?: string
          e164?: string
          label?: string | null
        }
        Relationships: []
      }
      hotline_call_sessions: {
        Row: {
          ani_hash: string
          call_sid: string
          call_status: string
          completed_at: string | null
          consent_given: boolean | null
          created_at: string
          id: string
          language: string
          route_taken: string | null
        }
        Insert: {
          ani_hash: string
          call_sid: string
          call_status: string
          completed_at?: string | null
          consent_given?: boolean | null
          created_at?: string
          id?: string
          language?: string
          route_taken?: string | null
        }
        Update: {
          ani_hash?: string
          call_sid?: string
          call_status?: string
          completed_at?: string | null
          consent_given?: boolean | null
          created_at?: string
          id?: string
          language?: string
          route_taken?: string | null
        }
        Relationships: []
      }
      hotline_consent_audit: {
        Row: {
          ani_hash: string
          call_sid: string
          consent_status: string
          created_at: string
          dtmf_input: string | null
          id: string
          language: string
        }
        Insert: {
          ani_hash: string
          call_sid: string
          consent_status: string
          created_at?: string
          dtmf_input?: string | null
          id?: string
          language: string
        }
        Update: {
          ani_hash?: string
          call_sid?: string
          consent_status?: string
          created_at?: string
          dtmf_input?: string | null
          id?: string
          language?: string
        }
        Relationships: []
      }
      hotline_geo_config: {
        Row: {
          key: string
          updated_at: string
          value: Json
        }
        Insert: {
          key: string
          updated_at?: string
          value: Json
        }
        Update: {
          key?: string
          updated_at?: string
          value?: Json
        }
        Relationships: []
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
      hotline_rate_limit_ani: {
        Row: {
          ani_hash: string
          block_count: number
          block_until: string | null
          created_at: string
          id: string
          request_count: number
          updated_at: string
          window_start: string
        }
        Insert: {
          ani_hash: string
          block_count?: number
          block_until?: string | null
          created_at?: string
          id?: string
          request_count?: number
          updated_at?: string
          window_start?: string
        }
        Update: {
          ani_hash?: string
          block_count?: number
          block_until?: string | null
          created_at?: string
          id?: string
          request_count?: number
          updated_at?: string
          window_start?: string
        }
        Relationships: []
      }
      hotline_rate_limit_ip: {
        Row: {
          block_count: number
          block_until: string | null
          created_at: string
          id: string
          ip_hash: string
          request_count: number
          updated_at: string
          window_start: string
        }
        Insert: {
          block_count?: number
          block_until?: string | null
          created_at?: string
          id?: string
          ip_hash: string
          request_count?: number
          updated_at?: string
          window_start?: string
        }
        Update: {
          block_count?: number
          block_until?: string | null
          created_at?: string
          id?: string
          ip_hash?: string
          request_count?: number
          updated_at?: string
          window_start?: string
        }
        Relationships: []
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
      leads: {
        Row: {
          company: string
          country: string | null
          created_at: string
          email: string
          id: string
          lead_score: number | null
          name: string
          notes: string | null
          phone: string | null
          source: string
          updated_at: string
        }
        Insert: {
          company: string
          country?: string | null
          created_at?: string
          email: string
          id?: string
          lead_score?: number | null
          name: string
          notes?: string | null
          phone?: string | null
          source?: string
          updated_at?: string
        }
        Update: {
          company?: string
          country?: string | null
          created_at?: string
          email?: string
          id?: string
          lead_score?: number | null
          name?: string
          notes?: string | null
          phone?: string | null
          source?: string
          updated_at?: string
        }
        Relationships: []
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
      messaging_compliance: {
        Row: {
          a2p_status: string
          brand_sid: string | null
          campaign_sid: string | null
          created_at: string
          messaging_service_sid: string | null
          organization_id: string
          updated_at: string
          us_enabled: boolean
        }
        Insert: {
          a2p_status?: string
          brand_sid?: string | null
          campaign_sid?: string | null
          created_at?: string
          messaging_service_sid?: string | null
          organization_id: string
          updated_at?: string
          us_enabled?: boolean
        }
        Update: {
          a2p_status?: string
          brand_sid?: string | null
          campaign_sid?: string | null
          created_at?: string
          messaging_service_sid?: string | null
          organization_id?: string
          updated_at?: string
          us_enabled?: boolean
        }
        Relationships: [
          {
            foreignKeyName: "messaging_compliance_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: true
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      org_integration_secrets: {
        Row: {
          created_at: string
          gcal_service: Json | null
          organization_id: string
          slack_webhook_url: string | null
          teams_webhook_url: string | null
          updated_at: string
          zap_outgoing_url: string | null
        }
        Insert: {
          created_at?: string
          gcal_service?: Json | null
          organization_id: string
          slack_webhook_url?: string | null
          teams_webhook_url?: string | null
          updated_at?: string
          zap_outgoing_url?: string | null
        }
        Update: {
          created_at?: string
          gcal_service?: Json | null
          organization_id?: string
          slack_webhook_url?: string | null
          teams_webhook_url?: string | null
          updated_at?: string
          zap_outgoing_url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "org_integration_secrets_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: true
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      org_settings: {
        Row: {
          business_hours: Json | null
          calendly_url: string | null
          emergency_number: string | null
          language: string | null
          organization_id: string
          updated_at: string
          voice_id: string | null
        }
        Insert: {
          business_hours?: Json | null
          calendly_url?: string | null
          emergency_number?: string | null
          language?: string | null
          organization_id: string
          updated_at?: string
          voice_id?: string | null
        }
        Update: {
          business_hours?: Json | null
          calendly_url?: string | null
          emergency_number?: string | null
          language?: string | null
          organization_id?: string
          updated_at?: string
          voice_id?: string | null
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
      performance_metrics: {
        Row: {
          created_at: string | null
          id: string
          metadata: Json | null
          metric_name: string
          metric_unit: string | null
          metric_value: number
          user_agent: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          metadata?: Json | null
          metric_name: string
          metric_unit?: string | null
          metric_value: number
          user_agent?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          metadata?: Json | null
          metric_name?: string
          metric_unit?: string | null
          metric_value?: number
          user_agent?: string | null
        }
        Relationships: []
      }
      profiles: {
        Row: {
          created_at: string
          full_name: string | null
          full_name_encrypted: string | null
          id: string
          phone_e164: string | null
          phone_e164_encrypted: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          full_name?: string | null
          full_name_encrypted?: string | null
          id: string
          phone_e164?: string | null
          phone_e164_encrypted?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          full_name?: string | null
          full_name_encrypted?: string | null
          id?: string
          phone_e164?: string | null
          phone_e164_encrypted?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      rag_chunks: {
        Row: {
          chunk_index: number
          created_at: string | null
          id: string
          meta: Json | null
          source_id: string
          text: string
          token_count: number | null
          updated_at: string | null
        }
        Insert: {
          chunk_index: number
          created_at?: string | null
          id?: string
          meta?: Json | null
          source_id: string
          text: string
          token_count?: number | null
          updated_at?: string | null
        }
        Update: {
          chunk_index?: number
          created_at?: string | null
          id?: string
          meta?: Json | null
          source_id?: string
          text?: string
          token_count?: number | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "rag_chunks_source_id_fkey"
            columns: ["source_id"]
            isOneToOne: false
            referencedRelation: "rag_sources"
            referencedColumns: ["id"]
          },
        ]
      }
      rag_embeddings: {
        Row: {
          chunk_id: string
          created_at: string | null
          embedding: string
          id: string
          meta: Json | null
          norm: number | null
        }
        Insert: {
          chunk_id: string
          created_at?: string | null
          embedding: string
          id?: string
          meta?: Json | null
          norm?: number | null
        }
        Update: {
          chunk_id?: string
          created_at?: string | null
          embedding?: string
          id?: string
          meta?: Json | null
          norm?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "rag_embeddings_chunk_id_fkey"
            columns: ["chunk_id"]
            isOneToOne: true
            referencedRelation: "rag_chunks"
            referencedColumns: ["id"]
          },
        ]
      }
      rag_sources: {
        Row: {
          created_at: string | null
          external_id: string
          id: string
          lang: string | null
          meta: Json | null
          source_type: Database["public"]["Enums"]["rag_source_type"]
          title: string | null
          updated_at: string | null
          uri: string | null
        }
        Insert: {
          created_at?: string | null
          external_id: string
          id?: string
          lang?: string | null
          meta?: Json | null
          source_type: Database["public"]["Enums"]["rag_source_type"]
          title?: string | null
          updated_at?: string | null
          uri?: string | null
        }
        Update: {
          created_at?: string | null
          external_id?: string
          id?: string
          lang?: string | null
          meta?: Json | null
          source_type?: Database["public"]["Enums"]["rag_source_type"]
          title?: string | null
          updated_at?: string | null
          uri?: string | null
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
        Relationships: []
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
      semantic_commands: {
        Row: {
          command_embedding: string | null
          command_text: string
          confidence: number
          created_at: string
          error_message: string | null
          executed_at: string | null
          execution_time_ms: number | null
          id: string
          metadata: Json | null
          operation: string
          organization_id: string
          status: string
          target_count: number
          user_id: string
        }
        Insert: {
          command_embedding?: string | null
          command_text: string
          confidence: number
          created_at?: string
          error_message?: string | null
          executed_at?: string | null
          execution_time_ms?: number | null
          id?: string
          metadata?: Json | null
          operation: string
          organization_id: string
          status?: string
          target_count?: number
          user_id: string
        }
        Update: {
          command_embedding?: string | null
          command_text?: string
          confidence?: number
          created_at?: string
          error_message?: string | null
          executed_at?: string | null
          execution_time_ms?: number | null
          id?: string
          metadata?: Json | null
          operation?: string
          organization_id?: string
          status?: string
          target_count?: number
          user_id?: string
        }
        Relationships: []
      }
      sms_consent: {
        Row: {
          business_relationship: string | null
          consent_method: string | null
          consent_source: string | null
          created_at: string
          e164: string
          id: string
          opted_in: boolean
          opted_in_at: string | null
          opted_out_at: string | null
          updated_at: string
        }
        Insert: {
          business_relationship?: string | null
          consent_method?: string | null
          consent_source?: string | null
          created_at?: string
          e164: string
          id?: string
          opted_in?: boolean
          opted_in_at?: string | null
          opted_out_at?: string | null
          updated_at?: string
        }
        Update: {
          business_relationship?: string | null
          consent_method?: string | null
          consent_source?: string | null
          created_at?: string
          e164?: string
          id?: string
          opted_in?: boolean
          opted_in_at?: string | null
          opted_out_at?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      sms_delivery_log: {
        Row: {
          body_preview: string | null
          created_at: string
          error_code: string | null
          error_message: string | null
          from_e164: string | null
          id: string
          message_sid: string
          num_segments: number | null
          price: number | null
          price_unit: string | null
          status: string
          status_updated_at: string
          to_e164: string
          updated_at: string
        }
        Insert: {
          body_preview?: string | null
          created_at?: string
          error_code?: string | null
          error_message?: string | null
          from_e164?: string | null
          id?: string
          message_sid: string
          num_segments?: number | null
          price?: number | null
          price_unit?: string | null
          status: string
          status_updated_at?: string
          to_e164: string
          updated_at?: string
        }
        Update: {
          body_preview?: string | null
          created_at?: string
          error_code?: string | null
          error_message?: string | null
          from_e164?: string | null
          id?: string
          message_sid?: string
          num_segments?: number | null
          price?: number | null
          price_unit?: string | null
          status?: string
          status_updated_at?: string
          to_e164?: string
          updated_at?: string
        }
        Relationships: []
      }
      sms_reply_logs: {
        Row: {
          body: string | null
          created_at: string
          external_id: string
          from_e164: string
          id: string
          message_sid: string
          source: string
          to_e164: string
        }
        Insert: {
          body?: string | null
          created_at?: string
          external_id: string
          from_e164: string
          id?: string
          message_sid: string
          source?: string
          to_e164: string
        }
        Update: {
          body?: string | null
          created_at?: string
          external_id?: string
          from_e164?: string
          id?: string
          message_sid?: string
          source?: string
          to_e164?: string
        }
        Relationships: []
      }
      sms_status_logs: {
        Row: {
          created_at: string
          error_code: string | null
          error_message: string | null
          message_sid: string
          status: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          error_code?: string | null
          error_message?: string | null
          message_sid: string
          status: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          error_code?: string | null
          error_message?: string | null
          message_sid?: string
          status?: string
          updated_at?: string
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
          stripe_customer_id: string | null
          stripe_subscription_id: string | null
        }
        Insert: {
          created_at?: string
          current_period_end?: string | null
          id?: string
          org_id: string
          plan: string
          status: string
          stripe_customer_id?: string | null
          stripe_subscription_id?: string | null
        }
        Update: {
          created_at?: string
          current_period_end?: string | null
          id?: string
          org_id?: string
          plan?: string
          status?: string
          stripe_customer_id?: string | null
          stripe_subscription_id?: string | null
        }
        Relationships: []
      }
      support_ticket_rate_limits: {
        Row: {
          created_at: string
          id: string
          identifier: string
          identifier_type: string
          ticket_count: number
          window_start: string
        }
        Insert: {
          created_at?: string
          id?: string
          identifier: string
          identifier_type: string
          ticket_count?: number
          window_start?: string
        }
        Update: {
          created_at?: string
          id?: string
          identifier?: string
          identifier_type?: string
          ticket_count?: number
          window_start?: string
        }
        Relationships: []
      }
      support_tickets: {
        Row: {
          created_at: string
          email: string
          id: string
          message: string
          status: string
          subject: string
          user_id: string | null
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
          message: string
          status?: string
          subject: string
          user_id?: string | null
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          message?: string
          status?: string
          subject?: string
          user_id?: string | null
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
      system_prompts: {
        Row: {
          created_at: string
          created_by: string | null
          id: string
          is_active: boolean
          name: string
          organization_id: string | null
          prompt: string
          version: number
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          id?: string
          is_active?: boolean
          name: string
          organization_id?: string | null
          prompt: string
          version?: number
        }
        Update: {
          created_at?: string
          created_by?: string | null
          id?: string
          is_active?: boolean
          name?: string
          organization_id?: string | null
          prompt?: string
          version?: number
        }
        Relationships: [
          {
            foreignKeyName: "system_prompts_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      transcripts: {
        Row: {
          archived: boolean | null
          archived_at: string | null
          call_sid: string
          content: string
          created_at: string
          folder_id: string | null
          id: string
          org_id: string
          priority: string | null
        }
        Insert: {
          archived?: boolean | null
          archived_at?: string | null
          call_sid: string
          content: string
          created_at?: string
          folder_id?: string | null
          id?: string
          org_id: string
          priority?: string | null
        }
        Update: {
          archived?: boolean | null
          archived_at?: string | null
          call_sid?: string
          content?: string
          created_at?: string
          folder_id?: string | null
          id?: string
          org_id?: string
          priority?: string | null
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
            foreignKeyName: "transcripts_folder_id_fkey"
            columns: ["folder_id"]
            isOneToOne: false
            referencedRelation: "content_folders"
            referencedColumns: ["id"]
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
      twilio_buy_number_logs: {
        Row: {
          created_at: string
          error_message: string | null
          id: string
          number_e164: string
          organization_id: string
          phone_sid: string
          subaccount_sid: string | null
          success: boolean
        }
        Insert: {
          created_at?: string
          error_message?: string | null
          id?: string
          number_e164: string
          organization_id: string
          phone_sid: string
          subaccount_sid?: string | null
          success: boolean
        }
        Update: {
          created_at?: string
          error_message?: string | null
          id?: string
          number_e164?: string
          organization_id?: string
          phone_sid?: string
          subaccount_sid?: string | null
          success?: boolean
        }
        Relationships: [
          {
            foreignKeyName: "twilio_buy_number_logs_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      twilio_endpoints: {
        Row: {
          call_status_callback: string
          created_at: string
          number_e164: string
          organization_id: string
          phone_sid: string
          sms_status_callback: string
          sms_url: string
          stream_enabled: boolean
          subaccount_sid: string | null
          updated_at: string
          voice_url: string
        }
        Insert: {
          call_status_callback: string
          created_at?: string
          number_e164: string
          organization_id: string
          phone_sid: string
          sms_status_callback: string
          sms_url: string
          stream_enabled?: boolean
          subaccount_sid?: string | null
          updated_at?: string
          voice_url: string
        }
        Update: {
          call_status_callback?: string
          created_at?: string
          number_e164?: string
          organization_id?: string
          phone_sid?: string
          sms_status_callback?: string
          sms_url?: string
          stream_enabled?: boolean
          subaccount_sid?: string | null
          updated_at?: string
          voice_url?: string
        }
        Relationships: [
          {
            foreignKeyName: "twilio_endpoints_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      twilio_numbers: {
        Row: {
          capabilities: Json | null
          created_at: string
          friendly_name: string | null
          is_active: boolean | null
          organization_id: string | null
          phone_e164: string
          sms_url: string | null
          updated_at: string
          voice_status_callback: string | null
          voice_url: string | null
        }
        Insert: {
          capabilities?: Json | null
          created_at?: string
          friendly_name?: string | null
          is_active?: boolean | null
          organization_id?: string | null
          phone_e164: string
          sms_url?: string | null
          updated_at?: string
          voice_status_callback?: string | null
          voice_url?: string | null
        }
        Update: {
          capabilities?: Json | null
          created_at?: string
          friendly_name?: string | null
          is_active?: boolean | null
          organization_id?: string | null
          phone_e164?: string
          sms_url?: string | null
          updated_at?: string
          voice_status_callback?: string | null
          voice_url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "twilio_numbers_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      unsubscribes: {
        Row: {
          created_at: string
          email: string
          reason: string | null
          source: string | null
        }
        Insert: {
          created_at?: string
          email: string
          reason?: string | null
          source?: string | null
        }
        Update: {
          created_at?: string
          email?: string
          reason?: string | null
          source?: string | null
        }
        Relationships: []
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
      user_sessions: {
        Row: {
          created_at: string
          expires_at: string
          id: string
          is_active: boolean
          last_activity: string
          session_token: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          expires_at: string
          id?: string
          is_active?: boolean
          last_activity: string
          session_token: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          expires_at?: string
          id?: string
          is_active?: boolean
          last_activity?: string
          session_token?: string
          updated_at?: string
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
      voice_config: {
        Row: {
          active_preset_id: string | null
          amd_enable: boolean | null
          business_name: string | null
          created_at: string
          fail_open: boolean | null
          human_number_e164: string | null
          llm_enabled: boolean | null
          llm_max_reply_seconds: number | null
          llm_speaking_rate: number | null
          llm_voice: string | null
          max_ring_reroutes: number | null
          organization_id: string
          pickup_mode: string
          pickup_seconds: number | null
          ring_target: string | null
          ringback_tone: string | null
          rings_before_pickup: number | null
          system_prompt: string | null
          updated_at: string
        }
        Insert: {
          active_preset_id?: string | null
          amd_enable?: boolean | null
          business_name?: string | null
          created_at?: string
          fail_open?: boolean | null
          human_number_e164?: string | null
          llm_enabled?: boolean | null
          llm_max_reply_seconds?: number | null
          llm_speaking_rate?: number | null
          llm_voice?: string | null
          max_ring_reroutes?: number | null
          organization_id: string
          pickup_mode?: string
          pickup_seconds?: number | null
          ring_target?: string | null
          ringback_tone?: string | null
          rings_before_pickup?: number | null
          system_prompt?: string | null
          updated_at?: string
        }
        Update: {
          active_preset_id?: string | null
          amd_enable?: boolean | null
          business_name?: string | null
          created_at?: string
          fail_open?: boolean | null
          human_number_e164?: string | null
          llm_enabled?: boolean | null
          llm_max_reply_seconds?: number | null
          llm_speaking_rate?: number | null
          llm_voice?: string | null
          max_ring_reroutes?: number | null
          organization_id?: string
          pickup_mode?: string
          pickup_seconds?: number | null
          ring_target?: string | null
          ringback_tone?: string | null
          rings_before_pickup?: number | null
          system_prompt?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "voice_config_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: true
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      voice_config_audit: {
        Row: {
          action: string
          changes: Json
          created_at: string
          id: string
          organization_id: string
          reason: string | null
          user_id: string | null
        }
        Insert: {
          action: string
          changes: Json
          created_at?: string
          id?: string
          organization_id: string
          reason?: string | null
          user_id?: string | null
        }
        Update: {
          action?: string
          changes?: Json
          created_at?: string
          id?: string
          organization_id?: string
          reason?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "voice_config_audit_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      voice_presets: {
        Row: {
          created_at: string
          description: string | null
          id: string
          label: string
          max_reply_seconds: number | null
          speaking_rate: number | null
          system_prompt: string
          voice: string | null
        }
        Insert: {
          created_at?: string
          description?: string | null
          id: string
          label: string
          max_reply_seconds?: number | null
          speaking_rate?: number | null
          system_prompt: string
          voice?: string | null
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          label?: string
          max_reply_seconds?: number | null
          speaking_rate?: number | null
          system_prompt?: string
          voice?: string | null
        }
        Relationships: []
      }
      voice_stream_logs: {
        Row: {
          call_sid: string
          connected_at: string | null
          created_at: string
          elapsed_ms: number | null
          error_message: string | null
          fell_back: boolean
          started_at: string
        }
        Insert: {
          call_sid: string
          connected_at?: string | null
          created_at?: string
          elapsed_ms?: number | null
          error_message?: string | null
          fell_back?: boolean
          started_at?: string
        }
        Update: {
          call_sid?: string
          connected_at?: string | null
          created_at?: string
          elapsed_ms?: number | null
          error_message?: string | null
          fell_back?: boolean
          started_at?: string
        }
        Relationships: []
      }
      voice_transcripts: {
        Row: {
          call_sid: string
          captured_fields: Json | null
          created_at: string
          drift_flagged: boolean | null
          drift_reason: string | null
          id: string
          kb_sources: string[] | null
          model_output: string | null
          transcript: string
          used_kb: boolean | null
        }
        Insert: {
          call_sid: string
          captured_fields?: Json | null
          created_at?: string
          drift_flagged?: boolean | null
          drift_reason?: string | null
          id?: string
          kb_sources?: string[] | null
          model_output?: string | null
          transcript: string
          used_kb?: boolean | null
        }
        Update: {
          call_sid?: string
          captured_fields?: Json | null
          created_at?: string
          drift_flagged?: boolean | null
          drift_reason?: string | null
          id?: string
          kb_sources?: string[] | null
          model_output?: string | null
          transcript?: string
          used_kb?: boolean | null
        }
        Relationships: []
      }
    }
    Views: {
      appointments_safe: {
        Row: {
          created_at: string | null
          e164_masked: string | null
          email_masked: string | null
          end_at: string | null
          first_name_masked: string | null
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
          e164_masked?: never
          email_masked?: never
          end_at?: string | null
          first_name_masked?: never
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
          e164_masked?: never
          email_masked?: never
          end_at?: string | null
          first_name_masked?: never
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
      profiles_safe: {
        Row: {
          created_at: string | null
          full_name_masked: string | null
          id: string | null
          phone_e164_masked: string | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          full_name_masked?: never
          id?: string | null
          phone_e164_masked?: never
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          full_name_masked?: never
          id?: string | null
          phone_e164_masked?: never
          updated_at?: string | null
        }
        Relationships: []
      }
      support_tickets_secure: {
        Row: {
          created_at: string | null
          email: string | null
          id: string | null
          message: string | null
          status: string | null
          subject: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          email?: never
          id?: string | null
          message?: string | null
          status?: string | null
          subject?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          email?: never
          id?: string | null
          message?: string | null
          status?: string | null
          subject?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      v_sendable_members: {
        Row: {
          body_template: string | null
          campaign_id: string | null
          company: string | null
          email: string | null
          lead_id: string | null
          member_id: string | null
          name: string | null
          organization_id: string | null
          subject: string | null
        }
        Relationships: [
          {
            foreignKeyName: "campaign_members_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "campaigns"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "campaign_members_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "campaigns_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Functions: {
      acquire_guardian_lock: {
        Args: {
          p_lock_key: string
          p_ttl_seconds?: number
          p_worker_id: string
        }
        Returns: boolean
      }
      anonymize_ip_address: {
        Args: { ip: unknown }
        Returns: unknown
      }
      batch_encrypt_appointments: {
        Args:
          | { batch_size?: number }
          | { p_batch_size?: number; p_encryption_key?: string }
        Returns: {
          batch_duration_seconds: number
          encrypted_count: number
          failed_count: number
        }[]
      }
      binary_quantize: {
        Args: { "": string } | { "": unknown }
        Returns: unknown
      }
      can_access_customer_pii: {
        Args: { _user_id: string }
        Returns: boolean
      }
      can_view_appointment_summary: {
        Args: { org_id_param: string }
        Returns: boolean
      }
      check_encryption_health: {
        Args: Record<PropertyKey, never>
        Returns: {
          encrypted_records: number
          failed_records: number
          health_status: string
          missing_iv_records: number
          total_records: number
        }[]
      }
      check_hotline_geo: {
        Args: { p_e164: string }
        Returns: Json
      }
      check_hotline_rate_limit: {
        Args: { p_ani_hash: string; p_ip_hash: string }
        Returns: Json
      }
      check_rag_health: {
        Args: Record<PropertyKey, never>
        Returns: {
          chunks_without_embeddings: number
          health_status: string
          last_ingestion: string
          total_chunks: number
          total_embeddings: number
          total_sources: number
        }[]
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
      cleanup_expired_sessions: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      cleanup_expired_tokens: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      cleanup_hotline_rate_limits: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      cleanup_old_ab_sessions: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      cleanup_old_analytics_events: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      cleanup_rate_limits: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      decrypt_pii: {
        Args: { ciphertext: string }
        Returns: string
      }
      decrypt_pii_with_iv_logged: {
        Args: {
          appointment_id?: string
          encrypted_data: string
          iv_data: string
        }
        Returns: string
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
      encrypt_pii: {
        Args: { plaintext: string }
        Returns: string
      }
      encrypt_pii_field: {
        Args: { iv_seed: string; plaintext_value: string }
        Returns: string
      }
      get_app_encryption_key: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      get_appointment_pii_secure: {
        Args: { access_reason: string; appointment_id_param: string }
        Returns: {
          e164: string
          email: string
          end_at: string
          first_name: string
          id: string
          organization_id: string
          start_at: string
          status: string
        }[]
      }
      get_appointment_summary_secure: {
        Args: { org_id_param?: string }
        Returns: {
          created_at: string
          end_at: string
          has_customer_info: boolean
          id: string
          note: string
          organization_id: string
          source: string
          start_at: string
          status: string
          tz: string
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
      get_contact_pii_secure: {
        Args: { access_reason: string; contact_id_param: string }
        Returns: {
          created_at: string
          e164: string
          first_name: string
          id: string
          organization_id: string
          wa_capable: boolean
        }[]
      }
      get_contact_summary_secure: {
        Args: { contact_id_param: string }
        Returns: {
          created_at: string
          first_name: string
          id: string
          organization_id: string
          phone_masked: string
          wa_capable: boolean
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
      get_dashboard_data_optimized: {
        Args: Record<PropertyKey, never>
        Returns: Json
      }
      get_failed_auth_summary: {
        Args: { time_window?: unknown }
        Returns: {
          recent_failures: Json
          top_ip: string
          total_failures: number
          unique_ips: number
          unique_users: number
        }[]
      }
      get_guardian_metrics: {
        Args: { p_end_time: string; p_start_time: string }
        Returns: Json
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
      get_my_security_summary: {
        Args: Record<PropertyKey, never>
        Returns: Json
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
      get_performance_insights: {
        Args: Record<PropertyKey, never>
        Returns: {
          avg_value: number
          max_value: number
          metric_name: string
          min_value: number
          sample_count: number
          time_period: string
        }[]
      }
      get_pii_access_summary: {
        Args: { time_window?: unknown }
        Returns: {
          by_access_type: Json
          by_table: Json
          recent_accesses: Json
          total_accesses: number
          unique_users: number
        }[]
      }
      get_profile_masked: {
        Args: { profile_user_id: string }
        Returns: {
          created_at: string
          full_name_masked: string
          id: string
          phone_e164_masked: string
          updated_at: string
        }[]
      }
      get_profile_pii_emergency: {
        Args: { access_reason: string; profile_user_id: string }
        Returns: {
          created_at: string
          full_name: string
          id: string
          phone_e164: string
          updated_at: string
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
      get_rate_limit_stats: {
        Args: { time_window?: unknown }
        Returns: {
          active_blocks: number
          hotline_ani_blocks: number
          hotline_ip_blocks: number
          support_ticket_limits: number
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
      get_security_alerts_summary: {
        Args: { time_window?: unknown }
        Returns: {
          by_type: Json
          critical_alerts: number
          high_alerts: number
          recent_alerts: Json
          total_alerts: number
          unresolved_alerts: number
        }[]
      }
      get_security_dashboard_data: {
        Args: Record<PropertyKey, never>
        Returns: Json
      }
      get_sms_delivery_stats: {
        Args: { hours_ago?: number }
        Returns: {
          common_errors: Json
          delivered: number
          delivery_rate: number
          failed: number
          pending: number
          total_messages: number
        }[]
      }
      get_transcript_secure: {
        Args: { transcript_id: string }
        Returns: {
          archived: boolean
          archived_at: string
          call_sid: string
          content: string
          created_at: string
          folder_id: string
          id: string
          org_id: string
          priority: string
        }[]
      }
      get_user_role: {
        Args: { _user_id: string }
        Returns: Database["public"]["Enums"]["app_role"]
      }
      get_variant_display_data: {
        Args: { p_test_name: string; p_variant: string }
        Returns: Json
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
      has_role_with_fallback: {
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
      is_autoheal_allowed: {
        Args: { p_action_type: string }
        Returns: boolean
      }
      is_hotline_allowlisted: {
        Args: { p_e164: string }
        Returns: boolean
      }
      is_opted_in: {
        Args: { phone_e164: string }
        Returns: boolean
      }
      is_org_member: {
        Args: { p_org_id: string }
        Returns: boolean
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
        Returns: unknown
      }
      log_ab_test_access: {
        Args: { p_access_type?: string; p_test_name: string; p_variant: string }
        Returns: undefined
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
      log_performance_metric: {
        Args: {
          p_metadata?: Json
          p_metric_name: string
          p_metric_unit?: string
          p_metric_value: number
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
      mask_email: {
        Args: { email_address: string; requesting_user_id: string }
        Returns: string
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
      rag_match: {
        Args: { filter?: Json; query_vector: string; top_k?: number }
        Returns: {
          chunk_id: string
          meta: Json
          score: number
          snippet: string
          source_id: string
          source_type: string
          uri: string
        }[]
      }
      rag_stats: {
        Args: Record<PropertyKey, never>
        Returns: {
          chunk_count: number
          embedded_count: number
          last_ingestion: string
          source_count: number
          source_type: string
        }[]
      }
      rag_upsert_source: {
        Args: {
          p_external_id: string
          p_lang?: string
          p_meta?: Json
          p_source_type: Database["public"]["Enums"]["rag_source_type"]
          p_title?: string
          p_uri?: string
        }
        Returns: string
      }
      record_opt_in: {
        Args: {
          method?: string
          phone_e164: string
          relationship?: string
          source?: string
        }
        Returns: undefined
      }
      record_opt_out: {
        Args: { phone_e164: string }
        Returns: undefined
      }
      release_guardian_lock: {
        Args: { p_lock_key: string; p_worker_id: string }
        Returns: boolean
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
      search_embeddings: {
        Args: {
          filter_content_type?: Database["public"]["Enums"]["embedding_content_type"]
          filter_date_from?: string
          filter_date_to?: string
          filter_org_id?: string
          filter_user_id?: string
          match_count?: number
          match_threshold?: number
          query_embedding: string
        }
        Returns: {
          content_id: string
          content_summary: string
          content_text: string
          content_type: Database["public"]["Enums"]["embedding_content_type"]
          created_at: string
          id: string
          metadata: Json
          similarity: number
        }[]
      }
      secure_rate_limit: {
        Args: {
          identifier: string
          max_requests: number
          window_seconds: number
        }
        Returns: Json
      }
      share_org: {
        Args: { _user_a: string; _user_b: string }
        Returns: boolean
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
      test_encryption_roundtrip: {
        Args: Record<PropertyKey, never>
        Returns: {
          details: string
          passed: boolean
          test_name: string
        }[]
      }
      validate_security_post_upgrade: {
        Args: Record<PropertyKey, never>
        Returns: Json
      }
      validate_session: {
        Args: { p_session_token: string; p_user_id: string }
        Returns: Json
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
      verify_email_service_configured: {
        Args: Record<PropertyKey, never>
        Returns: boolean
      }
    }
    Enums: {
      app_role: "admin" | "user" | "moderator"
      embedding_content_type:
        | "email"
        | "transcript"
        | "thread"
        | "appointment"
        | "note"
      rag_source_type: "transcript" | "email" | "doc" | "faq" | "web"
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
      embedding_content_type: [
        "email",
        "transcript",
        "thread",
        "appointment",
        "note",
      ],
      rag_source_type: ["transcript", "email", "doc", "faq", "web"],
    },
  },
} as const
