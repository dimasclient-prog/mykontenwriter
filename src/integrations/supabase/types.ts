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
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      articles: {
        Row: {
          content: string | null
          created_at: string
          id: string
          project_id: string
          status: Database["public"]["Enums"]["article_status"]
          title: string
          updated_at: string
          word_count: number | null
        }
        Insert: {
          content?: string | null
          created_at?: string
          id?: string
          project_id: string
          status?: Database["public"]["Enums"]["article_status"]
          title: string
          updated_at?: string
          word_count?: number | null
        }
        Update: {
          content?: string | null
          created_at?: string
          id?: string
          project_id?: string
          status?: Database["public"]["Enums"]["article_status"]
          title?: string
          updated_at?: string
          word_count?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "articles_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      master_settings: {
        Row: {
          ai_provider: Database["public"]["Enums"]["ai_provider"]
          api_key: string | null
          created_at: string
          deepseek_api_key: string | null
          default_article_length: number
          default_brand_voice: string | null
          default_model: string
          gemini_api_key: string | null
          id: string
          openai_api_key: string | null
          qwen_api_key: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          ai_provider?: Database["public"]["Enums"]["ai_provider"]
          api_key?: string | null
          created_at?: string
          deepseek_api_key?: string | null
          default_article_length?: number
          default_brand_voice?: string | null
          default_model?: string
          gemini_api_key?: string | null
          id?: string
          openai_api_key?: string | null
          qwen_api_key?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          ai_provider?: Database["public"]["Enums"]["ai_provider"]
          api_key?: string | null
          created_at?: string
          deepseek_api_key?: string | null
          default_article_length?: number
          default_brand_voice?: string | null
          default_model?: string
          gemini_api_key?: string | null
          id?: string
          openai_api_key?: string | null
          qwen_api_key?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      projects: {
        Row: {
          brand_voice: string | null
          business_address: string | null
          business_context: string | null
          business_email: string | null
          business_name: string | null
          business_phone: string | null
          created_at: string
          custom_language: string | null
          id: string
          keywords: string[] | null
          language: Database["public"]["Enums"]["project_language"]
          mode: Database["public"]["Enums"]["project_mode"]
          name: string
          pain_points: string[] | null
          persona: string | null
          product: string | null
          reference_file_url: string | null
          reference_text: string | null
          strategy_pack: Json | null
          target_market: string | null
          updated_at: string
          user_id: string
          value_proposition: string | null
          website_url: string | null
          wordpress_password: string | null
          wordpress_url: string | null
          wordpress_username: string | null
        }
        Insert: {
          brand_voice?: string | null
          business_address?: string | null
          business_context?: string | null
          business_email?: string | null
          business_name?: string | null
          business_phone?: string | null
          created_at?: string
          custom_language?: string | null
          id?: string
          keywords?: string[] | null
          language?: Database["public"]["Enums"]["project_language"]
          mode?: Database["public"]["Enums"]["project_mode"]
          name: string
          pain_points?: string[] | null
          persona?: string | null
          product?: string | null
          reference_file_url?: string | null
          reference_text?: string | null
          strategy_pack?: Json | null
          target_market?: string | null
          updated_at?: string
          user_id: string
          value_proposition?: string | null
          website_url?: string | null
          wordpress_password?: string | null
          wordpress_url?: string | null
          wordpress_username?: string | null
        }
        Update: {
          brand_voice?: string | null
          business_address?: string | null
          business_context?: string | null
          business_email?: string | null
          business_name?: string | null
          business_phone?: string | null
          created_at?: string
          custom_language?: string | null
          id?: string
          keywords?: string[] | null
          language?: Database["public"]["Enums"]["project_language"]
          mode?: Database["public"]["Enums"]["project_mode"]
          name?: string
          pain_points?: string[] | null
          persona?: string | null
          product?: string | null
          reference_file_url?: string | null
          reference_text?: string | null
          strategy_pack?: Json | null
          target_market?: string | null
          updated_at?: string
          user_id?: string
          value_proposition?: string | null
          website_url?: string | null
          wordpress_password?: string | null
          wordpress_url?: string | null
          wordpress_username?: string | null
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
          role?: Database["public"]["Enums"]["app_role"]
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
      decrypt_api_key: { Args: { encrypted_key: string }; Returns: string }
      encrypt_api_key: { Args: { plain_key: string }; Returns: string }
      get_user_api_key: {
        Args: { p_user_id: string }
        Returns: {
          ai_provider: string
          api_key: string
          default_model: string
        }[]
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      ai_provider: "openai" | "gemini" | "deepseek" | "qwen"
      app_role: "admin" | "user"
      article_status: "todo" | "in-progress" | "completed"
      project_language: "indonesian" | "english" | "other"
      project_mode: "auto" | "advanced"
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
      ai_provider: ["openai", "gemini", "deepseek", "qwen"],
      app_role: ["admin", "user"],
      article_status: ["todo", "in-progress", "completed"],
      project_language: ["indonesian", "english", "other"],
      project_mode: ["auto", "advanced"],
    },
  },
} as const
