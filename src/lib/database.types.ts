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
      game_players: {
        Row: {
          final_chips: number
          game_id: string
          id: string
          initial_chips: number
          player_id: string
          profit: number
          rebuys: number
        }
        Insert: {
          final_chips: number
          game_id: string
          id?: string
          initial_chips: number
          player_id: string
          profit: number
          rebuys?: number
        }
        Update: {
          final_chips?: number
          game_id?: string
          id?: string
          initial_chips?: number
          player_id?: string
          profit?: number
          rebuys?: number
        }
        Relationships: [
          {
            foreignKeyName: "game_players_game_id_fkey"
            columns: ["game_id"]
            isOneToOne: false
            referencedRelation: "games"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "game_players_player_id_fkey"
            columns: ["player_id"]
            isOneToOne: false
            referencedRelation: "players"
            referencedColumns: ["id"]
          },
        ]
      }
      games: {
        Row: {
          buy_in: number
          chip_value: number
          created_at: string
          id: string
          loser_photo_url: string | null
          name: string | null
          notes: string | null
          status: string
          total_pot: number
        }
        Insert: {
          buy_in: number
          chip_value: number
          created_at?: string
          id?: string
          loser_photo_url?: string | null
          name?: string | null
          notes?: string | null
          status?: string
          total_pot?: number
        }
        Update: {
          buy_in?: number
          chip_value?: number
          created_at?: string
          id?: string
          loser_photo_url?: string | null
          name?: string | null
          notes?: string | null
          status?: string
          total_pot?: number
        }
        Relationships: []
      }
      live_players: {
        Row: {
          current_chips: number
          current_profit: number
          id: string
          is_active: boolean
          is_on_break: boolean
          joined_at: string
          left_at: string | null
          player_id: string
          session_id: string
          table_position: number | null
          total_buy_in: number
          total_rebuys: number
        }
        Insert: {
          current_chips: number
          current_profit?: number
          id?: string
          is_active?: boolean
          is_on_break?: boolean
          joined_at?: string
          left_at?: string | null
          player_id: string
          session_id: string
          table_position?: number | null
          total_buy_in?: number
          total_rebuys?: number
        }
        Update: {
          current_chips?: number
          current_profit?: number
          id?: string
          is_active?: boolean
          is_on_break?: boolean
          joined_at?: string
          left_at?: string | null
          player_id?: string
          session_id?: string
          table_position?: number | null
          total_buy_in?: number
          total_rebuys?: number
        }
        Relationships: [
          {
            foreignKeyName: "live_players_player_id_fkey"
            columns: ["player_id"]
            isOneToOne: false
            referencedRelation: "players"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "live_players_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "live_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      live_sessions: {
        Row: {
          buy_in: number
          chip_value: number
          created_at: string
          current_hand: number
          ended_at: string | null
          game_id: string | null
          id: string
          name: string | null
          notes: string | null
          started_at: string
          status: string
          total_duration_seconds: number
        }
        Insert: {
          buy_in: number
          chip_value: number
          created_at?: string
          current_hand?: number
          ended_at?: string | null
          game_id?: string | null
          id?: string
          name?: string | null
          notes?: string | null
          started_at?: string
          status?: string
          total_duration_seconds?: number
        }
        Update: {
          buy_in?: number
          chip_value?: number
          created_at?: string
          current_hand?: number
          ended_at?: string | null
          game_id?: string | null
          id?: string
          name?: string | null
          notes?: string | null
          started_at?: string
          status?: string
          total_duration_seconds?: number
        }
        Relationships: [
          {
            foreignKeyName: "live_sessions_game_id_fkey"
            columns: ["game_id"]
            isOneToOne: false
            referencedRelation: "games"
            referencedColumns: ["id"]
          },
        ]
      }
      players: {
        Row: {
          avatar_color: string | null
          avatar_url: string | null
          created_at: string
          id: string
          is_active: boolean | null
          name: string
        }
        Insert: {
          avatar_color?: string | null
          avatar_url?: string | null
          created_at?: string
          id?: string
          is_active?: boolean | null
          name: string
        }
        Update: {
          avatar_color?: string | null
          avatar_url?: string | null
          created_at?: string
          id?: string
          is_active?: boolean | null
          name?: string
        }
        Relationships: []
      }
      session_events: {
        Row: {
          created_at: string
          event_data: Json | null
          event_type: string
          id: string
          player_id: string | null
          session_id: string
        }
        Insert: {
          created_at?: string
          event_data?: Json | null
          event_type: string
          id?: string
          player_id?: string | null
          session_id: string
        }
        Update: {
          created_at?: string
          event_data?: Json | null
          event_type?: string
          id?: string
          player_id?: string | null
          session_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "session_events_player_id_fkey"
            columns: ["player_id"]
            isOneToOne: false
            referencedRelation: "players"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "session_events_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "live_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      create_live_session_from_game: {
        Args: { p_game_id: string; p_session_name?: string }
        Returns: string
      }
      get_live_session_stats: {
        Args: { p_session_id: string }
        Returns: {
          active_players: number
          avg_profit_per_player: number
          hands_per_hour: number
          session_duration_seconds: number
          total_players: number
          total_pot: number
          total_rebuys: number
        }[]
      }
      get_player_stats: {
        Args: { p_player_id: string }
        Returns: {
          average_per_game: number
          best_game: number
          losses: number
          total_balance: number
          total_games: number
          win_rate: number
          wins: number
          worst_game: number
        }[]
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
  graphql_public: {
    Enums: {},
  },
  public: {
    Enums: {},
  },
} as const

