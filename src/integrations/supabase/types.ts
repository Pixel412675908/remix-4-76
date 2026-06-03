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
      accounts: {
        Row: {
          account_type: string
          adult_password_hash: string | null
          allow_adult: boolean
          allow_explicit: boolean
          avatar_url: string | null
          content_filters: string[]
          content_types: string[]
          continuity: boolean
          created_at: string
          discovery: string
          display_name: string
          era: string
          favorite_genres: string[]
          format: string
          id: string
          intensity: string
          language: string
          onboarded: boolean
          onboarding_step: number
          origin: string
          recommendations: boolean
          updated_at: string
        }
        Insert: {
          account_type?: string
          adult_password_hash?: string | null
          allow_adult?: boolean
          allow_explicit?: boolean
          avatar_url?: string | null
          content_filters?: string[]
          content_types?: string[]
          continuity?: boolean
          created_at?: string
          discovery?: string
          display_name?: string
          era?: string
          favorite_genres?: string[]
          format?: string
          id: string
          intensity?: string
          language?: string
          onboarded?: boolean
          onboarding_step?: number
          origin?: string
          recommendations?: boolean
          updated_at?: string
        }
        Update: {
          account_type?: string
          adult_password_hash?: string | null
          allow_adult?: boolean
          allow_explicit?: boolean
          avatar_url?: string | null
          content_filters?: string[]
          content_types?: string[]
          continuity?: boolean
          created_at?: string
          discovery?: string
          display_name?: string
          era?: string
          favorite_genres?: string[]
          format?: string
          id?: string
          intensity?: string
          language?: string
          onboarded?: boolean
          onboarding_step?: number
          origin?: string
          recommendations?: boolean
          updated_at?: string
        }
        Relationships: []
      }
      empty_searches: {
        Row: {
          count: number
          email: string | null
          first_searched_at: string
          id: string
          last_searched_at: string
          term: string
          user_id: string
        }
        Insert: {
          count?: number
          email?: string | null
          first_searched_at?: string
          id?: string
          last_searched_at?: string
          term: string
          user_id: string
        }
        Update: {
          count?: number
          email?: string | null
          first_searched_at?: string
          id?: string
          last_searched_at?: string
          term?: string
          user_id?: string
        }
        Relationships: []
      }
      explorer_usage: {
        Row: {
          created_at: string
          episode_number: number | null
          guest_id: string
          id: string
          media_id: number
          media_type: string
          seconds_watched: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          episode_number?: number | null
          guest_id: string
          id?: string
          media_id: number
          media_type: string
          seconds_watched?: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          episode_number?: number | null
          guest_id?: string
          id?: string
          media_id?: number
          media_type?: string
          seconds_watched?: number
          updated_at?: string
        }
        Relationships: []
      }
      my_list: {
        Row: {
          account_id: string
          created_at: string
          id: string
          media_id: number
        }
        Insert: {
          account_id: string
          created_at?: string
          id?: string
          media_id: number
        }
        Update: {
          account_id?: string
          created_at?: string
          id?: string
          media_id?: number
        }
        Relationships: [
          {
            foreignKeyName: "my_list_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "accounts"
            referencedColumns: ["id"]
          },
        ]
      }
      title_suggestions: {
        Row: {
          category: string
          created_at: string
          email: string | null
          id: string
          note: string | null
          title: string
          user_id: string
        }
        Insert: {
          category: string
          created_at?: string
          email?: string | null
          id?: string
          note?: string | null
          title: string
          user_id: string
        }
        Update: {
          category?: string
          created_at?: string
          email?: string | null
          id?: string
          note?: string | null
          title?: string
          user_id?: string
        }
        Relationships: []
      }
      tmdb_cache: {
        Row: {
          cache_key: string
          expires_at: string
          payload: Json
          updated_at: string
        }
        Insert: {
          cache_key: string
          expires_at: string
          payload: Json
          updated_at?: string
        }
        Update: {
          cache_key?: string
          expires_at?: string
          payload?: Json
          updated_at?: string
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
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      record_empty_search: {
        Args: { _email: string; _term: string }
        Returns: undefined
      }
    }
    Enums: {
      app_role: "admin" | "user"
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
    },
  },
} as const
