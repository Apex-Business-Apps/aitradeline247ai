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
      bookings: {
        Row: {
          created_at: string | null
          customer_name: string | null
          datetime: string | null
          id: string
          service: string | null
          status: string | null
        }
        Insert: {
          created_at?: string | null
          customer_name?: string | null
          datetime?: string | null
          id?: string
          service?: string | null
          status?: string | null
        }
        Update: {
          created_at?: string | null
          customer_name?: string | null
          datetime?: string | null
          id?: string
          service?: string | null
          status?: string | null
        }
        Relationships: []
      }
      calls: {
        Row: {
          call_sid: string
          caller_e164: string | null
          org_id: string
          started_at: string | null
          status: string | null
        }
        Insert: {
          call_sid: string
          caller_e164?: string | null
          org_id: string
          started_at?: string | null
          status?: string | null
        }
        Update: {
          call_sid?: string
          caller_e164?: string | null
          org_id?: string
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
      mvp_dlq: {
        Row: {
          event_id: string
          failed_at: string | null
          last_error: string | null
          payload: Json | null
          source: string
          type: string | null
        }
        Insert: {
          event_id: string
          failed_at?: string | null
          last_error?: string | null
          payload?: Json | null
          source: string
          type?: string | null
        }
        Update: {
          event_id?: string
          failed_at?: string | null
          last_error?: string | null
          payload?: Json | null
          source?: string
          type?: string | null
        }
        Relationships: []
      }
      mvp_inbox_events: {
        Row: {
          error: string | null
          id: string
          payload: Json
          processed_at: string | null
          received_at: string | null
          source: string
          status: string | null
          type: string
        }
        Insert: {
          error?: string | null
          id: string
          payload: Json
          processed_at?: string | null
          received_at?: string | null
          source: string
          status?: string | null
          type: string
        }
        Update: {
          error?: string | null
          id?: string
          payload?: Json
          processed_at?: string | null
          received_at?: string | null
          source?: string
          status?: string | null
          type?: string
        }
        Relationships: []
      }
      mvp_jobs: {
        Row: {
          attempts: number | null
          event_id: string
          job_id: number
          locked_at: string | null
          locked_by: string | null
          max_attempts: number | null
          run_after: string | null
          source: string
          task: string
        }
        Insert: {
          attempts?: number | null
          event_id: string
          job_id?: number
          locked_at?: string | null
          locked_by?: string | null
          max_attempts?: number | null
          run_after?: string | null
          source: string
          task: string
        }
        Update: {
          attempts?: number | null
          event_id?: string
          job_id?: number
          locked_at?: string | null
          locked_by?: string | null
          max_attempts?: number | null
          run_after?: string | null
          source?: string
          task?: string
        }
        Relationships: [
          {
            foreignKeyName: "mvp_jobs_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "mvp_inbox_events"
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
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
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
      is_org_member: {
        Args: { p_org_id: string }
        Returns: boolean
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
    }
    Enums: {
      [_ in never]: never
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
    Enums: {},
  },
} as const
