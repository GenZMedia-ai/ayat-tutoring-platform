export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      audit_logs: {
        Row: {
          action_type: string
          created_at: string | null
          id: string
          ip_address: unknown | null
          metadata: Json | null
          new_values: Json | null
          old_values: Json | null
          target_id: string | null
          target_type: string
          user_agent: string | null
          user_id: string | null
        }
        Insert: {
          action_type: string
          created_at?: string | null
          id?: string
          ip_address?: unknown | null
          metadata?: Json | null
          new_values?: Json | null
          old_values?: Json | null
          target_id?: string | null
          target_type: string
          user_agent?: string | null
          user_id?: string | null
        }
        Update: {
          action_type?: string
          created_at?: string | null
          id?: string
          ip_address?: unknown | null
          metadata?: Json | null
          new_values?: Json | null
          old_values?: Json | null
          target_id?: string | null
          target_type?: string
          user_agent?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "audit_logs_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      currencies: {
        Row: {
          code: string
          created_at: string
          id: string
          is_enabled: boolean | null
          name: string
          symbol: string
        }
        Insert: {
          code: string
          created_at?: string
          id?: string
          is_enabled?: boolean | null
          name: string
          symbol: string
        }
        Update: {
          code?: string
          created_at?: string
          id?: string
          is_enabled?: boolean | null
          name?: string
          symbol?: string
        }
        Relationships: []
      }
      family_groups: {
        Row: {
          assigned_sales_agent_id: string
          assigned_supervisor_id: string | null
          assigned_teacher_id: string | null
          country: string
          created_at: string
          id: string
          notes: string | null
          parent_name: string
          phone: string
          platform: string
          status: string
          student_count: number
          teacher_type: string
          trial_date: string | null
          trial_time: string | null
          unique_id: string
          updated_at: string
        }
        Insert: {
          assigned_sales_agent_id: string
          assigned_supervisor_id?: string | null
          assigned_teacher_id?: string | null
          country: string
          created_at?: string
          id?: string
          notes?: string | null
          parent_name: string
          phone: string
          platform: string
          status?: string
          student_count?: number
          teacher_type: string
          trial_date?: string | null
          trial_time?: string | null
          unique_id: string
          updated_at?: string
        }
        Update: {
          assigned_sales_agent_id?: string
          assigned_supervisor_id?: string | null
          assigned_teacher_id?: string | null
          country?: string
          created_at?: string
          id?: string
          notes?: string | null
          parent_name?: string
          phone?: string
          platform?: string
          status?: string
          student_count?: number
          teacher_type?: string
          trial_date?: string | null
          trial_time?: string | null
          unique_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "fk_family_groups_assigned_sales_agent"
            columns: ["assigned_sales_agent_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_family_groups_assigned_supervisor"
            columns: ["assigned_supervisor_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_family_groups_assigned_teacher"
            columns: ["assigned_teacher_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      family_package_selections: {
        Row: {
          created_at: string
          currency: string
          custom_price: number | null
          family_group_id: string
          id: string
          notes: string | null
          package_id: string
          selected_by: string
          student_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          currency?: string
          custom_price?: number | null
          family_group_id: string
          id?: string
          notes?: string | null
          package_id: string
          selected_by: string
          student_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          currency?: string
          custom_price?: number | null
          family_group_id?: string
          id?: string
          notes?: string | null
          package_id?: string
          selected_by?: string
          student_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "family_package_selections_family_group_id_fkey"
            columns: ["family_group_id"]
            isOneToOne: false
            referencedRelation: "family_groups"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "family_package_selections_package_id_fkey"
            columns: ["package_id"]
            isOneToOne: false
            referencedRelation: "packages"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "family_package_selections_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: true
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
        ]
      }
      invitation_codes: {
        Row: {
          code: string
          created_at: string
          created_by: string
          expires_at: string | null
          id: string
          is_active: boolean | null
          role: string
          usage_limit: number | null
          used_count: number | null
        }
        Insert: {
          code: string
          created_at?: string
          created_by: string
          expires_at?: string | null
          id?: string
          is_active?: boolean | null
          role: string
          usage_limit?: number | null
          used_count?: number | null
        }
        Update: {
          code?: string
          created_at?: string
          created_by?: string
          expires_at?: string | null
          id?: string
          is_active?: boolean | null
          role?: string
          usage_limit?: number | null
          used_count?: number | null
        }
        Relationships: []
      }
      notification_logs: {
        Row: {
          error_message: string | null
          event_type: string
          id: string
          notification_data: Json
          notification_id: string | null
          recipient_phone: string | null
          recipient_type: string
          sent_at: string | null
          success: boolean | null
        }
        Insert: {
          error_message?: string | null
          event_type: string
          id?: string
          notification_data: Json
          notification_id?: string | null
          recipient_phone?: string | null
          recipient_type: string
          sent_at?: string | null
          success?: boolean | null
        }
        Update: {
          error_message?: string | null
          event_type?: string
          id?: string
          notification_data?: Json
          notification_id?: string | null
          recipient_phone?: string | null
          recipient_type?: string
          sent_at?: string | null
          success?: boolean | null
        }
        Relationships: []
      }
      notification_settings: {
        Row: {
          created_at: string | null
          description: string | null
          id: string
          setting_key: string
          setting_value: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          id?: string
          setting_key: string
          setting_value: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          id?: string
          setting_key?: string
          setting_value?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      packages: {
        Row: {
          created_at: string
          created_by: string
          description: string
          id: string
          is_active: boolean | null
          name: string
          price: number
          session_count: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by: string
          description: string
          id?: string
          is_active?: boolean | null
          name: string
          price: number
          session_count: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string
          description?: string
          id?: string
          is_active?: boolean | null
          name?: string
          price?: number
          session_count?: number
          updated_at?: string
        }
        Relationships: []
      }
      payment_links: {
        Row: {
          amount: number
          clicked_at: string | null
          created_at: string
          created_by: string
          currency: string
          expires_at: string
          family_group_id: string | null
          id: string
          individual_amounts: Json | null
          package_id: string | null
          package_selections: Json | null
          package_session_count: number | null
          paid_at: string | null
          payment_type: string | null
          status: string
          stripe_session_id: string | null
          student_ids: string[]
          total_amount: number | null
          updated_at: string
        }
        Insert: {
          amount: number
          clicked_at?: string | null
          created_at?: string
          created_by: string
          currency?: string
          expires_at: string
          family_group_id?: string | null
          id?: string
          individual_amounts?: Json | null
          package_id?: string | null
          package_selections?: Json | null
          package_session_count?: number | null
          paid_at?: string | null
          payment_type?: string | null
          status?: string
          stripe_session_id?: string | null
          student_ids: string[]
          total_amount?: number | null
          updated_at?: string
        }
        Update: {
          amount?: number
          clicked_at?: string | null
          created_at?: string
          created_by?: string
          currency?: string
          expires_at?: string
          family_group_id?: string | null
          id?: string
          individual_amounts?: Json | null
          package_id?: string | null
          package_selections?: Json | null
          package_session_count?: number | null
          paid_at?: string | null
          payment_type?: string | null
          status?: string
          stripe_session_id?: string | null
          student_ids?: string[]
          total_amount?: number | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "payment_links_family_group_id_fkey"
            columns: ["family_group_id"]
            isOneToOne: false
            referencedRelation: "family_groups"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          approved_at: string | null
          approved_by: string | null
          created_at: string
          email: string
          full_name: string
          id: string
          language: string
          last_booked_at: string | null
          phone: string
          role: string
          status: string
          teacher_type: string | null
          telegram_chat_id: string | null
          telegram_linked_at: string | null
          telegram_user_id: string | null
          telegram_username: string | null
          telegram_verified: boolean | null
          updated_at: string
        }
        Insert: {
          approved_at?: string | null
          approved_by?: string | null
          created_at?: string
          email: string
          full_name: string
          id: string
          language?: string
          last_booked_at?: string | null
          phone: string
          role: string
          status?: string
          teacher_type?: string | null
          telegram_chat_id?: string | null
          telegram_linked_at?: string | null
          telegram_user_id?: string | null
          telegram_username?: string | null
          telegram_verified?: boolean | null
          updated_at?: string
        }
        Update: {
          approved_at?: string | null
          approved_by?: string | null
          created_at?: string
          email?: string
          full_name?: string
          id?: string
          language?: string
          last_booked_at?: string | null
          phone?: string
          role?: string
          status?: string
          teacher_type?: string | null
          telegram_chat_id?: string | null
          telegram_linked_at?: string | null
          telegram_user_id?: string | null
          telegram_username?: string | null
          telegram_verified?: boolean | null
          updated_at?: string
        }
        Relationships: []
      }
      sales_followups: {
        Row: {
          completed: boolean
          completed_at: string | null
          created_at: string
          created_by: string | null
          family_group_id: string | null
          id: string
          notes: string | null
          outcome: string | null
          reason: string
          sales_agent_id: string
          scheduled_date: string
          scheduled_time: string | null
          student_id: string
          updated_at: string
        }
        Insert: {
          completed?: boolean
          completed_at?: string | null
          created_at?: string
          created_by?: string | null
          family_group_id?: string | null
          id?: string
          notes?: string | null
          outcome?: string | null
          reason: string
          sales_agent_id: string
          scheduled_date: string
          scheduled_time?: string | null
          student_id: string
          updated_at?: string
        }
        Update: {
          completed?: boolean
          completed_at?: string | null
          created_at?: string
          created_by?: string | null
          family_group_id?: string | null
          id?: string
          notes?: string | null
          outcome?: string | null
          reason?: string
          sales_agent_id?: string
          scheduled_date?: string
          scheduled_time?: string | null
          student_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "fk_sales_followups_sales_agent"
            columns: ["sales_agent_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_sales_followups_student"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sales_followups_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sales_followups_family_group_id_fkey"
            columns: ["family_group_id"]
            isOneToOne: false
            referencedRelation: "family_groups"
            referencedColumns: ["id"]
          },
        ]
      }
      session_students: {
        Row: {
          created_at: string
          id: string
          session_id: string
          student_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          session_id: string
          student_id: string
        }
        Update: {
          created_at?: string
          id?: string
          session_id?: string
          student_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "session_students_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "sessions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "session_students_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
        ]
      }
      sessions: {
        Row: {
          actual_minutes: number | null
          completed_at: string | null
          created_at: string
          id: string
          idempotency_key: string | null
          notes: string | null
          original_date: string | null
          original_time: string | null
          reschedule_count: number
          reschedule_reason: string | null
          scheduled_date: string
          scheduled_time: string
          session_number: number
          status: string
          trial_outcome: string | null
          trial_outcome_notes: string | null
          trial_outcome_submitted_at: string | null
          trial_outcome_submitted_by: string | null
          updated_at: string
        }
        Insert: {
          actual_minutes?: number | null
          completed_at?: string | null
          created_at?: string
          id?: string
          idempotency_key?: string | null
          notes?: string | null
          original_date?: string | null
          original_time?: string | null
          reschedule_count?: number
          reschedule_reason?: string | null
          scheduled_date: string
          scheduled_time: string
          session_number?: number
          status?: string
          trial_outcome?: string | null
          trial_outcome_notes?: string | null
          trial_outcome_submitted_at?: string | null
          trial_outcome_submitted_by?: string | null
          updated_at?: string
        }
        Update: {
          actual_minutes?: number | null
          completed_at?: string | null
          created_at?: string
          id?: string
          idempotency_key?: string | null
          notes?: string | null
          original_date?: string | null
          original_time?: string | null
          reschedule_count?: number
          reschedule_reason?: string | null
          scheduled_date?: string
          scheduled_time?: string
          session_number?: number
          status?: string
          trial_outcome?: string | null
          trial_outcome_notes?: string | null
          trial_outcome_submitted_at?: string | null
          trial_outcome_submitted_by?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      students: {
        Row: {
          age: number
          assigned_sales_agent_id: string
          assigned_supervisor_id: string | null
          assigned_teacher_id: string | null
          country: string
          created_at: string
          family_group_id: string | null
          id: string
          name: string
          notes: string | null
          package_name: string | null
          package_session_count: number | null
          parent_name: string | null
          payment_amount: number | null
          payment_currency: string | null
          phone: string
          platform: string
          status: string
          teacher_type: string
          trial_date: string | null
          trial_time: string | null
          unique_id: string
          updated_at: string
        }
        Insert: {
          age: number
          assigned_sales_agent_id: string
          assigned_supervisor_id?: string | null
          assigned_teacher_id?: string | null
          country: string
          created_at?: string
          family_group_id?: string | null
          id?: string
          name: string
          notes?: string | null
          package_name?: string | null
          package_session_count?: number | null
          parent_name?: string | null
          payment_amount?: number | null
          payment_currency?: string | null
          phone: string
          platform: string
          status?: string
          teacher_type: string
          trial_date?: string | null
          trial_time?: string | null
          unique_id: string
          updated_at?: string
        }
        Update: {
          age?: number
          assigned_sales_agent_id?: string
          assigned_supervisor_id?: string | null
          assigned_teacher_id?: string | null
          country?: string
          created_at?: string
          family_group_id?: string | null
          id?: string
          name?: string
          notes?: string | null
          package_name?: string | null
          package_session_count?: number | null
          parent_name?: string | null
          payment_amount?: number | null
          payment_currency?: string | null
          phone?: string
          platform?: string
          status?: string
          teacher_type?: string
          trial_date?: string | null
          trial_time?: string | null
          unique_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "fk_students_assigned_sales_agent"
            columns: ["assigned_sales_agent_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_students_assigned_supervisor"
            columns: ["assigned_supervisor_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_students_assigned_teacher"
            columns: ["assigned_teacher_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_students_family_group"
            columns: ["family_group_id"]
            isOneToOne: false
            referencedRelation: "family_groups"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "students_family_group_id_fkey"
            columns: ["family_group_id"]
            isOneToOne: false
            referencedRelation: "family_groups"
            referencedColumns: ["id"]
          },
        ]
      }
      teacher_availability: {
        Row: {
          created_at: string
          date: string
          id: string
          is_available: boolean | null
          is_booked: boolean | null
          student_id: string | null
          teacher_id: string
          time_slot: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          date: string
          id?: string
          is_available?: boolean | null
          is_booked?: boolean | null
          student_id?: string | null
          teacher_id: string
          time_slot: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          date?: string
          id?: string
          is_available?: boolean | null
          is_booked?: boolean | null
          student_id?: string | null
          teacher_id?: string
          time_slot?: string
          updated_at?: string
        }
        Relationships: []
      }
      telegram_verification_codes: {
        Row: {
          code: string
          created_at: string | null
          expires_at: string
          id: string
          used: boolean | null
          user_id: string
        }
        Insert: {
          code: string
          created_at?: string | null
          expires_at: string
          id?: string
          used?: boolean | null
          user_id: string
        }
        Update: {
          code?: string
          created_at?: string | null
          expires_at?: string
          id?: string
          used?: boolean | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "telegram_verification_codes_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      trial_outcomes: {
        Row: {
          created_at: string
          id: string
          outcome: string
          recommended_package: string | null
          session_id: string | null
          student_behavior: string | null
          student_id: string
          submitted_at: string
          submitted_by: string
          teacher_notes: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          outcome: string
          recommended_package?: string | null
          session_id?: string | null
          student_behavior?: string | null
          student_id: string
          submitted_at?: string
          submitted_by: string
          teacher_notes?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          outcome?: string
          recommended_package?: string | null
          session_id?: string | null
          student_behavior?: string | null
          student_id?: string
          submitted_at?: string
          submitted_by?: string
          teacher_notes?: string | null
        }
        Relationships: []
      }
      whatsapp_contacts: {
        Row: {
          attempt_number: number
          contact_type: string
          contacted_at: string
          contacted_by: string
          created_at: string
          id: string
          notes: string | null
          student_id: string
          success: boolean
        }
        Insert: {
          attempt_number?: number
          contact_type?: string
          contacted_at?: string
          contacted_by: string
          created_at?: string
          id?: string
          notes?: string | null
          student_id: string
          success?: boolean
        }
        Update: {
          attempt_number?: number
          contact_type?: string
          contacted_at?: string
          contacted_by?: string
          created_at?: string
          id?: string
          notes?: string | null
          student_id?: string
          success?: boolean
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      approve_user_with_audit: {
        Args: { p_user_id: string }
        Returns: Json
      }
      assign_teacher_round_robin: {
        Args: {
          teacher_type_param: string
          trial_date_param: string
          trial_time_param: string
        }
        Returns: string
      }
      book_family_trial_session: {
        Args: {
          p_booking_data: Json
          p_selected_date: string
          p_utc_start_time: string
          p_teacher_type: string
          p_teacher_id: string
        }
        Returns: Json
      }
      calculate_family_payment_total: {
        Args: { p_family_group_id: string }
        Returns: Json
      }
      check_subscription_completion: {
        Args: { p_student_id: string }
        Returns: Json
      }
      check_telegram_verification_status: {
        Args: { p_user_id: string }
        Returns: Json
      }
      complete_session_with_details: {
        Args: {
          p_session_id: string
          p_actual_minutes: number
          p_learning_notes: string
          p_attendance_confirmed?: boolean
        }
        Returns: Json
      }
      complete_student_registration: {
        Args: { p_student_id: string; p_session_data: Json }
        Returns: Json
      }
      complete_telegram_setup: {
        Args: {
          p_token: string
          p_telegram_id: string
          p_chat_id?: number
          p_username?: string
        }
        Returns: Json
      }
      confirm_trial: {
        Args: { p_student_id: string }
        Returns: Json
      }
      create_sales_followup: {
        Args: {
          p_scheduled_date: string
          p_scheduled_time: string
          p_reason: string
          p_sales_agent_id: string
          p_student_id?: string
          p_family_group_id?: string
          p_notes?: string
        }
        Returns: Json
      }
      ensure_family_session_links: {
        Args: Record<PropertyKey, never>
        Returns: Json
      }
      generate_family_unique_id: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      generate_student_unique_id: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      generate_telegram_verification_code: {
        Args: { p_user_id: string }
        Returns: string
      }
      get_complete_user_profile: {
        Args: { p_user_id: string }
        Returns: Json
      }
      get_egypt_current_date: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      get_enriched_student_data: {
        Args: { p_student_id: string }
        Returns: Json
      }
      get_enriched_student_data_v2: {
        Args: { p_student_id: string }
        Returns: Json
      }
      get_notification_setting: {
        Args: { p_setting_key: string }
        Returns: string
      }
      get_teacher_paid_students: {
        Args: { p_teacher_id: string }
        Returns: {
          id: string
          unique_id: string
          name: string
          age: number
          phone: string
          country: string
          platform: string
          parent_name: string
          package_session_count: number
          payment_amount: number
          payment_currency: string
          payment_date: string
          notes: string
        }[]
      }
      get_user_role: {
        Args: { user_id: string }
        Returns: string
      }
      get_user_status: {
        Args: { user_id: string }
        Returns: string
      }
      is_admin: {
        Args: { user_id: string }
        Returns: boolean
      }
      is_current_user_teacher: {
        Args: Record<PropertyKey, never>
        Returns: boolean
      }
      log_audit_action: {
        Args: {
          p_action_type: string
          p_target_type: string
          p_target_id?: string
          p_old_values?: Json
          p_new_values?: Json
          p_metadata?: Json
        }
        Returns: string
      }
      log_booking_operation: {
        Args: {
          p_operation_type: string
          p_availability_id: string
          p_teacher_id: string
          p_date: string
          p_time_slot: string
          p_success: boolean
          p_error_message?: string
        }
        Returns: undefined
      }
      log_whatsapp_contact: {
        Args: {
          p_student_id: string
          p_contact_type?: string
          p_success?: boolean
          p_notes?: string
        }
        Returns: Json
      }
      prepare_notification_payload: {
        Args: {
          p_event_type: string
          p_recipient_user_id: string
          p_student_id?: string
          p_additional_data?: Json
        }
        Returns: Json
      }
      record_invitation_code_usage: {
        Args: { p_code: string; p_user_id: string }
        Returns: Json
      }
      reject_user_with_audit: {
        Args: { p_user_id: string; p_reason: string }
        Returns: Json
      }
      search_available_teachers: {
        Args: {
          p_date: string
          p_start_time: string
          p_end_time: string
          p_teacher_types: string[]
        }
        Returns: {
          teacher_id: string
          teacher_name: string
          teacher_type: string
          time_slot: string
          availability_id: string
        }[]
      }
      send_n8n_notification: {
        Args: { p_event_type: string; p_notification_data: Json }
        Returns: Json
      }
      simple_book_trial_session: {
        Args: {
          p_booking_data: Json
          p_is_multi_student: boolean
          p_selected_date: string
          p_utc_start_time: string
          p_teacher_type: string
          p_teacher_id: string
        }
        Returns: Json
      }
      submit_trial_outcome: {
        Args: {
          p_student_id: string
          p_session_id: string
          p_outcome: string
          p_teacher_notes?: string
          p_student_behavior?: string
          p_recommended_package?: string
        }
        Returns: Json
      }
      update_sales_followup: {
        Args: {
          p_followup_id: string
          p_scheduled_date: string
          p_scheduled_time: string
          p_reason: string
          p_notes?: string
        }
        Returns: Json
      }
      upsert_family_package_selection: {
        Args: {
          p_family_group_id: string
          p_student_id: string
          p_package_id: string
          p_custom_price?: number
          p_currency?: string
          p_notes?: string
        }
        Returns: Json
      }
      validate_family_package_selections: {
        Args: { p_family_group_id: string }
        Returns: Json
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

type DefaultSchema = Database[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
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
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
    | { schema: keyof Database },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof Database },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends { schema: keyof Database }
  ? Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
