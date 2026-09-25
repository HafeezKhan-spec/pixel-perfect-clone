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
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      job_details: {
        Row: {
          ae_service: string
          company: string
          contact: string
          created_at: string
          date_contacted: string | null
          date_posted: string
          decision_maker: string
          industry: string
          intent_score: number
          is_reposted: boolean
          job_description: string
          job_id: string
          job_title: string
          meeting: boolean
          meeting_date: string | null
          opportunity: boolean
          opportunity_notes: string | null
          outreach_angle: string
          reason_for_score: string
          response: string | null
          revenue: number | null
          signal_category: string
          similar_jobs_count: number
          source: string
          updated_at: string
          website: string
        }
        Insert: {
          ae_service?: string
          company: string
          contact?: string
          created_at?: string
          date_contacted?: string | null
          date_posted: string
          decision_maker?: string
          industry?: string
          intent_score?: number
          is_reposted?: boolean
          job_description?: string
          job_id: string
          job_title: string
          meeting?: boolean
          meeting_date?: string | null
          opportunity?: boolean
          opportunity_notes?: string | null
          outreach_angle?: string
          reason_for_score?: string
          response?: string | null
          revenue?: number | null
          signal_category?: string
          similar_jobs_count?: number
          source?: string
          updated_at?: string
          website?: string
        }
        Update: {
          ae_service?: string
          company?: string
          contact?: string
          created_at?: string
          date_contacted?: string | null
          date_posted?: string
          decision_maker?: string
          industry?: string
          intent_score?: number
          is_reposted?: boolean
          job_description?: string
          job_id?: string
          job_title?: string
          meeting?: boolean
          meeting_date?: string | null
          opportunity?: boolean
          opportunity_notes?: string | null
          outreach_angle?: string
          reason_for_score?: string
          response?: string | null
          revenue?: number | null
          signal_category?: string
          similar_jobs_count?: number
          source?: string
          updated_at?: string
          website?: string
        }
        Relationships: []
      }
      search_jobs: {
        Row: {
          apply_url: string
          company: string
          created_at: string
          days_ago: number
          employment_type: string
          id: string
          is_new: boolean
          job_id: string
          job_title: string
          location: string
          matched_keywords: string[]
          platform: string
          posted_date: string
          search_id: string
        }
        Insert: {
          apply_url: string
          company: string
          created_at?: string
          days_ago?: number
          employment_type: string
          id?: string
          is_new?: boolean
          job_id: string
          job_title: string
          location?: string
          matched_keywords?: string[]
          platform: string
          posted_date: string
          search_id: string
        }
        Update: {
          apply_url?: string
          company?: string
          created_at?: string
          days_ago?: number
          employment_type?: string
          id?: string
          is_new?: boolean
          job_id?: string
          job_title?: string
          location?: string
          matched_keywords?: string[]
          platform?: string
          posted_date?: string
          search_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "search_jobs_search_id_fkey"
            columns: ["search_id"]
            isOneToOne: false
            referencedRelation: "searches"
            referencedColumns: ["id"]
          },
        ]
      }
      searches: {
        Row: {
          created_at: string
          id: string
          keywords: string[]
          location: string
          new_results_count: number
          total_results: number
        }
        Insert: {
          created_at?: string
          id?: string
          keywords: string[]
          location?: string
          new_results_count?: number
          total_results?: number
        }
        Update: {
          created_at?: string
          id?: string
          keywords?: string[]
          location?: string
          new_results_count?: number
          total_results?: number
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
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
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
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
