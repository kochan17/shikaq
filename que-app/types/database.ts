export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  graphql_public: {
    Tables: {
      [_ in never]: never
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      graphql: {
        Args: {
          extensions?: Json
          operationName?: string
          query?: string
          variables?: Json
        }
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
  public: {
    Tables: {
      ai_qa_history: {
        Row: {
          answer: string | null
          created_at: string
          id: string
          question: string
          source_lesson_id: string | null
          user_id: string
        }
        Insert: {
          answer?: string | null
          created_at?: string
          id?: string
          question: string
          source_lesson_id?: string | null
          user_id: string
        }
        Update: {
          answer?: string | null
          created_at?: string
          id?: string
          question?: string
          source_lesson_id?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "ai_qa_history_source_lesson_id_fkey"
            columns: ["source_lesson_id"]
            isOneToOne: false
            referencedRelation: "lessons"
            referencedColumns: ["id"]
          },
        ]
      }
      bookmarks: {
        Row: {
          created_at: string
          id: string
          target_id: string
          target_type: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          target_id: string
          target_type: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          target_id?: string
          target_type?: string
          user_id?: string
        }
        Relationships: []
      }
      certifications: {
        Row: {
          category: string
          created_at: string
          description: string | null
          id: string
          is_published: boolean
          name: string
          order_index: number
          slug: string
        }
        Insert: {
          category: string
          created_at?: string
          description?: string | null
          id?: string
          is_published?: boolean
          name: string
          order_index?: number
          slug: string
        }
        Update: {
          category?: string
          created_at?: string
          description?: string | null
          id?: string
          is_published?: boolean
          name?: string
          order_index?: number
          slug?: string
        }
        Relationships: []
      }
      courses: {
        Row: {
          certification_id: string
          created_at: string
          description: string | null
          id: string
          is_published: boolean
          order_index: number
          thumbnail_url: string | null
          title: string
        }
        Insert: {
          certification_id: string
          created_at?: string
          description?: string | null
          id?: string
          is_published?: boolean
          order_index?: number
          thumbnail_url?: string | null
          title: string
        }
        Update: {
          certification_id?: string
          created_at?: string
          description?: string | null
          id?: string
          is_published?: boolean
          order_index?: number
          thumbnail_url?: string | null
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "courses_certification_id_fkey"
            columns: ["certification_id"]
            isOneToOne: false
            referencedRelation: "certifications"
            referencedColumns: ["id"]
          },
        ]
      }
      daily_activity: {
        Row: {
          completed: boolean | null
          date: string
          learn_count: number
          learn_goal: number
          recall_count: number
          recall_goal: number
          user_id: string
        }
        Insert: {
          completed?: boolean | null
          date: string
          learn_count?: number
          learn_goal?: number
          recall_count?: number
          recall_goal?: number
          user_id: string
        }
        Update: {
          completed?: boolean | null
          date?: string
          learn_count?: number
          learn_goal?: number
          recall_count?: number
          recall_goal?: number
          user_id?: string
        }
        Relationships: []
      }
      embeddings: {
        Row: {
          certification_slug: string | null
          content: string
          created_at: string
          embedding: string | null
          id: string
          metadata: Json | null
          source_id: string | null
          source_type: string
        }
        Insert: {
          certification_slug?: string | null
          content: string
          created_at?: string
          embedding?: string | null
          id?: string
          metadata?: Json | null
          source_id?: string | null
          source_type: string
        }
        Update: {
          certification_slug?: string | null
          content?: string
          created_at?: string
          embedding?: string | null
          id?: string
          metadata?: Json | null
          source_id?: string | null
          source_type?: string
        }
        Relationships: [
          {
            foreignKeyName: "embeddings_certification_slug_fkey"
            columns: ["certification_slug"]
            isOneToOne: false
            referencedRelation: "certifications"
            referencedColumns: ["slug"]
          },
        ]
      }
      lessons: {
        Row: {
          audio_storage_path: string | null
          body: string | null
          content_type: string
          created_at: string
          duration_seconds: number | null
          id: string
          is_published: boolean
          order_index: number
          section_id: string
          title: string
        }
        Insert: {
          audio_storage_path?: string | null
          body?: string | null
          content_type: string
          created_at?: string
          duration_seconds?: number | null
          id?: string
          is_published?: boolean
          order_index?: number
          section_id: string
          title: string
        }
        Update: {
          audio_storage_path?: string | null
          body?: string | null
          content_type?: string
          created_at?: string
          duration_seconds?: number | null
          id?: string
          is_published?: boolean
          order_index?: number
          section_id?: string
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "lessons_section_id_fkey"
            columns: ["section_id"]
            isOneToOne: false
            referencedRelation: "sections"
            referencedColumns: ["id"]
          },
        ]
      }
      notifications: {
        Row: {
          body: string | null
          created_at: string
          id: string
          kind: string
          link: string | null
          read_at: string | null
          title: string
          user_id: string
        }
        Insert: {
          body?: string | null
          created_at?: string
          id?: string
          kind: string
          link?: string | null
          read_at?: string | null
          title: string
          user_id: string
        }
        Update: {
          body?: string | null
          created_at?: string
          id?: string
          kind?: string
          link?: string | null
          read_at?: string | null
          title?: string
          user_id?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          calm_mode: boolean
          calm_mode_until: string | null
          created_at: string
          display_name: string | null
          evening_notification_enabled: boolean
          id: string
          morning_notification_enabled: boolean
          paused_until: string | null
          preferred_certification: string | null
          role: string
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          calm_mode?: boolean
          calm_mode_until?: string | null
          created_at?: string
          display_name?: string | null
          evening_notification_enabled?: boolean
          id: string
          morning_notification_enabled?: boolean
          paused_until?: string | null
          preferred_certification?: string | null
          role?: string
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          calm_mode?: boolean
          calm_mode_until?: string | null
          created_at?: string
          display_name?: string | null
          evening_notification_enabled?: boolean
          id?: string
          morning_notification_enabled?: boolean
          paused_until?: string | null
          preferred_certification?: string | null
          role?: string
          updated_at?: string
        }
        Relationships: []
      }
      progress: {
        Row: {
          completed_at: string
          id: string
          lesson_id: string
          user_id: string
        }
        Insert: {
          completed_at?: string
          id?: string
          lesson_id: string
          user_id: string
        }
        Update: {
          completed_at?: string
          id?: string
          lesson_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "progress_lesson_id_fkey"
            columns: ["lesson_id"]
            isOneToOne: false
            referencedRelation: "lessons"
            referencedColumns: ["id"]
          },
        ]
      }
      questions: {
        Row: {
          choices: Json | null
          correct_choice_id: string | null
          created_at: string
          explanation: string | null
          format: string
          id: string
          lesson_id: string
          order_index: number
          question_text: string
          status: string
        }
        Insert: {
          choices?: Json | null
          correct_choice_id?: string | null
          created_at?: string
          explanation?: string | null
          format: string
          id?: string
          lesson_id: string
          order_index?: number
          question_text: string
          status?: string
        }
        Update: {
          choices?: Json | null
          correct_choice_id?: string | null
          created_at?: string
          explanation?: string | null
          format?: string
          id?: string
          lesson_id?: string
          order_index?: number
          question_text?: string
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "questions_lesson_id_fkey"
            columns: ["lesson_id"]
            isOneToOne: false
            referencedRelation: "lessons"
            referencedColumns: ["id"]
          },
        ]
      }
      questions_review_state: {
        Row: {
          difficulty: number
          due_at: string
          lapses: number
          last_review_at: string | null
          question_id: string
          reps: number
          stability: number
          user_id: string
        }
        Insert: {
          difficulty?: number
          due_at?: string
          lapses?: number
          last_review_at?: string | null
          question_id: string
          reps?: number
          stability?: number
          user_id: string
        }
        Update: {
          difficulty?: number
          due_at?: string
          lapses?: number
          last_review_at?: string | null
          question_id?: string
          reps?: number
          stability?: number
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "questions_review_state_question_id_fkey"
            columns: ["question_id"]
            isOneToOne: false
            referencedRelation: "questions"
            referencedColumns: ["id"]
          },
        ]
      }
      quiz_results: {
        Row: {
          answered_at: string
          id: string
          is_correct: boolean
          question_id: string
          selected_choice_id: string | null
          user_id: string
        }
        Insert: {
          answered_at?: string
          id?: string
          is_correct: boolean
          question_id: string
          selected_choice_id?: string | null
          user_id: string
        }
        Update: {
          answered_at?: string
          id?: string
          is_correct?: boolean
          question_id?: string
          selected_choice_id?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "quiz_results_question_id_fkey"
            columns: ["question_id"]
            isOneToOne: false
            referencedRelation: "questions"
            referencedColumns: ["id"]
          },
        ]
      }
      section_mastery: {
        Row: {
          score: number
          section_id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          score?: number
          section_id: string
          updated_at?: string
          user_id: string
        }
        Update: {
          score?: number
          section_id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "section_mastery_section_id_fkey"
            columns: ["section_id"]
            isOneToOne: false
            referencedRelation: "sections"
            referencedColumns: ["id"]
          },
        ]
      }
      sections: {
        Row: {
          course_id: string
          created_at: string
          id: string
          is_published: boolean
          order_index: number
          title: string
        }
        Insert: {
          course_id: string
          created_at?: string
          id?: string
          is_published?: boolean
          order_index?: number
          title: string
        }
        Update: {
          course_id?: string
          created_at?: string
          id?: string
          is_published?: boolean
          order_index?: number
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "sections_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
        ]
      }
      streak_state: {
        Row: {
          current_streak: number
          freeze_count: number
          last_active_date: string | null
          longest_streak: number
          updated_at: string
          user_id: string
        }
        Insert: {
          current_streak?: number
          freeze_count?: number
          last_active_date?: string | null
          longest_streak?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          current_streak?: number
          freeze_count?: number
          last_active_date?: string | null
          longest_streak?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      subscriptions: {
        Row: {
          created_at: string
          current_period_end: string | null
          id: string
          source: string
          status: string
          stripe_customer_id: string | null
          stripe_subscription_id: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          current_period_end?: string | null
          id?: string
          source?: string
          status: string
          stripe_customer_id?: string | null
          stripe_subscription_id?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          current_period_end?: string | null
          id?: string
          source?: string
          status?: string
          stripe_customer_id?: string | null
          stripe_subscription_id?: string | null
          updated_at?: string
          user_id?: string
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
  graphql_public: {
    Enums: {},
  },
  public: {
    Enums: {},
  },
} as const
