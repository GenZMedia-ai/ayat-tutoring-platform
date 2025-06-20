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
      profiles: {
        Row: {
          approved_at: string | null
          approved_by: string | null
          created_at: string
          email: string
          full_name: string
          id: string
          language: string
          phone: string
          role: string
          status: string
          teacher_type: string | null
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
          phone: string
          role: string
          status?: string
          teacher_type?: string | null
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
          phone?: string
          role?: string
          status?: string
          teacher_type?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      sessions: {
        Row: {
          actual_minutes: number | null
          completed_at: string | null
          created_at: string
          id: string
          notes: string | null
          reschedule_count: number
          scheduled_date: string
          scheduled_time: string
          session_number: number
          status: string
          student_id: string
          updated_at: string
        }
        Insert: {
          actual_minutes?: number | null
          completed_at?: string | null
          created_at?: string
          id?: string
          notes?: string | null
          reschedule_count?: number
          scheduled_date: string
          scheduled_time: string
          session_number?: number
          status?: string
          student_id: string
          updated_at?: string
        }
        Update: {
          actual_minutes?: number | null
          completed_at?: string | null
          created_at?: string
          id?: string
          notes?: string | null
          reschedule_count?: number
          scheduled_date?: string
          scheduled_time?: string
          session_number?: number
          status?: string
          student_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "sessions_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
        ]
      }
      students: {
        Row: {
          age: number
          assigned_sales_agent_id: string
          assigned_supervisor_id: string | null
          assigned_teacher_id: string | null
          country: string
          created_at: string
          id: string
          name: string
          notes: string | null
          parent_name: string | null
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
          id?: string
          name: string
          notes?: string | null
          parent_name?: string | null
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
          id?: string
          name?: string
          notes?: string | null
          parent_name?: string | null
          phone?: string
          platform?: string
          status?: string
          teacher_type?: string
          trial_date?: string | null
          trial_time?: string | null
          unique_id?: string
          updated_at?: string
        }
        Relationships: []
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
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      assign_teacher_round_robin: {
        Args: {
          teacher_type_param: string
          trial_date_param: string
          trial_time_param: string
        }
        Returns: string
      }
      generate_student_unique_id: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      get_egypt_current_date: {
        Args: Record<PropertyKey, never>
        Returns: string
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
